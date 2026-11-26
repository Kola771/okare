import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * Module de rate limiting global.
 *
 * - Limite par défaut : 100 requêtes / minute (configurable via THROTTLE_TTL et THROTTLE_LIMIT).
 * - Le throttle "auth" (10 req/min) est appliqué via @Throttle() sur les routes d'auth.
 * - Protège contre le brute-force et les abus.
 */
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: config.get<number>('THROTTLE_TTL', 60000),
            limit: config.get<number>('THROTTLE_LIMIT', 100),
          },
          {
            name: 'auth',
            ttl: config.get<number>('THROTTLE_AUTH_TTL', 60000),
            limit: config.get<number>('THROTTLE_AUTH_LIMIT', 10),
          },
        ],
      }),
    }),
  ],
})
export class AppThrottleModule {}
