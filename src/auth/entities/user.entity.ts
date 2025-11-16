import { Entity, PrimaryGeneratedColumn, Column, TableInheritance, Unique } from 'typeorm';

@Entity('users')
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  nombre: string;

  @Column({ length: 255 })
  password: string;

  @Column({ length: 255, unique: true })
  email: string;
}
