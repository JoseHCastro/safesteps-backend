import { Entity, Column, ManyToMany, ChildEntity } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Tutor } from './tutor.entity';

@ChildEntity()
export class Hijo extends User {
  @Column({ type: 'float', nullable: true })
  latitud: number;

  @Column({ type: 'float', nullable: true })
  longitud: number;

  @Column({ type: 'timestamp', nullable: true })
  ultimaconexion: Date;

  @ManyToMany(() => Tutor, (tutor) => tutor.hijos)
  tutores: Tutor[];
}
