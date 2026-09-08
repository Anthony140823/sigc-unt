// src/common/common.module.ts
import { Global, Module } from '@nestjs/common';
import { EmailService } from './services/email.service';
import { AuditoriaSistemaService } from './services/auditoria-sistema.service';
import { ExportacionService } from './services/exportacion.service';
import { NotificacionesListener } from './listeners/notificaciones.listener';

@Global()
@Module({
  providers: [
    EmailService,
    AuditoriaSistemaService,
    ExportacionService,
    NotificacionesListener,
  ],
  exports: [
    EmailService,
    AuditoriaSistemaService,
    ExportacionService,
  ],
})
export class CommonModule {}
