import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique, UpdateDateColumn } from 'typeorm';
import { ZoneCategory } from './zone-category.entity';

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

  @Column({ type: 'uuid' })
  categoryId!: string;

  @Column({ type: 'enum', enum: PosType })
  posType!: PosType;

  @Column({ type: 'int' })
  dayPriceXof!: number;

  @Column({ type: 'uuid', nullable: true })
  updatedById!: string | null;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => ZoneCategory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryId' })
  category!: ZoneCategory;
}
