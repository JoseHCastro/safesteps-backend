import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Hijo } from '../../usuarios/entities/hijo.entity';

@Entity('unidades_educativas')
export class UnidadEducativa {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  nombre: string;

  @Column({ length: 500 })
  direccion: string;

  @Column({ type: 'float' })
  latitud: number;

  @Column({ type: 'float' })
  longitud: number;

  @Column({ type: 'int', default: 100 })
  radio_seguridad_metros: number;

  @Column({ default: true })
  verificado: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha_registro: Date;

  @OneToMany(() => Hijo, (hijo) => hijo.unidadEducativa)
  estudiantes: Hijo[];
}
