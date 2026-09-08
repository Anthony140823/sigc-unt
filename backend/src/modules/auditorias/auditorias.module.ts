// src/modules/auditorias/auditorias.module.ts
import { Module } from '@nestjs/common';
import { AuditoriasController } from './auditorias.controller';
import { ChecklistsController } from './checklists.controller';
import { AuditoriasService } from './auditorias.service';

@Module({
  controllers: [AuditoriasController, ChecklistsController],
  providers: [AuditoriasService],
  exports: [AuditoriasService],
})
export class AuditoriasModule {}
