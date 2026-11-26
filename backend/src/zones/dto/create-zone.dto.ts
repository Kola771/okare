import { IsString, IsBoolean, IsInt, IsOptional, IsUUID, IsObject, MaxLength, Min } from 'class-validator';

export class CreateZoneDto {
  @IsUUID('4', { message: 'Le cityId doit être un UUID valide.' })
  cityId: string;

  @IsUUID('4', { message: 'Le categoryId doit être un UUID valide.' })
  categoryId: string;

  @IsString()
  @MaxLength(255, { message: 'Le nom ne doit pas dépasser 255 caractères.' })
  name: string;

  @IsString()
  @MaxLength(50, { message: 'Le code ne doit pas dépasser 50 caractères.' })
  code: string;

  @IsInt({ message: 'Le nombre de créneaux doit être un entier.' })
  @Min(0)
  @IsOptional()
  dailySlotsOverride?: number;

  @IsObject()
  @IsOptional()
  priceOverride?: Record<string, unknown>;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
