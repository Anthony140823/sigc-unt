// src/modules/procesos/procesos.module.ts
import { Module } from '@nestjs/common';
import { ProcesosController } from './procesos.controller';
import { ProcesosService } from './procesos.service';

@Module({
  controllers: [ProcesosController],
  providers: [ProcesosService],
  exports: [ProcesosService],
})
export class ProcesosModule {}

// ================================================================
