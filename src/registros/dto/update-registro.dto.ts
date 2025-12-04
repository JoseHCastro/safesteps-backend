import { IsDate, IsNumber, IsOptional, IsArray, ValidateNested } from 'class-validator';
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
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateRegistroDto)
  registros: UpdateRegistroDto[];
}