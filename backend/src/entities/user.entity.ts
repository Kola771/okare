import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DB_UUID_COL, DB_JSON, isPostgres } from '../common/db-types';

export enum Role {
  CLIENT = 'CLIENT',
  VENDOR = 'VENDOR',
  FIELD_AGENT = 'FIELD_AGENT',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 30, nullable: true, unique: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  email!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  googleSub!: string | null;

  @Column({ type: 'text', nullable: true })
  passwordHash!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fullName!: string | null;

  @Column({ ...DB_UUID_COL, nullable: true })
  avatarMediaId!: string | null;

  @Column(
    isPostgres
      ? { type: 'enum', enum: Role, array: true, default: [Role.CLIENT] }
      : { type: 'json' },
  )
  roles!: Role[];

  @Column({ ...DB_UUID_COL, nullable: true })
  homeZoneId!: string | null;

  @Column({ type: 'int', nullable: true })
  budgetMaxXof!: number | null;

  @Column({ type: 'boolean', default: true })
  notifyFavorites!: boolean;

  @Column({ type: 'boolean', default: true })
  askFollowUp!: boolean;

  @Column({ type: 'boolean', default: false })
  notifyNews!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  phoneVerifiedAt!: Date | null;

  @Column({ type: 'text', nullable: true })
  totpSecret!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  totpEnabledAt!: Date | null;

  @Column({ type: 'boolean', default: false })
  isBlocked!: boolean;

  @Column({ type: 'text', nullable: true })
  blockedReason!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  lastSeenAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date | null;
}
