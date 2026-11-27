import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique, UpdateDateColumn } from 'typeorm';
import { ZoneCategory } from './zone-category.entity';
import { DB_UUID_COL } from '../common/db-types';

export enum PosType {
  PARTICULIER = 'PARTICULIER',
  MAQUIS = 'MAQUIS',
  RESTAURANT = 'RESTAURANT',
}

@Entity('price_grid')
@Unique(['categoryId', 'posType'])
export class PriceGrid {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ ...DB_UUID_COL })
  categoryId!: string;

  @Column({ type: 'enum', enum: PosType })
  posType!: PosType;

  @Column({ type: 'int' })
  dayPriceXof!: number;

  @Column({ ...DB_UUID_COL, nullable: true })
  updatedById!: string | null;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => ZoneCategory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryId' })
  category!: ZoneCategory;
}
