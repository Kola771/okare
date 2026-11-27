import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Country } from './country.entity';
import { DB_UUID_COL } from '../common/db-types';

@Entity('public_holidays')
@Unique(['countryId', 'date'])
export class PublicHoliday {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ ...DB_UUID_COL })
  countryId!: string;

  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @ManyToOne(() => Country, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'countryId' })
  country!: Country;
}
