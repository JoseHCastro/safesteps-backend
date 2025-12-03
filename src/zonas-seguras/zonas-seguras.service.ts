import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ZonaSegura } from './entities/zona-segura.entity';
import { CreateZonaSeguraDto } from './dto/create-zona-segura.dto';
import { UpdateZonaSeguraDto } from './dto/update-zona-segura.dto';
import { Hijo } from '../usuarios/entities/hijo.entity';

@Injectable()
export class ZonasSegurasService {
  constructor(
    @InjectRepository(ZonaSegura)
    private readonly zonaSeguraRepository: Repository<ZonaSegura>,
    @InjectRepository(Hijo)
    private readonly hijoRepository: Repository<Hijo>,
  ) {}

  async create(createDto: CreateZonaSeguraDto, tutor): Promise<ZonaSegura> {
    const hijos = await this.hijoRepository.findByIds(createDto.hijosIds);
    if (hijos.length !== createDto.hijosIds.length) {
      throw new NotFoundException('Uno o más hijos no existen');
    }
    const zona = this.zonaSeguraRepository.create({
      ...createDto,
      hijos,
      tutor,
    });
    return this.zonaSeguraRepository.save(zona);
  }

  async findAllByTutor(tutorId: number): Promise<ZonaSegura[]> {
    return this.zonaSeguraRepository.find({ where: { tutor: { id: tutorId } }, relations: ['hijos'] });
  }

  async update(id: number, updateDto: UpdateZonaSeguraDto, tutor): Promise<ZonaSegura> {
    const zona = await this.zonaSeguraRepository.findOne({ where: { id, tutor: { id: tutor.id } }, relations: ['hijos'] });
    if (!zona) throw new NotFoundException('Zona segura no encontrada');
    if (updateDto.hijosIds) {
      const hijos = await this.hijoRepository.findByIds(updateDto.hijosIds);
      if (hijos.length !== updateDto.hijosIds.length) {
        throw new NotFoundException('Uno o más hijos no existen');
      }
      zona.hijos = hijos;
    }
    Object.assign(zona, updateDto);
    return this.zonaSeguraRepository.save(zona);
  }

  async remove(id: number, tutor): Promise<void> {
    const zona = await this.zonaSeguraRepository.findOne({ where: { id, tutor: { id: tutor.id } } });
    if (!zona) throw new NotFoundException('Zona segura no encontrada');
    await this.zonaSeguraRepository.remove(zona);
  }

  async findOne(id: number, tutor): Promise<ZonaSegura> {
    const zona = await this.zonaSeguraRepository.findOne({ where: { id, tutor: { id: tutor.id } }, relations: ['hijos'] });
    if (!zona) throw new NotFoundException('Zona segura no encontrada');
    return zona;
  }
}
