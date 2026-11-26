import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@/entities/user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Guard de rôles — vérifie que l'utilisateur connecté possède au moins un des rôles requis.
 *
 * Usage : @UseGuards(JwtAuthGuard, RolesGuard) + @Roles(Role.ADMIN, Role.SUPER_ADMIN)
 * Si aucun @Roles n'est posé, la route est accessible à tout utilisateur authentifié.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.roles) {
      throw new ForbiddenException('Accès refusé.');
    }

    const hasRole = user.roles.some((role: Role) => requiredRoles.includes(role));

    if (!hasRole) {
      throw new ForbiddenException('Accès refusé.');
    }

    return true;
  }
}
