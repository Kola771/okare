import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Session } from '@/entities/session.entity';
import { User } from '@/entities/user.entity';

interface JwtPayload {
  sub: string;
  sid: string;
}

/**
 * Stratégie JWT Passport.
 *
 * - Extrait le token depuis le header Authorization: Bearer <token>
 * - Vérifie la session en BDD (non révoquée, non expirée)
 * - Vérifie que l'utilisateur existe et n'est pas bloqué
 * - Retourne l'objet User qui sera injecté dans req.user
 *
 * Le secret JWT et la durée sont lus depuis le .env (JWT_SECRET, JWT_EXPIRES_IN).
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectRepository(Session) private readonly sessionRepo: Repository<Session>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    try {
      const session = await this.sessionRepo.findOne({
        where: { id: payload.sid },
      });

      if (!session || session.revokedAt || session.expiresAt < new Date()) {
        throw new UnauthorizedException('Session expirée ou invalide.');
      }

      const user = await this.userRepo.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('Utilisateur introuvable.');
      }

      if (user.isBlocked) {
        throw new UnauthorizedException('Compte bloqué.');
      }

      return user;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Authentification échouée.');
    }
  }
}
