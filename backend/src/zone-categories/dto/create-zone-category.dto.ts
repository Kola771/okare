import { IsString, IsInt, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateZoneCategoryDto {
  @IsUUID('4', { message: 'Le cityId doit être un UUID valide.' })
  cityId: string;

  @IsString()
  @MaxLength(50, { message: 'Le code ne doit pas dépasser 50 caractères.' })
  code: string;

  @IsString()
  @MaxLength(255, { message: 'Le label ne doit pas dépasser 255 caractères.' })
  label: string;

  @IsInt({ message: 'Le nombre de créneaux quotidiens doit être un entier.' })
  @Min(0, { message: 'Le nombre de créneaux quotidiens doit être positif.' })
  defaultDailySlots: number;
}
