// src/common/listeners/notificaciones.listener.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class NotificacionesListener {
  private readonly logger = new Logger(NotificacionesListener.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Auth ─────────────────────────────────────────────

  @OnEvent('auth.password-changed')
  async onPasswordChanged(payload: { usuarioId: string }) {
    await this.crearNotificacion(
      payload.usuarioId,
      'SEGURIDAD',
      'Contraseña actualizada',
      'Tu contraseña ha sido cambiada exitosamente. Si no realizaste este cambio, contacta al administrador.',
      '/perfil',
    );
  }

  // ─── Documentos ───────────────────────────────────────

  @OnEvent('documento.estado-cambiado')
  async onDocumentoEstadoCambiado(payload: {
    documentoId: string;
    estadoAnterior: string;
    estadoNuevo: string;
    usuarioId: string;
  }) {
    // Notificar al creador del documento
    const documento = await this.prisma.documentos.findUnique({
      where: { id: payload.documentoId },
      select: { codigo: true, titulo: true, creado_por: true },
    });

    if (!documento?.creado_por || documento.creado_por === payload.usuarioId) return;

    const mensajes: Record<string, string> = {
      EN_REVISION:  `Tu documento ${documento.codigo} fue enviado a revisión.`,
      APROBADO:     `Tu documento ${documento.codigo} ha sido aprobado.`,
      PUBLICADO:    `Tu documento ${documento.codigo} está publicado y disponible.`,
      BORRADOR:     `Tu documento ${documento.codigo} fue devuelto a borrador con observaciones.`,
      OBSOLETO:     `El documento ${documento.codigo} ha sido marcado como obsoleto.`,
    };

    const mensaje = mensajes[payload.estadoNuevo];
    if (mensaje) {
      await this.crearNotificacion(
        documento.creado_por,
        'DOCUMENTO_ESTADO',
        `Documento ${documento.codigo} — ${payload.estadoNuevo}`,
        mensaje,
        `/documentos/${payload.documentoId}`,
      );
    }
  }

  // ─── CAPA ─────────────────────────────────────────────

  @OnEvent('capa.nc-creada')
  async onNcCreada(payload: { ncId: string; codigo: string; areaId: string; creadoPor: string }) {
    // Notificar al jefe del área
    const jefes = await this.prisma.usuarios_roles.findMany({
      where: {
        area_id: payload.areaId,
        fecha_fin: null,
        roles: { codigo: 'JEFE_AREA' },
      },
      select: { usuario_id: true },
    });

    for (const jefe of jefes) {
      if (jefe.usuario_id !== payload.creadoPor) {
        await this.crearNotificacion(
          jefe.usuario_id,
          'CAPA_NC',
          `Nueva NC registrada: ${payload.codigo}`,
          `Se ha registrado una nueva no conformidad (${payload.codigo}) en su área.`,
          `/capa/no-conformidades/${payload.ncId}`,
        );
      }
    }
  }

  @OnEvent('capa.accion-asignada')
  async onAccionAsignada(payload: {
    accionId: string;
    responsableId: string;
    fechaCompromiso: string;
    ncId: string;
  }) {
    await this.crearNotificacion(
      payload.responsableId,
      'CAPA_ACCION',
      'Nueva acción CAPA asignada',
      `Se te ha asignado una acción correctiva/preventiva. Fecha límite: ${
        new Date(payload.fechaCompromiso).toLocaleDateString('es-PE')
      }.`,
      `/capa/no-conformidades/${payload.ncId}`,
    );
  }

  @OnEvent('capa.alerta-vencimiento')
  async onAlertaVencimiento(payload: {
    accionId: string;
    ncCodigo: string;
    responsableId: string;
    fechaCompromiso: Date;
    vencida: boolean;
  }) {
    const tipo = payload.vencida ? 'CAPA_VENCIDA' : 'CAPA_PROXIMA_VENCER';
    const titulo = payload.vencida
      ? `Acción CAPA VENCIDA — ${payload.ncCodigo}`
      : `Acción CAPA próxima a vencer — ${payload.ncCodigo}`;
    const mensaje = payload.vencida
      ? `La acción de la NC ${payload.ncCodigo} venció el ${
          payload.fechaCompromiso.toLocaleDateString('es-PE')
        }. Requiere atención inmediata.`
      : `La acción de la NC ${payload.ncCodigo} vence en menos de 15 días.`;

    await this.crearNotificacion(payload.responsableId, tipo, titulo, mensaje, `/capa`);
  }

  // ─── Indicadores ──────────────────────────────────────

  @OnEvent('indicador.alerta-roja')
  async onIndicadorRojo(payload: {
    indicadorId: string;
    indicadorNombre: string;
    valorReal: number;
    valorMeta: number;
    responsableId: string;
  }) {
    if (!payload.responsableId) return;

    await this.crearNotificacion(
      payload.responsableId,
      'INDICADOR_ROJO',
      `Indicador en rojo: ${payload.indicadorNombre}`,
      `El indicador "${payload.indicadorNombre}" está fuera de meta: valor real ${payload.valorReal} vs meta ${payload.valorMeta}.`,
      `/indicadores/${payload.indicadorId}`,
    );
  }

  // ─── Riesgos ──────────────────────────────────────────

  @OnEvent('riesgo.nivel-critico')
  async onRiesgoCritico(payload: {
    riesgoId: string;
    codigo: string;
    nivel: string;
    areaId: string;
  }) {
    // Notificar al director de calidad
    const directores = await this.prisma.usuarios_roles.findMany({
      where: { roles: { codigo: 'DIRECTOR_CALIDAD' }, fecha_fin: null },
      select: { usuario_id: true },
    });

    for (const dir of directores) {
      await this.crearNotificacion(
        dir.usuario_id,
        'RIESGO_CRITICO',
        `Riesgo ${payload.nivel}: ${payload.codigo}`,
        `Se ha identificado un riesgo de nivel ${payload.nivel} (${payload.codigo}) que requiere atención inmediata.`,
        `/riesgos/${payload.riesgoId}`,
      );
    }
  }

  // ─── Auditorías ───────────────────────────────────────

  @OnEvent('auditoria.hallazgo-creado')
  async onHallazgoCreado(payload: {
    hallazgoId: string;
    auditoriaId: string;
    tipoSeveridad: number;
    areaId: string;
  }) {
    if (payload.tipoSeveridad < 3) return; // Solo notificar NC Menor y Mayor

    const jefes = await this.prisma.usuarios_roles.findMany({
      where: {
        area_id: payload.areaId,
        fecha_fin: null,
        roles: { codigo: 'JEFE_AREA' },
      },
      select: { usuario_id: true },
    });

    for (const jefe of jefes) {
      await this.crearNotificacion(
        jefe.usuario_id,
        'HALLAZGO_AUDITORIA',
        'Nuevo hallazgo de auditoría en su área',
        'Se registró un hallazgo de auditoría (No Conformidad) en su área. Revise y tome las acciones correspondientes.',
        `/auditorias/hallazgos/${payload.hallazgoId}`,
      );
    }
  }

  // ─── Helper privado ───────────────────────────────────

  private async crearNotificacion(
    usuarioId: string,
    tipo: string,
    titulo: string,
    mensaje: string,
    urlAccion?: string,
  ) {
    try {
      await this.prisma.notificaciones.create({
        data: { usuario_id: usuarioId, tipo, titulo, mensaje, url_accion: urlAccion },
      });
    } catch (error) {
      this.logger.error(`Error al crear notificación para usuario ${usuarioId}:`, error);
    }
  }
}
