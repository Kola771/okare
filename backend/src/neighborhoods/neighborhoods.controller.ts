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
import { NeighborhoodsService } from './neighborhoods.service';
import { CreateNeighborhoodDto } from './dto/create-neighborhood.dto';
import { UpdateNeighborhoodDto } from './dto/update-neighborhood.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/entities/user.entity';

/**
 * CRUD Quartiers — /api/v1/neighborhoods
 *
 * GET    /                   → liste tous les quartiers (public)
 * GET    /?zoneId=xxx        → liste les quartiers d'une zone (public)
 * GET    /:id                → détail d'un quartier (public)
 * POST   /                   → créer un quartier (ADMIN, FIELD_AGENT, SUPER_ADMIN)
 * PATCH  /:id                → modifier un quartier (ADMIN, FIELD_AGENT, SUPER_ADMIN)
 * DELETE /:id                → supprimer un quartier (SUPER_ADMIN uniquement)
 */
@Controller('neighborhoods')
export class NeighborhoodsController {
  constructor(private readonly neighborhoodsService: NeighborhoodsService) {}

  /** Liste tous les quartiers. Si ?zoneId est fourni, filtre par zone. Public. Cache 5 min. */
  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000)
  findAll(@Query('zoneId') zoneId?: string) {
    if (zoneId) {
      return this.neighborhoodsService.findByZone(zoneId);
    }
    return this.neighborhoodsService.findAll();
  }

  /** Récupère un quartier par son UUID — accessible à tous. Cache 5 min. */
  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000)
  findOne(@Param('id') id: string) {
    return this.neighborhoodsService.findOne(id);
  }

  /** Crée un nouveau quartier — réservé aux ADMIN, FIELD_AGENT et SUPER_ADMIN. */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.FIELD_AGENT, Role.SUPER_ADMIN)
  create(@Body() dto: CreateNeighborhoodDto) {
    return this.neighborhoodsService.create(dto);
  }

  /** Modifie un quartier — réservé aux ADMIN, FIELD_AGENT et SUPER_ADMIN. */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.FIELD_AGENT, Role.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateNeighborhoodDto) {
    return this.neighborhoodsService.update(id, dto);
  }

  /** Supprime un quartier — réservé au SUPER_ADMIN uniquement. */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.neighborhoodsService.remove(id);
  }
}
