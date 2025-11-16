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
import { HijoService } from './hijo.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateHijoDto } from './dto/create-hijo.dto';
import { UpdateHijoDto } from './dto/update-hijo.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Controller('hijos')
@UseGuards(JwtAuthGuard)
export class HijoController {
  constructor(private readonly hijoService: HijoService) {}

  @Post()
  create(@Body() createHijoDto: CreateHijoDto) {
    return this.hijoService.create(createHijoDto);
  }

  @Get()
  findAll() {
    return this.hijoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.hijoService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateHijoDto: UpdateHijoDto) {
    return this.hijoService.update(+id, updateHijoDto);
  }

  @Patch(':id/location')
  updateLocation(@Param('id') id: string, @Body() updateLocationDto: UpdateLocationDto) {
    return this.hijoService.updateLocation(+id, updateLocationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.hijoService.remove(+id);
  }
}
