import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Hijo } from '../../usuarios/entities/hijo.entity';

@Entity('registros')
export class Registro {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'timestamp' })
  hora: Date;

  @Column({ type: 'float' })
  latitud: number;

  @Column({ type: 'float' })
  longitud: number;

  @ManyToOne(() => Hijo, hijo => hijo.id) 
  @JoinColumn({ name: 'hijoId' })
  hijo: Hijo;

  @Column()
  hijoId: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  creadoEn: Date;
}