import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicHolidaysController } from './public-holidays.controller';
import { PublicHolidaysService } from './public-holidays.service';
import { AuthModule } from '@/auth/auth.module';
import { PublicHoliday } from '@/entities/public-holiday.entity';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([PublicHoliday])],
  controllers: [PublicHolidaysController],
  providers: [PublicHolidaysService],
})
export class PublicHolidaysModule {}
