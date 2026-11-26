import { IsEnum, IsInt, IsUUID, Min } from 'class-validator';
import { PosType } from '@/entities/price-grid.entity';

export class CreatePriceGridDto {
  @IsUUID('4', { message: 'Le categoryId doit être un UUID valide.' })
  categoryId: string;

  @IsEnum(PosType, { message: 'Le type de POS doit être PARTICULIER, MAQUIS ou RESTAURANT.' })
  posType: PosType;

  @IsInt({ message: 'Le prix journalier doit être un entier.' })
  @Min(0, { message: 'Le prix journalier doit être positif.' })
  dayPriceXof: number;
}
