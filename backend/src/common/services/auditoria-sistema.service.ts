// src/common/services/auditoria-sistema.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../database/prisma.service';

export interface EventoAuditoria {
  usuarioId?: string;
  accion: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'APPROVE' | 'REJECT' | 'PUBLISH';
  entidad: string;
  entidadId?: string;
  datosAnteriores?: Record<string, any>;
  datosNuevos?: Record<string, any>;
  ipOrigen?: string;
  userAgent?: string;
  resultado?: 'EXITO' | 'FALLIDO';
  detalleError?: string;
}

@Injectable()
export class AuditoriaSistemaService {
  private readonly logger = new Logger(AuditoriaSistemaService.name);

  constructor(private readonly prisma: PrismaService) {}

  async registrar(evento: EventoAuditoria): Promise<void> {
    try {
      await this.prisma.log_auditoria_sistema.create({
        data: {
          usuario_id: evento.usuarioId,
          accion: evento.accion,
          entidad: evento.entidad,
          entidad_id: evento.entidadId,
          datos_anteriores: evento.datosAnteriores,
          datos_nuevos: evento.datosNuevos,
          ip_origen: evento.ipOrigen,
          user_agent: evento.userAgent,
          resultado: evento.resultado || 'EXITO',
          detalle_error: evento.detalleError,
        },
      });
    } catch (error) {
      this.logger.error('Error al registrar evento de auditoría:', error);
    }
  }

  // Escucha eventos de dominio para registro automático
  @OnEvent('usuario.creado')
  async onUsuarioCreado(payload: { usuarioId: string; creadoPor: string }) {
    await this.registrar({
      usuarioId: payload.creadoPor,
      accion: 'CREATE',
      entidad: 'usuarios',
      entidadId: payload.usuarioId,
    });
  }

  @OnEvent('usuario.eliminado')
  async onUsuarioEliminado(payload: { usuarioId: string; eliminadoPor: string }) {
    await this.registrar({
      usuarioId: payload.eliminadoPor,
      accion: 'DELETE',
      entidad: 'usuarios',
      entidadId: payload.usuarioId,
    });
  }

  @OnEvent('documento.estado-cambiado')
  async onDocumentoEstadoCambiado(payload: {
    documentoId: string;
    estadoAnterior: string;
    estadoNuevo: string;
    usuarioId: string;
  }) {
    await this.registrar({
      usuarioId: payload.usuarioId,
      accion: payload.estadoNuevo === 'PUBLICADO' ? 'PUBLISH' : 'UPDATE',
      entidad: 'documentos',
      entidadId: payload.documentoId,
      datosAnteriores: { estado: payload.estadoAnterior },
      datosNuevos: { estado: payload.estadoNuevo },
    });
  }

  @OnEvent('auth.login')
  async onLogin(payload: { usuarioId: string; ip: string }) {
    await this.registrar({
      usuarioId: payload.usuarioId,
      accion: 'LOGIN',
      entidad: 'sesiones',
      ipOrigen: payload.ip,
    });
  }

  @OnEvent('capa.nc-creada')
  async onNcCreada(payload: { ncId: string; codigo: string; creadoPor: string }) {
    await this.registrar({
      usuarioId: payload.creadoPor,
      accion: 'CREATE',
      entidad: 'no_conformidades',
      entidadId: payload.ncId,
      datosNuevos: { codigo: payload.codigo },
    });
  }

  @OnEvent('acreditacion.proceso-iniciado')
  async onProcesoAcreditacionIniciado(payload: {
    procesoId: string;
    programaId: string;
    creadoPor: string;
  }) {
    await this.registrar({
      usuarioId: payload.creadoPor,
      accion: 'CREATE',
      entidad: 'procesos_acreditacion',
      entidadId: payload.procesoId,
      datosNuevos: { programa_id: payload.programaId },
    });
  }

  // Consultas del log
  async obtenerPorEntidad(entidad: string, entidadId: string, limite = 20) {
    return this.prisma.log_auditoria_sistema.findMany({
      where: { entidad, entidad_id: entidadId },
      orderBy: { creado_en: 'desc' },
      take: limite,
    });
  }

  async obtenerPorUsuario(usuarioId: string, limite = 50) {
    return this.prisma.log_auditoria_sistema.findMany({
      where: { usuario_id: usuarioId },
      orderBy: { creado_en: 'desc' },
      take: limite,
    });
  }

  async obtenerRecientes(horas = 24) {
    const desde = new Date();
    desde.setHours(desde.getHours() - horas);

    return this.prisma.log_auditoria_sistema.findMany({
      where: { creado_en: { gte: desde } },
      orderBy: { creado_en: 'desc' },
      take: 200,
    });
  }
}
