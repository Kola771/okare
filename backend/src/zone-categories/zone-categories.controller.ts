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
  Query,
} from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { ZoneCategoriesService } from './zone-categories.service';
import { CreateZoneCategoryDto } from './dto/create-zone-category.dto';
import { UpdateZoneCategoryDto } from './dto/update-zone-category.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/entities/user.entity';

/**
 * CRUD Catégories de zones — /api/v1/zone-categories
 *
 * GET    /                   → liste toutes les catégories (public)
 * GET    /?cityId=xxx        → liste les catégories d'une ville (public)
 * GET    /:id                → détail d'une catégorie (public)
 * POST   /                   → créer une catégorie (ADMIN, SUPER_ADMIN)
 * PATCH  /:id                → modifier une catégorie (ADMIN, SUPER_ADMIN)
 * DELETE /:id                → supprimer une catégorie (SUPER_ADMIN uniquement)
 */
@Controller('zone-categories')
export class ZoneCategoriesController {
  constructor(private readonly zoneCategoriesService: ZoneCategoriesService) {}

  /** Liste toutes les catégories. Si ?cityId est fourni, filtre par ville. Public. Cache 5 min. */
  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000)
  findAll(@Query('cityId') cityId?: string) {
    if (cityId) {
      return this.zoneCategoriesService.findByCity(cityId);
    }
    return this.zoneCategoriesService.findAll();
  }

  /** Récupère une catégorie par son UUID — accessible à tous. Cache 5 min. */
  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000)
  findOne(@Param('id') id: string) {
    return this.zoneCategoriesService.findOne(id);
  }

  /** Crée une nouvelle catégorie — réservé aux ADMIN et SUPER_ADMIN. */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  create(@Body() dto: CreateZoneCategoryDto) {
    return this.zoneCategoriesService.create(dto);
  }

  /** Modifie une catégorie existante — réservé aux ADMIN et SUPER_ADMIN. */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateZoneCategoryDto) {
    return this.zoneCategoriesService.update(id, dto);
  }

  /** Supprime une catégorie — réservé au SUPER_ADMIN uniquement. */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.zoneCategoriesService.remove(id);
  }
}
