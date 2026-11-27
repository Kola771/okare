import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Country } from './country.entity';
import { DB_UUID_COL, DB_POINT_COL } from '../common/db-types';

@Entity('cities')
export class City {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ ...DB_UUID_COL })
  countryId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug!: string;

  @Column({ ...DB_POINT_COL, nullable: true })
  center!: string | null;

  @Column({ type: 'boolean', default: false })
  isActive!: boolean;

  @ManyToOne(() => Country, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'countryId' })
  country!: Country;
}
