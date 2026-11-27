import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';
import { DB_UUID_COL, DB_JSON } from '../common/db-types';

@Entity('settings')
export class Setting {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  key!: string;

  @Column({ type: DB_JSON })
  value!: unknown;

  @Column({ ...DB_UUID_COL, nullable: true })
  updatedById!: string | null;

  @UpdateDateColumn()
  updatedAt!: Date;
}
