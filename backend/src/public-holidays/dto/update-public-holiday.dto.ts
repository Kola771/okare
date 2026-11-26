import { IsString, IsOptional, IsUUID, IsDateString, MaxLength } from 'class-validator';

export class UpdatePublicHolidayDto {
  @IsUUID('4', { message: 'Le countryId doit être un UUID valide.' })
  @IsOptional()
  countryId?: string;

  @IsDateString({}, { message: 'La date doit être au format YYYY-MM-DD.' })
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'Le nom ne doit pas dépasser 255 caractères.' })
  name?: string;
}
