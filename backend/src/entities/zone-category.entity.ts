import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { City } from './city.entity';
import { DB_UUID_COL } from '../common/db-types';

@Entity('zone_categories')
@Unique(['cityId', 'code'])
export class ZoneCategory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ ...DB_UUID_COL })
  cityId!: string;

  @Column({ type: 'varchar', length: 50 })
  code!: string;

  @Column({ type: 'varchar', length: 255 })
  label!: string;

  @Column({ type: 'int' })
  defaultDailySlots!: number;

  @ManyToOne(() => City, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cityId' })
  city!: City;
}
