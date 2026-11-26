import { Entity, Column, PrimaryColumn } from 'typeorm';
import { Role } from './user.entity';

@Entity('role_permissions')
export class RolePermission {
  @PrimaryColumn({ type: 'varchar' })
  role!: Role;

  @PrimaryColumn({ type: 'varchar', length: 255 })
  permission!: string;

  @Column({ type: 'boolean', default: true })
  granted!: boolean;
}
