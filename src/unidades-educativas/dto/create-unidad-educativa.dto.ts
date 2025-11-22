import { IsString, IsNotEmpty, MinLength, IsNumber, Min, Max, IsOptional, IsInt } from 'class-validator';

export class CreateUnidadEducativaDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  nombre: string;

  @IsString()
  @IsNotEmpty({ message: 'La dirección es requerida' })
  @MinLength(5, { message: 'La dirección debe tener al menos 5 caracteres' })
  direccion: string;

  @IsNumber({}, { message: 'La latitud debe ser un número' })
  @Min(-90, { message: 'La latitud debe estar entre -90 y 90' })
  @Max(90, { message: 'La latitud debe estar entre -90 y 90' })
  latitud: number;

  @IsNumber({}, { message: 'La longitud debe ser un número' })
  @Min(-180, { message: 'La longitud debe estar entre -180 y 180' })
  @Max(180, { message: 'La longitud debe estar entre -180 y 180' })
  longitud: number;

  @IsOptional()
  @IsInt({ message: 'El radio de seguridad debe ser un número entero' })
  @Min(50, { message: 'El radio de seguridad debe ser al menos 50 metros' })
  @Max(1000, { message: 'El radio de seguridad no puede exceder 1000 metros' })
  radio_seguridad_metros?: number;
}
