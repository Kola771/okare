import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

function canReachRedis(host: string, port: number, timeoutMs = 2000): Promise<boolean> {
  return new Promise((resolve) => {
    const client = new Redis({ host, port, lazyConnect: true, maxRetriesPerRequest: 0, retryStrategy: () => null });
    client.on('error', () => {});
    const timer = setTimeout(() => { client.disconnect(); resolve(false); }, timeoutMs);
    client.connect()
      .then(() => { clearTimeout(timer); client.disconnect(); resolve(true); })
      .catch(() => { clearTimeout(timer); client.disconnect(); resolve(false); });
  });
}

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const redisHost = config.get<string>('REDIS_HOST', 'localhost');
        const redisPort = config.get<number>('REDIS_PORT', 6379);
        const ttl = config.get<number>('REDIS_TTL', 300) * 1000;

        if (await canReachRedis(redisHost, redisPort)) {
          try {
            const { redisStore } = await import('cache-manager-ioredis-yet');
            const store = await redisStore({
              host: redisHost,
              port: redisPort,
              password: config.get<string>('REDIS_PASSWORD', '') || undefined,
              ttl,
            });
            console.log(`Cache Redis connecté (${redisHost}:${redisPort})`);
            return { store };
          } catch {
            // fall through
          }
        }

        console.warn(`⚠ Redis indisponible (${redisHost}:${redisPort}) — cache en mémoire`);
        return { ttl };
      },
    }),
  ],
})
export class RedisCacheModule {}
