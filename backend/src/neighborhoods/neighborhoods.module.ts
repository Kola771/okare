import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NeighborhoodsController } from './neighborhoods.controller';
import { NeighborhoodsService } from './neighborhoods.service';
import { AuthModule } from '@/auth/auth.module';
import { Neighborhood } from '@/entities/neighborhood.entity';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Neighborhood])],
  controllers: [NeighborhoodsController],
  providers: [NeighborhoodsService],
})
export class NeighborhoodsModule {}
