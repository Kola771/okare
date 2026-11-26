import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('countries')
export class Country {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 2, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 10, default: 'XOF' })
  currency: string;

  @Column({ type: 'varchar', length: 100, default: 'Africa/Porto-Novo' })
  timezone: string;

  @Column({ type: 'varchar', length: 255 })
  phoneRegex: string;

  @Column({ type: 'boolean', default: false })
  isActive: boolean;
}
