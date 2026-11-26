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
import { PublicHolidaysService } from './public-holidays.service';
import { CreatePublicHolidayDto } from './dto/create-public-holiday.dto';
import { UpdatePublicHolidayDto } from './dto/update-public-holiday.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { Role } from '@/entities/user.entity';

/**
 * CRUD Jours fériés — /api/v1/public-holidays
 *
 * GET    /                     → liste tous les jours fériés (public)
 * GET    /?countryId=xxx       → liste les jours fériés d'un pays (public)
 * GET    /:id                  → détail d'un jour férié (public)
 * POST   /                     → créer un jour férié (ADMIN, SUPER_ADMIN)
 * PATCH  /:id                  → modifier un jour férié (ADMIN, SUPER_ADMIN)
 * DELETE /:id                  → supprimer un jour férié (SUPER_ADMIN uniquement)
 */
@Controller('public-holidays')
export class PublicHolidaysController {
  constructor(private readonly publicHolidaysService: PublicHolidaysService) {}

  /** Liste tous les jours fériés. Si ?countryId est fourni, filtre par pays. Public. Cache 5 min. */
  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000)
  findAll(@Query('countryId') countryId?: string) {
    if (countryId) {
      return this.publicHolidaysService.findByCountry(countryId);
    }
    return this.publicHolidaysService.findAll();
  }

  /** Récupère un jour férié par son UUID — accessible à tous. Cache 5 min. */
  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000)
  findOne(@Param('id') id: string) {
    return this.publicHolidaysService.findOne(id);
  }

  /** Crée un nouveau jour férié — réservé aux ADMIN et SUPER_ADMIN. */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  create(@Body() dto: CreatePublicHolidayDto) {
    return this.publicHolidaysService.create(dto);
  }

  /** Modifie un jour férié — réservé aux ADMIN et SUPER_ADMIN. */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdatePublicHolidayDto) {
    return this.publicHolidaysService.update(id, dto);
  }

  /** Supprime un jour férié — réservé au SUPER_ADMIN uniquement. */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.publicHolidaysService.remove(id);
  }
}
