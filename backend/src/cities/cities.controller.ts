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
import { CitiesService } from './cities.service';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/entities/user.entity';

/**
 * CRUD Villes — /api/v1/cities
 *
 * GET    /                     → liste toutes les villes (public)
 * GET    /?countryId=xxx       → liste les villes d'un pays (public)
 * GET    /:id                  → détail d'une ville (public)
 * POST   /                     → créer une ville (ADMIN, SUPER_ADMIN)
 * PATCH  /:id                  → modifier une ville (ADMIN, SUPER_ADMIN)
 * DELETE /:id                  → supprimer une ville (SUPER_ADMIN uniquement)
 */
@Controller('cities')
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  /** Liste toutes les villes. Si ?countryId est fourni, filtre par pays. Public. Cache 5 min. */
  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000)
  findAll(@Query('countryId') countryId?: string) {
    if (countryId) {
      return this.citiesService.findByCountry(countryId);
    }
    return this.citiesService.findAll();
  }

  /** Récupère une ville par son UUID — accessible à tous. Cache 5 min. */
  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000)
  findOne(@Param('id') id: string) {
    return this.citiesService.findOne(id);
  }

  /** Crée une nouvelle ville — réservé aux ADMIN et SUPER_ADMIN. */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  create(@Body() dto: CreateCityDto) {
    return this.citiesService.create(dto);
  }

  /** Modifie une ville existante — réservé aux ADMIN et SUPER_ADMIN. */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateCityDto) {
    return this.citiesService.update(id, dto);
  }

  /** Supprime une ville — réservé au SUPER_ADMIN uniquement. */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.citiesService.remove(id);
  }
}
