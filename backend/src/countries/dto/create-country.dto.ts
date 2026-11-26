import { IsString, IsBoolean, IsOptional, Length, MaxLength } from 'class-validator';

export class CreateCountryDto {
  @IsString()
  @Length(2, 2, { message: 'Le code pays doit contenir exactement 2 caractères.' })
  code: string;

  @IsString()
  @MaxLength(255, { message: 'Le nom ne doit pas dépasser 255 caractères.' })
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  currency?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  timezone?: string;

  @IsString()
  @MaxLength(255, { message: 'Le format du regex téléphone est invalide.' })
  phoneRegex: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
