// src/modules/dashboard/dashboard.service.ts
// ================================================================
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * NIVEL ESTRATÉGICO — Rector y Vicerrectores
   * Resumen global del SGC institucional
   */
  async dashboardEjecutivo() {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    const [
      documentosVigentes,
      documentosPorAprobar,
      auditoriasAnio,
      hallazgosAbiertos,
      ncAbiertas,
      accionesVencidas,
      riesgosCriticos,
      indicadoresRojo,
      encuestasActivas,
      satisfaccionPromedio,
      procesosAcreditacion,
    ] = await Promise.all([
      // Documentos publicados
      this.prisma.documentos.count({
        where: { esta_activo: true, eliminado_en: null, estados_flujo: { codigo: 'PUBLICADO' } },
      }),

      // Documentos pendientes de aprobación
      this.prisma.documentos.count({
        where: {
          esta_activo: true,
          eliminado_en: null,
          estados_flujo: { codigo: { in: ['BORRADOR', 'EN_REVISION'] } },
        },
      }),

      // Auditorías del año actual
      this.prisma.auditorias.count({
        where: {
          fecha_programada_inicio: {
            gte: new Date(`${hoy.getFullYear()}-01-01`),
            lte: new Date(`${hoy.getFullYear()}-12-31`),
          },
        },
      }),

      // Hallazgos sin cerrar
      this.prisma.hallazgos.count({
        where: { fecha_cierre_real: null, estados_flujo: { codigo: { notIn: ['CERRADO', 'CERRADO_OBS'] } } },
      }),

      // NC abiertas
      this.prisma.no_conformidades.count({
        where: { estados_flujo: { codigo: { notIn: ['CERRADA'] } } },
      }),

      // Acciones CAPA vencidas
      this.prisma.acciones_capa.count({
        where: {
          fecha_real_cierre: null,
          fecha_compromiso: { lt: hoy },
        },
      }),

      // Riesgos críticos activos
      this.prisma.riesgos.count({
        where: { activo: true, niveles_riesgo: { codigo: 'CRITICO' } },
      }),

      // Indicadores en rojo este mes
      this.prisma.mediciones_indicador.count({
        where: {
          estado_semaforo: 'ROJO',
          fecha_registro: { gte: inicioMes },
        },
      }),

      // Encuestas activas
      this.prisma.encuestas.count({
        where: { estados_flujo: { codigo: 'ACTIVA' } },
      }),

      // Satisfacción promedio del último ciclo (promedio de todas las mediciones Likert)
      this.prisma.respuestas_encuesta.aggregate({
        _avg: { valor_numerico: true },
        where: {
          valor_numerico: { not: null },
          creado_en: { gte: inicioMes },
        },
      }),

      // Procesos de acreditación activos
      this.prisma.procesos_acreditacion.count({
        where: { estados_flujo: { codigo: { notIn: ['ACREDITADO', 'NO_ACREDITADO'] } } },
      }),
    ]);

    // Distribución de indicadores por semáforo (último mes)
    const semaforos = await this.prisma.mediciones_indicador.groupBy({
      by: ['estado_semaforo'],
      _count: { id: true },
      where: { fecha_registro: { gte: inicioMes } },
    });

    const distribucionSemaforo = semaforos.reduce(
      (acc: any, s: any) => {
        acc[s.estado_semaforo.toLowerCase()] = s._count.id;
        return acc;
      },
      { verde: 0, amarillo: 0, rojo: 0 },
    );
    const satisfaccionPromedioValor = Number(satisfaccionPromedio._avg.valor_numerico ?? 0);

    return {
      kpis: {
        documentos_vigentes: documentosVigentes,
        documentos_por_aprobar: documentosPorAprobar,
        auditorias_anio: auditoriasAnio,
        hallazgos_abiertos: hallazgosAbiertos,
        nc_abiertas: ncAbiertas,
        acciones_vencidas: accionesVencidas,
        riesgos_criticos: riesgosCriticos,
        indicadores_rojo: indicadoresRojo,
        encuestas_activas: encuestasActivas,
        satisfaccion_promedio: Math.round(satisfaccionPromedioValor * 100) / 100,
        procesos_acreditacion: procesosAcreditacion,
      },
      distribucion_semaforo: distribucionSemaforo,
      fecha_calculo: hoy.toISOString(),
    };
  }

  /**
   * NIVEL TÁCTICO — Directores y Decanos
   * Métricas por área organizacional
   */
  async dashboardTactico(areaId?: string) {
    const whereArea = areaId ? { area_id: areaId } : {};
    const hoy = new Date();

    const [
      ncPorEstado,
      hallazgosPorTipo,
      indicadoresPorSemaforo,
      accionesProximas,
      riesgosPorNivel,
    ] = await Promise.all([
      // NC por estado del área
      this.prisma.no_conformidades.groupBy({
        by: ['estado_id'],
        _count: { id: true },
        where: areaId ? { area_id: areaId } : {},
      }),

      // Hallazgos por tipo de severidad
      this.prisma.hallazgos.groupBy({
        by: ['tipo_id'],
        _count: { id: true },
        where: areaId ? { area_id: areaId } : {},
      }),

      // Indicadores por semáforo del área
      this.prisma.mediciones_indicador.groupBy({
        by: ['estado_semaforo'],
        _count: { id: true },
        where: {
          indicadores: areaId ? { area_responsable_id: areaId } : {},
        },
      }),

      // Acciones próximas a vencer (15 días)
      this.prisma.acciones_capa.count({
        where: {
          ...(areaId ? { area_id: areaId } : {}),
          fecha_real_cierre: null,
          fecha_compromiso: {
            gte: hoy,
            lte: new Date(hoy.getTime() + 15 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Riesgos por nivel del área
      this.prisma.riesgos.groupBy({
        by: ['nivel_riesgo_id'],
        _count: { id: true },
        where: { activo: true, ...(areaId ? { area_id: areaId } : {}) },
      }),
    ]);

    return {
      nc_por_estado: ncPorEstado,
      hallazgos_por_tipo: hallazgosPorTipo,
      indicadores_semaforo: indicadoresPorSemaforo,
      acciones_proximas_vencer: accionesProximas,
      riesgos_por_nivel: riesgosPorNivel,
      area_id: areaId || 'institucional',
    };
  }

  /**
   * NIVEL OPERATIVO — Jefes de Oficina y Coordinadores
   * Pendientes del usuario y su área
   */
  async dashboardOperativo(usuarioId: string, areaId?: string) {
    const hoy = new Date();

    const [
      misDocumentosPendientes,
      misAccionesCapa,
      misIndicadoresPendientes,
      notificacionesSinLeer,
    ] = await Promise.all([
      // Documentos pendientes de mi aprobación
      this.prisma.aprobaciones_documento.count({
        where: {
          usuario_id: usuarioId,
          accion: null,    // Pendientes de acción
          fecha_accion: null,
        },
      }),

      // Mis acciones CAPA activas
      this.prisma.acciones_capa.findMany({
        where: {
          responsable_id: usuarioId,
          fecha_real_cierre: null,
          estados_flujo: { codigo: { notIn: ['CERRADA', 'CERRADA_INEF'] } },
        },
        include: {
          no_conformidades: { select: { codigo: true } },
          estados_flujo: { select: { codigo: true, nombre: true, color_hex: true } },
        },
        orderBy: { fecha_compromiso: 'asc' },
        take: 5,
      }),

      // Indicadores que debo registrar este mes
      this.prisma.indicadores.count({
        where: {
          responsable_id: usuarioId,
          esta_activo: true,
          // Sin medición este mes
          mediciones_indicador: {
            none: {
              fecha_registro: { gte: new Date(hoy.getFullYear(), hoy.getMonth(), 1) },
            },
          },
        },
      }),

      // Notificaciones sin leer
      this.prisma.notificaciones.count({
        where: { usuario_id: usuarioId, leida: false },
      }),
    ]);

    return {
      documentos_pendientes_aprobacion: misDocumentosPendientes,
      mis_acciones_capa: misAccionesCapa,
      indicadores_pendientes_registro: misIndicadoresPendientes,
      notificaciones_sin_leer: notificacionesSinLeer,
      usuario_id: usuarioId,
    };
  }

  /**
   * Estado de acreditación para el dashboard estratégico
   */
  async estadoAcreditacion() {
    return this.prisma.procesos_acreditacion.findMany({
      include: {
        programas_academicos: {
          select: { nombre: true, nivel: true },
          include: { facultades: { select: { nombre_corto: true } } },
        },
        estandares_acreditacion: { select: { codigo: true, organismo: true } },
        estados_flujo: { select: { codigo: true, nombre: true, color_hex: true } },
      },
      orderBy: { fecha_vencimiento: 'asc' },
    });
  }

  /**
   * Resumen de notificaciones para el usuario
   */
  async misNotificaciones(usuarioId: string, soloNoLeidas = false) {
    return this.prisma.notificaciones.findMany({
      where: {
        usuario_id: usuarioId,
        ...(soloNoLeidas ? { leida: false } : {}),
      },
      orderBy: { creado_en: 'desc' },
      take: 30,
    });
  }

  async marcarNotificacionLeida(notificacionId: number, usuarioId: string) {
    return this.prisma.notificaciones.updateMany({
      where: { id: notificacionId, usuario_id: usuarioId },
      data: { leida: true, fecha_lectura: new Date() },
    });
  }

  async marcarTodasLeidas(usuarioId: string) {
    return this.prisma.notificaciones.updateMany({
      where: { usuario_id: usuarioId, leida: false },
      data: { leida: true, fecha_lectura: new Date() },
    });
  }
}
