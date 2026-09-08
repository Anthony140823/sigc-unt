import { Module } from '@nestjs/common';
import { ProgramasAcademicosController } from './programas-academicos.controller';
import { ProgramasAcademicosService } from './programas-academicos.service';

@Module({
  controllers: [ProgramasAcademicosController],
  providers: [ProgramasAcademicosService],
  exports: [ProgramasAcademicosService],
})
export class ProgramasAcademicosModule {}
