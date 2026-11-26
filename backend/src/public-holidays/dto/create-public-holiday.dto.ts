import { IsString, IsUUID, IsDateString, MaxLength } from 'class-validator';

export class CreatePublicHolidayDto {
  @IsUUID('4', { message: 'Le countryId doit être un UUID valide.' })
  countryId: string;

  @IsDateString({}, { message: 'La date doit être au format YYYY-MM-DD.' })
  date: string;

  @IsString()
  @MaxLength(255, { message: 'Le nom ne doit pas dépasser 255 caractères.' })
  name: string;
}
