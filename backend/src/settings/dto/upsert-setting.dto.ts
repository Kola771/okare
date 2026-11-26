import { IsString, IsDefined, MaxLength } from 'class-validator';

export class UpsertSettingDto {
  @IsString()
  @MaxLength(255, { message: 'La clé ne doit pas dépasser 255 caractères.' })
  key: string;

  @IsDefined({ message: 'La valeur est obligatoire.' })
  value: unknown;
}
