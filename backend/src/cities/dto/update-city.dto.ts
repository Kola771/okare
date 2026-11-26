import { IsString, IsBoolean, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class UpdateCityDto {
  @IsUUID('4', { message: 'Le countryId doit être un UUID valide.' })
  @IsOptional()
  countryId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'Le nom ne doit pas dépasser 255 caractères.' })
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'Le slug ne doit pas dépasser 255 caractères.' })
  slug?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
