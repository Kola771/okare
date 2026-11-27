import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Zone } from './zone.entity';
import { DB_UUID_COL, DB_JSON } from '../common/db-types';

@Entity('neighborhoods')
@Unique(['zoneId', 'name'])
export class Neighborhood {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ ...DB_UUID_COL })
  zoneId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: DB_JSON, nullable: true })
  aliases!: string[] | null;

  @ManyToOne(() => Zone, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'zoneId' })
  zone!: Zone;
}
