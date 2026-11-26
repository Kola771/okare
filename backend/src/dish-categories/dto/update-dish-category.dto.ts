import { IsString, IsBoolean, IsInt, IsArray, IsOptional, MaxLength, Min } from 'class-validator';

export class UpdateDishCategoryDto {
  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'Le nom ne doit pas dépasser 255 caractères.' })
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'Le slug ne doit pas dépasser 255 caractères.' })
  slug?: string;

  @IsArray()
  @IsString({ each: true, message: 'Chaque alias doit être une chaîne de caractères.' })
  @IsOptional()
  aliases?: string[];

  @IsString()
  @IsOptional()
  @MaxLength(255)
  family?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  illustrationKey?: string | null;

  @IsInt({ message: "L'ordre de tri doit être un entier." })
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
