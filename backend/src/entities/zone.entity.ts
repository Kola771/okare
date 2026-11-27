import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { City } from './city.entity';
import { ZoneCategory } from './zone-category.entity';
import { DB_UUID_COL, DB_JSON } from '../common/db-types';

@Entity('zones')
@Unique(['cityId', 'code'])
export class Zone {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ ...DB_UUID_COL })
  cityId!: string;

  @Column({ ...DB_UUID_COL })
  categoryId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 50 })
  code!: string;

  @Column({ type: 'int', nullable: true })
  dailySlotsOverride!: number | null;

  @Column({ type: DB_JSON, nullable: true })
  priceOverride!: Record<string, unknown> | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @ManyToOne(() => City, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cityId' })
  city!: City;

  @ManyToOne(() => ZoneCategory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryId' })
  category!: ZoneCategory;
}
