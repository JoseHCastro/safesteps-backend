import { IsDate, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateRegistroDto {
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  hora?: Date;

  @IsNumber()
  @IsOptional()
  latitud?: number;

  @IsNumber()
  @IsOptional()
  longitud?: number;
}

export class SyncRegistrosBatchDto {
  registros: UpdateRegistroDto[];
}