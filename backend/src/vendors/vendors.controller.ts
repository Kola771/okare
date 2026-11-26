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
import { VendorsService } from './vendors.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Role, User } from '@/entities/user.entity';

/**
 * CRUD Vendeurs — /api/v1/vendors
 *
 * GET    /              → liste tous les vendeurs (ADMIN, FIELD_AGENT, SUPER_ADMIN)
 * GET    /:id           → détail d'un vendeur (ADMIN, FIELD_AGENT, SUPER_ADMIN)
 * POST   /              → créer un vendeur (ADMIN, FIELD_AGENT, SUPER_ADMIN)
 * PATCH  /:id           → modifier un vendeur (ADMIN, FIELD_AGENT, SUPER_ADMIN)
 * DELETE /:id           → soft-delete un vendeur (SUPER_ADMIN uniquement)
 * PATCH  /:id/restore   → restaurer un vendeur supprimé (SUPER_ADMIN uniquement)
 */
@Controller('vendors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  /** Liste tous les vendeurs actifs — réservé aux ADMIN, FIELD_AGENT et SUPER_ADMIN. */
  @Get()
  @Roles(Role.ADMIN, Role.FIELD_AGENT, Role.SUPER_ADMIN)
  findAll() {
    return this.vendorsService.findAll();
  }

  /** Récupère un vendeur par son UUID — réservé aux ADMIN, FIELD_AGENT et SUPER_ADMIN. */
  @Get(':id')
  @Roles(Role.ADMIN, Role.FIELD_AGENT, Role.SUPER_ADMIN)
  findOne(@Param('id') id: string) {
    return this.vendorsService.findOne(id);
  }

  /** Crée un nouveau vendeur — réservé aux ADMIN, FIELD_AGENT et SUPER_ADMIN. Enregistre le créateur. */
  @Post()
  @Roles(Role.ADMIN, Role.FIELD_AGENT, Role.SUPER_ADMIN)
  create(@Body() dto: CreateVendorDto, @CurrentUser() user: User) {
    return this.vendorsService.create(dto, user.id);
  }

  /** Modifie un vendeur — réservé aux ADMIN, FIELD_AGENT et SUPER_ADMIN. */
  @Patch(':id')
  @Roles(Role.ADMIN, Role.FIELD_AGENT, Role.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateVendorDto) {
    return this.vendorsService.update(id, dto);
  }

  /** Soft-delete un vendeur — réservé au SUPER_ADMIN uniquement. */
  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.vendorsService.remove(id);
  }

  /** Restaure un vendeur supprimé — réservé au SUPER_ADMIN uniquement. */
  @Patch(':id/restore')
  @Roles(Role.SUPER_ADMIN)
  restore(@Param('id') id: string) {
    return this.vendorsService.restore(id);
  }
}
