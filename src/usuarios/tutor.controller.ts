import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { TutorService } from './tutor.service';
import { CreateTutorDto } from './dto/create-tutor.dto';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateTutorDto } from './dto/update-tutor.dto';

@Controller('tutores')
@UseGuards(JwtAuthGuard)
export class TutorController {
  constructor(private readonly tutorService: TutorService) {}

  @Post()
  create(@Body() createTutorDto: CreateTutorDto) {
    return this.tutorService.create(createTutorDto);
  }

  @Get()
  findAll() {
    return this.tutorService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tutorService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTutorDto: UpdateTutorDto) {
    return this.tutorService.update(+id, updateTutorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tutorService.remove(+id);
  }

  @Post(':tutorId/hijos/:hijoId')
  addHijo(@Param('tutorId') tutorId: string, @Param('hijoId') hijoId: string) {
    return this.tutorService.addHijo(+tutorId, +hijoId);
  }

  @Delete(':tutorId/hijos/:hijoId')
  removeHijo(@Param('tutorId') tutorId: string, @Param('hijoId') hijoId: string) {
    return this.tutorService.removeHijo(+tutorId, +hijoId);
  }
}
