import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('dish_categories')
export class DishCategory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  name!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug!: string;

  @Column({ type: 'jsonb', default: [] })
  aliases!: string[];

  @Column({ type: 'varchar', length: 255, nullable: true })
  family!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  illustrationKey!: string | null;

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;
}
