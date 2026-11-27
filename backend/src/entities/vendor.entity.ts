import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { DB_UUID_COL } from '../common/db-types';

@Entity('vendors')
export class Vendor {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  displayName!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contactName!: string | null;

  @Column({ type: 'varchar', length: 30 })
  contactPhone!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email!: string | null;

  @Column({ ...DB_UUID_COL, nullable: true, unique: true })
  userId!: string | null;

  @Column({ ...DB_UUID_COL, nullable: true })
  followedById!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ ...DB_UUID_COL, nullable: true, unique: true })
  mainPosId!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  mainPosComputedAt!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  firstPublishedAt!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  subscriptionNoticeAt!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  subscriptionRequiredFrom!: Date | null;

  @Column({ ...DB_UUID_COL })
  createdById!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'userId' })
  user!: User | null;
}
