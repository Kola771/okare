import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard } from '@nestjs/throttler';
import dataSource from './datasource';
import { RedisCacheModule } from './common/cache/redis-cache.module';
import { AppThrottleModule } from './common/throttle/throttle.module';
import { AuthModule } from './auth/auth.module';
import { CountriesModule } from './countries/countries.module';
import { CitiesModule } from './cities/cities.module';
import { ZoneCategoriesModule } from './zone-categories/zone-categories.module';
import { ZonesModule } from './zones/zones.module';
import { NeighborhoodsModule } from './neighborhoods/neighborhoods.module';
import { PriceGridModule } from './price-grid/price-grid.module';
import { PublicHolidaysModule } from './public-holidays/public-holidays.module';
import { DishCategoriesModule } from './dish-categories/dish-categories.module';
import { SettingsModule } from './settings/settings.module';
import { VendorsModule } from './vendors/vendors.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(dataSource.options),
    RedisCacheModule,
    AppThrottleModule,
    AuthModule,
    CountriesModule,
    CitiesModule,
    ZoneCategoriesModule,
    ZonesModule,
    NeighborhoodsModule,
    PriceGridModule,
    PublicHolidaysModule,
    DishCategoriesModule,
    SettingsModule,
    VendorsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
