import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { DishCategoriesService } from './dish-categories.service';
import { CreateDishCategoryDto } from './dto/create-dish-category.dto';
import { UpdateDishCategoryDto } from './dto/update-dish-category.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/entities/user.entity';

/**
 * CRUD Catégories de plats — /api/v1/dish-categories
 *
 * GET    /              → liste toutes les catégories (public — tout le monde voit le menu)
 * GET    /:id           → détail d'une catégorie (public)
 * POST   /              → créer une catégorie (ADMIN, SUPER_ADMIN)
 * PATCH  /:id           → modifier une catégorie (ADMIN, SUPER_ADMIN)
 * DELETE /:id           → supprimer une catégorie (SUPER_ADMIN uniquement)
 */
@Controller('dish-categories')
export class DishCategoriesController {
  constructor(private readonly dishCategoriesService: DishCategoriesService) {}

  /** Liste toutes les catégories de plats triées par ordre puis nom. Public. Cache 5 min. */
  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000)
  findAll() {
    return this.dishCategoriesService.findAll();
  }

  /** Récupère une catégorie par son UUID — accessible à tous. Cache 5 min. */
  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000)
  findOne(@Param('id') id: string) {
    return this.dishCategoriesService.findOne(id);
  }

  /** Crée une nouvelle catégorie de plat — réservé aux ADMIN et SUPER_ADMIN. */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  create(@Body() dto: CreateDishCategoryDto) {
    return this.dishCategoriesService.create(dto);
  }

  /** Modifie une catégorie de plat — réservé aux ADMIN et SUPER_ADMIN. */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateDishCategoryDto) {
    return this.dishCategoriesService.update(id, dto);
  }

  /** Supprime une catégorie de plat — réservé au SUPER_ADMIN uniquement. */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.dishCategoriesService.remove(id);
  }
}
