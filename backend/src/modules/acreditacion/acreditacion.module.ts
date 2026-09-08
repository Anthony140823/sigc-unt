// src/modules/acreditacion/acreditacion.module.ts
import { Module } from '@nestjs/common';
import { AcreditacionController } from './acreditacion.controller';
import { AcreditacionService } from './acreditacion.service';

@Module({
  controllers: [AcreditacionController],
  providers: [AcreditacionService],
  exports: [AcreditacionService],
})
export class AcreditacionModule {}

// ================================================================
