import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DishCategoriesController } from './dish-categories.controller';
import { DishCategoriesService } from './dish-categories.service';
import { AuthModule } from '@/auth/auth.module';
import { DishCategory } from '@/entities/dish-category.entity';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([DishCategory])],
  controllers: [DishCategoriesController],
  providers: [DishCategoriesService],
})
export class DishCategoriesModule {}
