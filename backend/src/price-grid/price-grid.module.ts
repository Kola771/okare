import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PriceGridController } from './price-grid.controller';
import { PriceGridService } from './price-grid.service';
import { AuthModule } from '@/auth/auth.module';
import { PriceGrid } from '@/entities/price-grid.entity';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([PriceGrid])],
  controllers: [PriceGridController],
  providers: [PriceGridService],
})
export class PriceGridModule {}
