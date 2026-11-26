import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { RolePermission } from '@/entities/role-permission.entity';
import { Role } from '@/entities/user.entity';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

/**
 * Guard de permissions — vérifie que le rôle de l'utilisateur a la permission requise
 * dans la table role_permissions.
 *
 * Usage : @UseGuards(JwtAuthGuard, PermissionsGuard) + @Permissions('country.create')
 * SUPER_ADMIN bypasse toutes les permissions (accès total).
 * Si aucun @Permissions n'est posé, la route est accessible à tout utilisateur authentifié.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(RolePermission)
    private readonly rpRepo: Repository<RolePermission>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.roles) {
      throw new ForbiddenException('Accès refusé.');
    }

    if (user.roles.includes(Role.SUPER_ADMIN)) {
      return true;
    }

    try {
      const grants = await this.rpRepo.find({
        where: {
          role: In(user.roles),
          permission: In(requiredPermissions),
          granted: true,
        },
      });

      const grantedPerms = new Set(grants.map((g) => g.permission));
      const hasAll = requiredPermissions.every((p) => grantedPerms.has(p));

      if (!hasAll) {
        throw new ForbiddenException('Accès refusé.');
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      throw new ForbiddenException('Accès refusé.');
    }
  }
}
