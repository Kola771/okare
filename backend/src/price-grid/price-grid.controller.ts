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
import { PriceGridService } from './price-grid.service';
import { CreatePriceGridDto } from './dto/create-price-grid.dto';
import { UpdatePriceGridDto } from './dto/update-price-grid.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Role } from '@/entities/user.entity';
import { User } from '@/entities/user.entity';

/**
 * CRUD Grille tarifaire — /api/v1/price-grid
 *
 * GET    /                        → liste toute la grille (public — les vendeurs voient les prix)
 * GET    /?categoryId=xxx         → prix d'une catégorie de zone (public)
 * GET    /:id                     → détail d'un tarif (public)
 * POST   /                        → créer un tarif (ADMIN, SUPER_ADMIN)
 * PATCH  /:id                     → modifier un tarif (ADMIN, SUPER_ADMIN)
 * DELETE /:id                     → supprimer un tarif (SUPER_ADMIN uniquement)
 */
@Controller('price-grid')
export class PriceGridController {
  constructor(private readonly priceGridService: PriceGridService) {}

  /** Liste toute la grille tarifaire. Si ?categoryId est fourni, filtre par catégorie. Public. Cache 5 min. */
  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000)
  findAll(@Query('categoryId') categoryId?: string) {
    if (categoryId) {
      return this.priceGridService.findByCategory(categoryId);
    }
    return this.priceGridService.findAll();
  }

  /** Récupère un tarif par son UUID — accessible à tous. Cache 5 min. */
  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000)
  findOne(@Param('id') id: string) {
    return this.priceGridService.findOne(id);
  }

  /** Crée un nouveau tarif — réservé aux ADMIN et SUPER_ADMIN. Enregistre l'auteur. */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  create(@Body() dto: CreatePriceGridDto, @CurrentUser() user: User) {
    return this.priceGridService.create(dto, user.id);
  }

  /** Modifie un tarif existant — réservé aux ADMIN et SUPER_ADMIN. Enregistre l'auteur. */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdatePriceGridDto, @CurrentUser() user: User) {
    return this.priceGridService.update(id, dto, user.id);
  }

  /** Supprime un tarif — réservé au SUPER_ADMIN uniquement. */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.priceGridService.remove(id);
  }
}
