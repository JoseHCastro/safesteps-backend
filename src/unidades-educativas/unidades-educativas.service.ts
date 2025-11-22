import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { UnidadEducativa } from './entities/unidad-educativa.entity';
import { CreateUnidadEducativaDto } from './dto/create-unidad-educativa.dto';
import { UpdateUnidadEducativaDto } from './dto/update-unidad-educativa.dto';
import { SearchUnidadEducativaDto } from './dto/search-unidad-educativa.dto';

@Injectable()
export class UnidadesEducativasService {
  constructor(
    @InjectRepository(UnidadEducativa)
    private unidadEducativaRepository: Repository<UnidadEducativa>,
  ) {}

  async create(createDto: CreateUnidadEducativaDto): Promise<UnidadEducativa> {
    // Validar coordenadas
    if (createDto.latitud < -90 || createDto.latitud > 90) {
      throw new BadRequestException('La latitud debe estar entre -90 y 90');
    }

    if (createDto.longitud < -180 || createDto.longitud > 180) {
      throw new BadRequestException('La longitud debe estar entre -180 y 180');
    }

    const unidadEducativa = this.unidadEducativaRepository.create(createDto);

    try {
      return await this.unidadEducativaRepository.save(unidadEducativa);
    } catch (error) {
      throw new BadRequestException('Error al crear la unidad educativa');
    }
  }

  async findAll(): Promise<UnidadEducativa[]> {
    return this.unidadEducativaRepository.find({
      order: { nombre: 'ASC' },
    });
  }

  async search(searchDto: SearchUnidadEducativaDto): Promise<UnidadEducativa[]> {
    const where: any = {};

    if (searchDto.nombre) {
      where.nombre = Like(`%${searchDto.nombre}%`);
    }

    if (searchDto.direccion) {
      where.direccion = Like(`%${searchDto.direccion}%`);
    }

    if (searchDto.verificado !== undefined) {
      where.verificado = searchDto.verificado;
    }

    return this.unidadEducativaRepository.find({
      where,
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: number): Promise<UnidadEducativa> {
    const unidadEducativa = await this.unidadEducativaRepository.findOne({
      where: { id },
      relations: ['estudiantes'],
    });

    if (!unidadEducativa) {
      throw new NotFoundException(`Unidad educativa con ID ${id} no encontrada`);
    }

    return unidadEducativa;
  }

  async update(id: number, updateDto: UpdateUnidadEducativaDto): Promise<UnidadEducativa> {
    const unidadEducativa = await this.findOne(id);

    // Validar coordenadas si se proporcionan
    if (updateDto.latitud !== undefined) {
      if (updateDto.latitud < -90 || updateDto.latitud > 90) {
        throw new BadRequestException('La latitud debe estar entre -90 y 90');
      }
    }

    if (updateDto.longitud !== undefined) {
      if (updateDto.longitud < -180 || updateDto.longitud > 180) {
        throw new BadRequestException('La longitud debe estar entre -180 y 180');
      }
    }

    Object.assign(unidadEducativa, updateDto);

    try {
      return await this.unidadEducativaRepository.save(unidadEducativa);
    } catch (error) {
      throw new BadRequestException('Error al actualizar la unidad educativa');
    }
  }

  async remove(id: number): Promise<void> {
    const unidadEducativa = await this.findOne(id);
    await this.unidadEducativaRepository.remove(unidadEducativa);
  }

  /**
   * Obtiene unidades educativas cercanas a una coordenada
   * @param latitud - Latitud de referencia
   * @param longitud - Longitud de referencia
   * @param radioKm - Radio de búsqueda en kilómetros (default: 5km)
   */
  async findNearby(latitud: number, longitud: number, radioKm: number = 5): Promise<UnidadEducativa[]> {
    // Fórmula Haversine simplificada para distancia aproximada
    // En una implementación PostGIS real usaríamos ST_Distance
    const query = `
      SELECT *, (
        6371 * acos(
          cos(radians(${latitud})) * 
          cos(radians(latitud)) * 
          cos(radians(longitud) - radians(${longitud})) + 
          sin(radians(${latitud})) * 
          sin(radians(latitud))
        )
      ) AS distancia_km
      FROM unidades_educativas
      HAVING distancia_km <= ${radioKm}
      ORDER BY distancia_km ASC
    `;

    return this.unidadEducativaRepository.query(query);
  }
}
