import { IsString, IsOptional, IsUUID, IsArray, MaxLength } from 'class-validator';

export class CreateNeighborhoodDto {
  @IsUUID('4', { message: 'Le zoneId doit être un UUID valide.' })
  zoneId: string;

  @IsString()
  @MaxLength(255, { message: 'Le nom ne doit pas dépasser 255 caractères.' })
  name: string;

  @IsArray()
  @IsString({ each: true, message: 'Chaque alias doit être une chaîne de caractères.' })
  @IsOptional()
  aliases?: string[];
}
