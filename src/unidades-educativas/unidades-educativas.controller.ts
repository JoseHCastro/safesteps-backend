import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UnidadesEducativasService } from './unidades-educativas.service';
import { CreateUnidadEducativaDto } from './dto/create-unidad-educativa.dto';
import { UpdateUnidadEducativaDto } from './dto/update-unidad-educativa.dto';
import { SearchUnidadEducativaDto } from './dto/search-unidad-educativa.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('unidades-educativas')
@UseGuards(JwtAuthGuard)
export class UnidadesEducativasController {
  constructor(private readonly unidadesEducativasService: UnidadesEducativasService) {}

  @Post()
  create(@Body() createDto: CreateUnidadEducativaDto) {
    return this.unidadesEducativasService.create(createDto);
  }

  @Get()
  findAll() {
    return this.unidadesEducativasService.findAll();
  }

  @Get('search')
  search(@Query() searchDto: SearchUnidadEducativaDto) {
    return this.unidadesEducativasService.search(searchDto);
  }

  @Get('nearby')
  findNearby(
    @Query('latitud') latitud: string,
    @Query('longitud') longitud: string,
    @Query('radio') radio?: string,
  ) {
    const lat = parseFloat(latitud);
    const lng = parseFloat(longitud);
    const radioKm = radio ? parseFloat(radio) : 5;

    return this.unidadesEducativasService.findNearby(lat, lng, radioKm);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.unidadesEducativasService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateUnidadEducativaDto) {
    return this.unidadesEducativasService.update(+id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.unidadesEducativasService.remove(+id);
  }
}
