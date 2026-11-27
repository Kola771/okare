import { Entity, Column, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { Role } from './user.entity';
import { DB_UUID_COL } from '../common/db-types';

@Entity('role_permissions')
export class RolePermission {
  @PrimaryColumn({ type: 'varchar' })
  role!: Role;

  @PrimaryColumn({ type: 'varchar', length: 255 })
  permission!: string;

  @Column({ type: 'boolean', default: true })
  granted!: boolean;

  @Column({ ...DB_UUID_COL, nullable: true })
  updatedById!: string | null;

  @UpdateDateColumn()
  updatedAt!: Date;
}
