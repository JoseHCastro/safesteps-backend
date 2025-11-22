import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UnidadesEducativasService } from './unidades-educativas.service';
import { UnidadesEducativasController } from './unidades-educativas.controller';
import { UnidadEducativa } from './entities/unidad-educativa.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UnidadEducativa])],
  controllers: [UnidadesEducativasController],
  providers: [UnidadesEducativasService],
  exports: [UnidadesEducativasService],
})
export class UnidadesEducativasModule {}
