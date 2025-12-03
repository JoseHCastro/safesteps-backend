import { Entity, Column, ManyToMany, ManyToOne, ChildEntity } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Tutor } from './tutor.entity';
import { UnidadEducativa } from '../../unidades-educativas/entities/unidad-educativa.entity';

@ChildEntity()
export class Hijo extends User {
  @Column({ length: 255, nullable: true })
  apellido: string;

  @Column({ length: 20, nullable: true })
  telefono: string;

  @Column({ type: 'float', nullable: true })
  latitud: number;

  @Column({ type: 'float', nullable: true })
  longitud: number;

  @Column({ type: 'timestamp', nullable: true })
  ultimaconexion: Date;

  @ManyToOne(() => UnidadEducativa, (ue) => ue.estudiantes, { nullable: true })
  unidadEducativa: UnidadEducativa;

  @ManyToMany(() => Tutor, (tutor) => tutor.hijos)
  tutores: Tutor[];

}
