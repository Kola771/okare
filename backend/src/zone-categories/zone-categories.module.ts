import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ZoneCategoriesController } from './zone-categories.controller';
import { ZoneCategoriesService } from './zone-categories.service';
import { AuthModule } from '@/auth/auth.module';
import { ZoneCategory } from '@/entities/zone-category.entity';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([ZoneCategory])],
  controllers: [ZoneCategoriesController],
  providers: [ZoneCategoriesService],
})
export class ZoneCategoriesModule {}
