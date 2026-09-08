// src/modules/indicadores/indicadores.module.ts
import { Module } from '@nestjs/common';
import { IndicadoresController } from './indicadores.controller';
import { IndicadoresService } from './indicadores.service';

@Module({
  controllers: [IndicadoresController],
  providers: [IndicadoresService],
  exports: [IndicadoresService],
})
export class IndicadoresModule {}

// ================================================================
