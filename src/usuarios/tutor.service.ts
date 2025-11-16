import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Tutor } from './entities/tutor.entity';
import { Hijo } from './entities/hijo.entity';
import { CreateTutorDto } from './dto/create-tutor.dto';
import { UpdateTutorDto } from './dto/update-tutor.dto';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class TutorService {
  constructor(
    @InjectRepository(Tutor)
    private tutorRepository: Repository<Tutor>,
    @InjectRepository(Hijo)
    private hijoRepository: Repository<Hijo>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createTutorDto: CreateTutorDto): Promise<Tutor> {
    // Validar si el email ya existe
    const existingUser = await this.userRepository.findOne({
      where: { email: createTutorDto.email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // Validar tipo
    if (!createTutorDto.tipo || createTutorDto.tipo.trim() === '') {
      throw new BadRequestException('El campo tipo es requerido');
    }

    const hashedPassword = await bcrypt.hash(createTutorDto.password, 10);
    
    const tutor = this.tutorRepository.create({
      ...createTutorDto,
      password: hashedPassword,
      tipo: createTutorDto.tipo.trim(),
    });

    try {
      return await this.tutorRepository.save(tutor);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('El email ya está registrado');
      }
      throw new BadRequestException('Error al crear el tutor');
    }
  }

  async findAll(): Promise<Tutor[]> {
    return this.tutorRepository.find({ relations: ['hijos'] });
  }

  async findOne(id: number): Promise<Tutor> {
    const tutor = await this.tutorRepository.findOne({
      where: { id },
      relations: ['hijos'],
    });

    if (!tutor) {
      throw new NotFoundException(`Tutor con ID ${id} no encontrado`);
    }

    return tutor;
  }

  async update(id: number, updateTutorDto: UpdateTutorDto): Promise<Tutor> {
    const tutor = await this.findOne(id);

    // Validar si se intenta cambiar el email y ya existe
    if (updateTutorDto.email && updateTutorDto.email !== tutor.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateTutorDto.email },
      });

      if (existingUser) {
        throw new ConflictException('El email ya está registrado');
      }
    }

    // Validar tipo si se proporciona
    if (updateTutorDto.tipo !== undefined) {
      if (!updateTutorDto.tipo || updateTutorDto.tipo.trim() === '') {
        throw new BadRequestException('El campo tipo no puede estar vacío');
      }
      updateTutorDto.tipo = updateTutorDto.tipo.trim();
    }

    if (updateTutorDto.password) {
      updateTutorDto.password = await bcrypt.hash(updateTutorDto.password, 10);
    }

    Object.assign(tutor, updateTutorDto);
    
    try {
      return await this.tutorRepository.save(tutor);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('El email ya está registrado');
      }
      throw new BadRequestException('Error al actualizar el tutor');
    }
  }

  async remove(id: number): Promise<void> {
    const tutor = await this.findOne(id);
    await this.tutorRepository.remove(tutor);
  }

  async addHijo(tutorId: number, hijoId: number): Promise<Tutor> {
    const tutor = await this.tutorRepository.findOne({
      where: { id: tutorId },
      relations: ['hijos'],
    });

    if (!tutor) {
      throw new NotFoundException(`Tutor con ID ${tutorId} no encontrado`);
    }

    const hijo = await this.hijoRepository.findOne({ where: { id: hijoId } });

    if (!hijo) {
      throw new NotFoundException(`Hijo con ID ${hijoId} no encontrado`);
    }

    if (!tutor.hijos) {
      tutor.hijos = [];
    }

    tutor.hijos.push(hijo);
    return this.tutorRepository.save(tutor);
  }

  async removeHijo(tutorId: number, hijoId: number): Promise<Tutor> {
    const tutor = await this.tutorRepository.findOne({
      where: { id: tutorId },
      relations: ['hijos'],
    });

    if (!tutor) {
      throw new NotFoundException(`Tutor con ID ${tutorId} no encontrado`);
    }

    tutor.hijos = tutor.hijos.filter((hijo) => hijo.id !== hijoId);
    return this.tutorRepository.save(tutor);
  }
}
