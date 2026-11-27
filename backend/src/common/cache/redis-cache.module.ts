import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createClient } from '@keyv/redis';
import { Keyv } from 'keyv';
import { CacheableMemory } from 'cacheable';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const redisHost = config.get<string>('REDIS_HOST', 'localhost');
        const redisPort = config.get<number>('REDIS_PORT', 6379);
        const password = config.get<string>('REDIS_PASSWORD', '') || undefined;
        const ttl = config.get<number>('REDIS_TTL', 300) * 1000;

        try {
          const keyvRedis = createClient({
            socket: { host: redisHost, port: redisPort },
            password,
          });
          const store = new Keyv({ store: keyvRedis, ttl });
          await store.get('__ping__');
          console.log(`Cache Redis connecté (${redisHost}:${redisPort})`);
          return { stores: [store] };
        } catch {
          console.warn(`⚠ Redis indisponible (${redisHost}:${redisPort}) — cache en mémoire`);
          const memStore = new Keyv({ store: new CacheableMemory({ ttl }) });
          return { stores: [memStore] };
        }
      },
    }),
  ],
})
export class RedisCacheModule {}
