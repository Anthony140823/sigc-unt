// src/modules/riesgos/riesgos.module.ts
import { Module } from '@nestjs/common';
import { RiesgosController } from './riesgos.controller';
import { RiesgosService } from './riesgos.service';

@Module({
  controllers: [RiesgosController],
  providers: [RiesgosService],
  exports: [RiesgosService],
})
export class RiesgosModule {}

// ================================================================
