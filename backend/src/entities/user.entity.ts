import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

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

  @Column({ type: 'varchar', length: 255, nullable: true })
  fullName!: string | null;

  @Column({ type: 'text', nullable: true })
  passwordHash!: string | null;

  @Column({ type: 'simple-array' })
  roles!: Role[];

  @Column({ type: 'boolean', default: false })
  isBlocked!: boolean;

  @Column({ type: 'text', nullable: true })
  blockedReason!: string | null;
}
