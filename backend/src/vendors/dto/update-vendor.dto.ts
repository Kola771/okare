import { IsString, IsEmail, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class UpdateVendorDto {
  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'Le nom affiché ne doit pas dépasser 255 caractères.' })
  displayName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'Le nom du contact ne doit pas dépasser 255 caractères.' })
  contactName?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(30, { message: 'Le téléphone ne doit pas dépasser 30 caractères.' })
  contactPhone?: string;

  @IsEmail({}, { message: "L'adresse email n'est pas valide." })
  @IsOptional()
  email?: string | null;

  @IsUUID('4', { message: 'Le userId doit être un UUID valide.' })
  @IsOptional()
  userId?: string | null;

  @IsUUID('4', { message: 'Le followedById doit être un UUID valide.' })
  @IsOptional()
  followedById?: string | null;

  @IsString()
  @IsOptional()
  notes?: string | null;
}
