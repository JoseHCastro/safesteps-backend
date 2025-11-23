import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class SearchUnidadEducativaDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsBoolean()
  verificado?: boolean;
}
