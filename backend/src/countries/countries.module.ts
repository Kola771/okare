import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CountriesController } from './countries.controller';
import { CountriesService } from './countries.service';
import { AuthModule } from '@/auth/auth.module';
import { Country } from '@/entities/country.entity';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Country])],
  controllers: [CountriesController],
  providers: [CountriesService],
})
export class CountriesModule {}
