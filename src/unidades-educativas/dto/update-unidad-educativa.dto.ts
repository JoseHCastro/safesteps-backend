import { PartialType } from '@nestjs/mapped-types';
import { CreateUnidadEducativaDto } from './create-unidad-educativa.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateUnidadEducativaDto extends PartialType(CreateUnidadEducativaDto) {
  @IsOptional()
  @IsBoolean({ message: 'El campo verificado debe ser verdadero o falso' })
  verificado?: boolean;
}
