import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Hijo } from './entities/hijo.entity';
import { CreateHijoDto } from './dto/create-hijo.dto';
import { UpdateHijoDto } from './dto/update-hijo.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { User } from '../auth/entities/user.entity';
import { UnidadEducativa } from '../unidades-educativas/entities/unidad-educativa.entity';

@Injectable()
export class HijoService {
  constructor(
    @InjectRepository(Hijo)
    private hijoRepository: Repository<Hijo>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UnidadEducativa)
    private unidadEducativaRepository: Repository<UnidadEducativa>,
  ) {}

  async create(createHijoDto: CreateHijoDto): Promise<Hijo> {
    // Validar si el email ya existe
    const existingUser = await this.userRepository.findOne({
      where: { email: createHijoDto.email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // Validar unidad educativa si se proporciona
    let unidadEducativa = null;
    if (createHijoDto.unidadEducativaId) {
      unidadEducativa = await this.unidadEducativaRepository.findOne({
        where: { id: createHijoDto.unidadEducativaId },
      });

      if (!unidadEducativa) {
        throw new NotFoundException(
          `Unidad educativa con ID ${createHijoDto.unidadEducativaId} no encontrada`,
        );
      }
    }

    // Validar coordenadas si se proporcionan
    if (createHijoDto.latitud !== undefined && (createHijoDto.latitud < -90 || createHijoDto.latitud > 90)) {
      throw new BadRequestException('La latitud debe estar entre -90 y 90');
    }

    if (createHijoDto.longitud !== undefined && (createHijoDto.longitud < -180 || createHijoDto.longitud > 180)) {
      throw new BadRequestException('La longitud debe estar entre -180 y 180');
    }

    const hashedPassword = await bcrypt.hash(createHijoDto.password, 10);
    
    const hijo = this.hijoRepository.create({
      nombre: createHijoDto.nombre,
      apellido: createHijoDto.apellido,
      email: createHijoDto.email,
      password: hashedPassword,
      telefono: createHijoDto.telefono,
      latitud: createHijoDto.latitud,
      longitud: createHijoDto.longitud,
      unidadEducativa: unidadEducativa,
      ultimaconexion: new Date(),
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

    // Validar si se intenta cambiar el email y ya existe
    if (updateHijoDto.email && updateHijoDto.email !== hijo.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateHijoDto.email },
      });

      if (existingUser) {
        throw new ConflictException('El email ya está registrado');
      }
    }

    // Validar coordenadas si se proporcionan
    if (updateHijoDto.latitud !== undefined && (updateHijoDto.latitud < -90 || updateHijoDto.latitud > 90)) {
      throw new BadRequestException('La latitud debe estar entre -90 y 90');
    }

    if (updateHijoDto.longitud !== undefined && (updateHijoDto.longitud < -180 || updateHijoDto.longitud > 180)) {
      throw new BadRequestException('La longitud debe estar entre -180 y 180');
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
    const hijo = await this.findOne(id);

    // Validar coordenadas
    if (updateLocationDto.latitud < -90 || updateLocationDto.latitud > 90) {
      throw new BadRequestException('La latitud debe estar entre -90 y 90');
    }

    if (updateLocationDto.longitud < -180 || updateLocationDto.longitud > 180) {
      throw new BadRequestException('La longitud debe estar entre -180 y 180');
    }

    hijo.latitud = updateLocationDto.latitud;
    hijo.longitud = updateLocationDto.longitud;
    hijo.ultimaconexion = new Date();

    try {
      return await this.hijoRepository.save(hijo);
    } catch (error) {
      throw new BadRequestException('Error al actualizar la ubicación');
    }
  }

  async remove(id: number): Promise<void> {
    const hijo = await this.findOne(id);
    await this.hijoRepository.remove(hijo);
  }
}
