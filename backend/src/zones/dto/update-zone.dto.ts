import { IsString, IsBoolean, IsInt, IsOptional, IsUUID, IsObject, MaxLength, Min } from 'class-validator';

export class UpdateZoneDto {
  @IsUUID('4', { message: 'Le cityId doit être un UUID valide.' })
  @IsOptional()
  cityId?: string;

  @IsUUID('4', { message: 'Le categoryId doit être un UUID valide.' })
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'Le nom ne doit pas dépasser 255 caractères.' })
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'Le code ne doit pas dépasser 50 caractères.' })
  code?: string;

  @IsInt({ message: 'Le nombre de créneaux doit être un entier.' })
  @Min(0)
  @IsOptional()
  dailySlotsOverride?: number | null;

  @IsObject()
  @IsOptional()
  priceOverride?: Record<string, unknown> | null;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
