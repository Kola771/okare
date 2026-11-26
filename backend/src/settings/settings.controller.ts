import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpsertSettingDto } from './dto/upsert-setting.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Role, User } from '@/entities/user.entity';

/**
 * CRUD Paramètres — /api/v1/settings
 *
 * GET    /              → liste tous les paramètres (ADMIN, SUPER_ADMIN — données internes)
 * GET    /:key          → détail d'un paramètre (ADMIN, SUPER_ADMIN)
 * PUT    /              → créer ou modifier un paramètre (SUPER_ADMIN uniquement)
 * DELETE /:key          → supprimer un paramètre (SUPER_ADMIN uniquement)
 */
@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  /** Liste tous les paramètres — réservé aux ADMIN et SUPER_ADMIN. */
  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  findAll() {
    return this.settingsService.findAll();
  }

  /** Récupère un paramètre par sa clé — réservé aux ADMIN et SUPER_ADMIN. */
  @Get(':key')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  findOne(@Param('key') key: string) {
    return this.settingsService.findOne(key);
  }

  /** Crée ou met à jour un paramètre (upsert) — réservé au SUPER_ADMIN. Enregistre l'auteur. */
  @Put()
  @Roles(Role.SUPER_ADMIN)
  upsert(@Body() dto: UpsertSettingDto, @CurrentUser() user: User) {
    return this.settingsService.upsert(dto, user.id);
  }

  /** Supprime un paramètre — réservé au SUPER_ADMIN uniquement. */
  @Delete(':key')
  @Roles(Role.SUPER_ADMIN)
  remove(@Param('key') key: string) {
    return this.settingsService.remove(key);
  }
}
