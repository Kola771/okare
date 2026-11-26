import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-ioredis-yet';

/**
 * Module de cache Redis global.
 *
 * - Utilise cache-manager + ioredis pour stocker en mémoire Redis.
 * - TTL par défaut configurable via REDIS_TTL (en secondes, défaut 300 = 5 min).
 * - Si Redis n'est pas disponible, le cache échoue silencieusement (pas de crash).
 */
@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        store: await redisStore({
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get<string>('REDIS_PASSWORD', '') || undefined,
          ttl: config.get<number>('REDIS_TTL', 300) * 1000,
        }),
      }),
    }),
  ],
})
export class RedisCacheModule {}
