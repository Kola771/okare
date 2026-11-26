import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { CountriesService } from './countries.service';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/entities/user.entity';

/**
 * CRUD Pays — /api/v1/countries
 *
 * GET    /              → liste tous les pays (public, pas de token requis)
 * GET    /:id           → détail d'un pays (public)
 * POST   /              → créer un pays (ADMIN, SUPER_ADMIN)
 * PATCH  /:id           → modifier un pays (ADMIN, SUPER_ADMIN)
 * DELETE /:id           → supprimer un pays (SUPER_ADMIN uniquement)
 */
@Controller('countries')
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  /** Liste tous les pays, triés par nom — accessible à tous, pas d'auth. */
  @Get()
  findAll() {
    return this.countriesService.findAll();
  }

  /** Récupère un pays par son UUID — accessible à tous, pas d'auth. */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.countriesService.findOne(id);
  }

  /** Crée un nouveau pays — réservé aux ADMIN et SUPER_ADMIN. */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  create(@Body() dto: CreateCountryDto) {
    return this.countriesService.create(dto);
  }

  /** Modifie un pays existant — réservé aux ADMIN et SUPER_ADMIN. */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateCountryDto) {
    return this.countriesService.update(id, dto);
  }

  /** Supprime un pays — réservé au SUPER_ADMIN uniquement. */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.countriesService.remove(id);
  }
}
