import { Injectable, NotFoundException, ConflictException, BadRequestException, UnauthorizedException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Hijo } from './entities/hijo.entity';
import { CreateHijoDto } from './dto/create-hijo.dto';
import { UpdateHijoDto } from './dto/update-hijo.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { User } from '../auth/entities/user.entity';
import { ZonasSegurasService } from '../zonas-seguras/zonas-seguras.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class HijoService {
  constructor(
    @InjectRepository(Hijo)
    private hijoRepository: Repository<Hijo>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject(forwardRef(() => ZonasSegurasService))
    private zonasService: ZonasSegurasService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
  ) {}

  async create(createHijoDto: CreateHijoDto): Promise<Hijo> {
    // Validar si el email ya existe
    const existingUser = await this.userRepository.findOne({
      where: { email: createHijoDto.email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(createHijoDto.password, 10);
    const codigoVinculacion = this.generateVinculacionCode();

    const hijo = this.hijoRepository.create({
      nombre: createHijoDto.nombre,
      apellido: createHijoDto.apellido,
      email: createHijoDto.email,
      password: hashedPassword,
      telefono: createHijoDto.telefono,
      ultimaconexion: new Date(),
      codigoVinculacion,
      vinculado: false,
    });

    try {
      return await this.hijoRepository.save(hijo);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('El email ya está registrado');
      }
      throw new BadRequestException('Error al crear el hijo');
    }
  }

  async findAll(): Promise<Hijo[]> {
    return this.hijoRepository.find({ relations: ['tutores'] });
  }

  async findOne(id: number): Promise<Hijo> {
    const hijo = await this.hijoRepository.findOne({
      where: { id },
      relations: ['tutores'],
    });

    if (!hijo) {
      throw new NotFoundException(`Hijo con ID ${id} no encontrado`);
    }

    return hijo;
  }

  async update(id: number, updateHijoDto: UpdateHijoDto): Promise<Hijo> {
    const hijo = await this.findOne(id);

    // Validar si se intenta cambiar el email
    if (updateHijoDto.email && updateHijoDto.email !== hijo.email) {
      // No permitir cambio de email si ya está vinculado
      if (hijo.vinculado) {
        throw new ConflictException('No se puede cambiar el email de un hijo ya vinculado');
      }

      // Validar si el nuevo email ya existe
      const existingUser = await this.userRepository.findOne({
        where: { email: updateHijoDto.email },
      });

      if (existingUser) {
        throw new ConflictException('El email ya está registrado');
      }
    }

    if (updateHijoDto.password) {
      updateHijoDto.password = await bcrypt.hash(updateHijoDto.password, 10);
    }

    Object.assign(hijo, updateHijoDto);
    
    try {
      return await this.hijoRepository.save(hijo);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('El email ya está registrado');
      }
      throw new BadRequestException('Error al actualizar el hijo');
    }
  }

  async updateLocation(id: number, updateLocationDto: UpdateLocationDto): Promise<Hijo> {
    const hijo = await this.hijoRepository.findOne({
      where: { id },
      relations: ['tutores'],
    });

    if (!hijo) {
      throw new NotFoundException(`Hijo con ID ${id} no encontrado`);
    }

    // Validar coordenadas
    if (updateLocationDto.latitud < -90 || updateLocationDto.latitud > 90) {
      throw new BadRequestException('La latitud debe estar entre -90 y 90');
    }

    if (updateLocationDto.longitud < -180 || updateLocationDto.longitud > 180) {
      throw new BadRequestException('La longitud debe estar entre -180 y 180');
    }

    // Guardar ubicación
    hijo.latitud = updateLocationDto.latitud;
    hijo.longitud = updateLocationDto.longitud;
    hijo.ultimaconexion = new Date();

    try {
      await this.hijoRepository.save(hijo);
    } catch (error) {
      throw new BadRequestException('Error al actualizar la ubicación');
    }

    // 🔥 NUEVO: Verificar zonas seguras
    try {
      const zonasActuales = await this.zonasService.checkGeofenceStatus(
        id,
        updateLocationDto.latitud,
        updateLocationDto.longitud,
      );

      // 🔥 Si está dentro de alguna zona, notificar al tutor
      for (const zona of zonasActuales) {
        if (zona.tutor) {
          const mensaje = `✅ ${hijo.nombre} ${hijo.apellido} está dentro de la zona segura "${zona.nombre}"`;
          
          // Guardar notificación en BD
          await this.notificationsService.create(zona.tutor.id, {
            mensaje,
            tipo: 'zona_segura',
          });

          // 📱 Enviar Push Notification
          await this.notificationsService.sendPushNotification(
            zona.tutor.id,
            '✅ Zona Segura',
            `${hijo.nombre} está en ${zona.nombre}`,
            {
              type: 'zona_segura',
              childId: hijo.id,
              zonaId: zona.id,
              zonaName: zona.nombre,
            },
          );
        }
      }
    } catch (error) {
      // No fallar si hay error en notificaciones, solo registrar
      console.error('Error verificando zonas seguras:', error);
    }

    return hijo;
  }

  async remove(id: number): Promise<void> {
    const hijo = await this.findOne(id);
    await this.hijoRepository.remove(hijo);
  }

  /**
   * Genera un código aleatorio de 6 caracteres alfanuméricos
   */
  private generateVinculacionCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sin caracteres ambiguos
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Vincular dispositivo del hijo usando código
   */
  async vincularConCodigo(codigo: string, email: string, password: string): Promise<Hijo> {
    // Buscar hijo por código
    const hijo = await this.hijoRepository.findOne({
      where: { codigoVinculacion: codigo.toUpperCase() },
      relations: ['tutores'],
    });

    if (!hijo) {
      throw new NotFoundException('Código de vinculación inválido');
    }

    if (hijo.vinculado) {
      throw new ConflictException('Este código ya ha sido utilizado');
    }

    // Actualizar email y password del hijo
    hijo.email = email;
    hijo.password = await bcrypt.hash(password, 10);
    hijo.vinculado = true;

    try {
      return await this.hijoRepository.save(hijo);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('El email ya está registrado');
      }
      throw new BadRequestException('Error al vincular dispositivo');
    }
  }

  /**
   * Obtener hijo por código de vinculación (info básica, sin datos sensibles)
   */
  async findByCodigo(codigo: string): Promise<{ nombre: string; apellido: string; vinculado: boolean }> {
    const hijo = await this.hijoRepository.findOne({
      where: { codigoVinculacion: codigo.toUpperCase() },
      select: ['nombre', 'apellido', 'vinculado'],
    });

    if (!hijo) {
      throw new NotFoundException('Código de vinculación inválido');
    }

    return {
      nombre: hijo.nombre,
      apellido: hijo.apellido,
      vinculado: hijo.vinculado,
    };
  }

  /**
   * Regenerar código de vinculación
   * Permite al tutor regenerar el código si el hijo pierde su dispositivo
   */
  async regenerarCodigo(id: number, tutorId: number): Promise<{ codigoVinculacion: string }> {
    const hijo = await this.findOne(id);

    // Verificar que el tutor sea el dueño del hijo
    const esTutorDelHijo = hijo.tutores.some(tutor => tutor.id === tutorId);
    if (!esTutorDelHijo) {
      throw new UnauthorizedException('No tienes permisos para regenerar el código de este hijo');
    }

    // Generar nuevo código y resetear vinculado
    hijo.codigoVinculacion = this.generateVinculacionCode();
    hijo.vinculado = false; // Permitir nueva vinculación

    await this.hijoRepository.save(hijo);

    return { codigoVinculacion: hijo.codigoVinculacion };
  }

  /**
   * Enviar alerta SOS de pánico a todos los tutores vinculados
   */
  async enviarAlertaSOS(hijoId: number, userId: number): Promise<{ message: string; notificacionesEnviadas: number }> {
    // Verificar que el usuario sea el hijo
    const hijo = await this.hijoRepository.findOne({
      where: { id: hijoId },
      relations: ['tutores'],
    });

    if (!hijo) {
      throw new NotFoundException(`Hijo con ID ${hijoId} no encontrado`);
    }

    if (hijo.id !== userId) {
      throw new UnauthorizedException('Solo el hijo puede enviar su propia alerta SOS');
    }

    if (!hijo.tutores || hijo.tutores.length === 0) {
      throw new BadRequestException('No tienes tutores vinculados para recibir la alerta');
    }

    // Preparar mensaje de alerta con ubicación actual
    const mensajeAlerta = hijo.latitud && hijo.longitud
      ? `🚨 ¡ALERTA SOS! ${hijo.nombre} ${hijo.apellido} necesita ayuda urgente.\n📍 Ubicación: ${hijo.latitud}, ${hijo.longitud}`
      : `🚨 ¡ALERTA SOS! ${hijo.nombre} ${hijo.apellido} necesita ayuda urgente.\n⚠️ Ubicación no disponible`;

    let notificacionesEnviadas = 0;

    // Enviar notificación a cada tutor
    for (const tutor of hijo.tutores) {
      try {
        // Crear notificación en base de datos
        await this.notificationsService.create(tutor.id, {
          mensaje: mensajeAlerta,
          tipo: 'sos_panico',
        });

        // Enviar notificación PUSH con type: 'sos_panico' en data
        await this.notificationsService.sendPushNotification(
          tutor.id,
          '🚨 ALERTA SOS',
          `${hijo.nombre} necesita ayuda urgente`,
          {
            type: 'sos_panico',  // IMPORTANTE: Este campo es el que detecta Flutter
            childId: hijo.id,
            childName: `${hijo.nombre} ${hijo.apellido}`,
            latitude: hijo.latitud?.toString() || '',
            longitude: hijo.longitud?.toString() || '',
          },
        );

        notificacionesEnviadas++;
      } catch (error) {
        console.error(`Error al enviar SOS al tutor ${tutor.id}:`, error);
      }
    }

    return {
      message: `Alerta SOS enviada a ${notificacionesEnviadas} tutor(es)`,
      notificacionesEnviadas,
    };
  }
}
