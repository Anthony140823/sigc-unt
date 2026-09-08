// src/modules/acreditacion/acreditacion.service.ts
// ================================================================
import {
  Injectable, NotFoundException, ConflictException,
  BadRequestException, Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../database/prisma.service';
import { IniciarProcesoDto } from './dto/iniciar-proceso.dto';
import { RegistrarAutoevaluacionDto } from './dto/registrar-autoevaluacion.dto';
import { SubirEvidenciaDto } from './dto/subir-evidencia.dto';
import { FiltrarAcreditacionDto } from './dto/filtrar-acreditacion.dto';
import { construirPaginacion, construirRespuestaPaginada } from '../../common/utils/paginacion.util';
import { estaProximoAVencer } from '../../common/utils/paginacion.util';

@Injectable()
export class AcreditacionService {
  private readonly logger = new Logger(AcreditacionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ═══════════════════════════════════════════════════════
  // PROCESOS DE ACREDITACIÓN
  // ═══════════════════════════════════════════════════════

  async iniciarProceso(dto: IniciarProcesoDto, creadoPor: string) {
    // Verificar que no exista un proceso activo del mismo estándar para el programa
    const procesoActivo = await this.prisma.procesos_acreditacion.findFirst({
      where: {
        programa_id: dto.programa_id,
        estandar_id: dto.estandar_id,
        estados_flujo: { codigo: { notIn: ['ACREDITADO', 'NO_ACREDITADO'] } },
      },
    });
    if (procesoActivo) {
      throw new ConflictException(
        'Ya existe un proceso de acreditación activo para este programa con el estándar seleccionado.',
      );
    }

    const estadoInicial = await this.prisma.estados_flujo.findFirst({
      where: { modulo: 'AA', codigo: 'PLANIFICACION' },
    });

    const proceso = await this.prisma.procesos_acreditacion.create({
      data: {
        programa_id: dto.programa_id,
        estandar_id: dto.estandar_id,
        tipo_proceso: dto.tipo_proceso,
        anio_inicio: dto.anio_inicio || new Date().getFullYear(),
        fecha_inicio: dto.fecha_inicio ? new Date(dto.fecha_inicio) : new Date(),
        fecha_visita_externa: dto.fecha_visita_externa
          ? new Date(dto.fecha_visita_externa) : undefined,
        fecha_vencimiento: dto.fecha_vencimiento
          ? new Date(dto.fecha_vencimiento) : undefined,
        estado_id: estadoInicial!.id,
        creado_por: creadoPor,
      },
      include: {
        programas_academicos: { select: { nombre: true, nivel: true } },
        estandares_acreditacion: true,
        estados_flujo: true,
      },
    });

    this.logger.log(`Proceso de acreditación iniciado: Programa ${dto.programa_id} - Estándar ${dto.estandar_id}`);
    this.eventEmitter.emit('acreditacion.proceso-iniciado', {
      procesoId: proceso.id,
      programaId: dto.programa_id,
      creadoPor,
    });

    return proceso;
  }

  async findAllProcesos(filtros: FiltrarAcreditacionDto) {
    const { pagina, limite, skip, order, sortBy } = construirPaginacion(filtros);
    const where: any = {};

    if (filtros.programa_id) where.programa_id = filtros.programa_id;
    if (filtros.estandar_id) where.estandar_id = filtros.estandar_id;
    if (filtros.estado_codigo) where.estados_flujo = { codigo: filtros.estado_codigo };

    const [datos, total] = await Promise.all([
      this.prisma.procesos_acreditacion.findMany({
        where,
        include: {
          programas_academicos: {
            select: { nombre: true, nivel: true, modalidad: true },
            include: { facultades: { select: { nombre_corto: true } } },
          },
          estandares_acreditacion: { select: { codigo: true, nombre: true, organismo: true } },
          estados_flujo: { select: { codigo: true, nombre: true, color_hex: true } },
          _count: { select: { autoevaluaciones: true } },
        },
        skip, take: limite,
        orderBy: { [sortBy]: order },
      }),
      this.prisma.procesos_acreditacion.count({ where }),
    ]);

    return construirRespuestaPaginada(datos, total, pagina, limite);
  }

  async findOneProceso(id: string) {
    const proceso = await this.prisma.procesos_acreditacion.findUnique({
      where: { id },
      include: {
        programas_academicos: {
          include: { facultades: true },
        },
        estandares_acreditacion: {
          include: {
            factores_estandar: {
              include: {
                criterios_factor: {
                  include: {
                    autoevaluaciones: {
                      where: { proceso_acreditacion_id: id },
                      include: { estados_flujo: true },
                    },
                  },
                  orderBy: { orden: 'asc' },
                },
              },
              orderBy: { orden: 'asc' },
            },
          },
        },
        estados_flujo: true,
      },
    });

    if (!proceso) throw new NotFoundException(`Proceso de acreditación ${id} no encontrado.`);

    // Calcular avance global del proceso
    const totalCriterios = await this.prisma.criterios_factor.count({
      where: { factor_id: { in: [] } }, // simplificado
    });

    return proceso;
  }

  async cambiarEstado(id: string, nuevoCodigo: string, usuarioId: string) {
    const estado = await this.prisma.estados_flujo.findFirst({
      where: { modulo: 'AA', codigo: nuevoCodigo },
    });
    if (!estado) throw new NotFoundException(`Estado AA '${nuevoCodigo}' no encontrado.`);

    const data: any = { estado_id: estado.id };
    if (nuevoCodigo === 'ACREDITADO') {
      data.fecha_acreditacion = new Date();
    }

    return this.prisma.procesos_acreditacion.update({
      where: { id },
      data,
      include: { estados_flujo: true },
    });
  }

  // ═══════════════════════════════════════════════════════
  // AUTOEVALUACIONES POR CRITERIO
  // ═══════════════════════════════════════════════════════

  async registrarAutoevaluacion(
    procesoId: string,
    criterioId: string,
    dto: RegistrarAutoevaluacionDto,
    usuarioId: string,
  ) {
    // Verificar que el proceso existe
    await this.prisma.procesos_acreditacion.findUniqueOrThrow({ where: { id: procesoId } });

    // Verificar que el criterio existe
    const criterio = await this.prisma.criterios_factor.findUnique({ where: { id: criterioId } });
    if (!criterio) throw new NotFoundException(`Criterio ${criterioId} no encontrado.`);

    const estadoInicial = await this.prisma.estados_flujo.findFirst({
      where: { modulo: 'AA', codigo: 'AUTOEVALUACION' },
    });

    // Upsert: actualiza si ya existe la autoevaluación del criterio en este proceso
    const autoevaluacion = await this.prisma.autoevaluaciones.upsert({
      where: {
        proceso_acreditacion_id_criterio_id: {
          proceso_acreditacion_id: procesoId,
          criterio_id: criterioId,
        },
      },
      create: {
        proceso_acreditacion_id: procesoId,
        criterio_id: criterioId,
        puntuacion: dto.puntuacion,
        nivel_logro: dto.nivel_logro,
        fortalezas: dto.fortalezas,
        debilidades: dto.debilidades,
        oportunidades: dto.oportunidades,
        plan_mejora: dto.plan_mejora,
        responsable_id: dto.responsable_id || usuarioId,
        estado_id: estadoInicial!.id,
        fecha_evaluacion: new Date(),
      },
      update: {
        puntuacion: dto.puntuacion,
        nivel_logro: dto.nivel_logro,
        fortalezas: dto.fortalezas,
        debilidades: dto.debilidades,
        oportunidades: dto.oportunidades,
        plan_mejora: dto.plan_mejora,
        responsable_id: dto.responsable_id || usuarioId,
      },
    });

    // Recalcular puntuación total del proceso
    await this.recalcularPuntuacionProceso(procesoId);

    return autoevaluacion;
  }

  async obtenerMatrizCumplimiento(procesoId: string) {
    const proceso = await this.prisma.procesos_acreditacion.findUnique({
      where: { id: procesoId },
      select: { estandar_id: true },
    });
    if (!proceso) throw new NotFoundException('Proceso no encontrado.');

    const factores = await this.prisma.factores_estandar.findMany({
      where: { estandar_id: proceso.estandar_id },
      include: {
        criterios_factor: {
          include: {
            autoevaluaciones: {
              where: { proceso_acreditacion_id: procesoId },
            },
          },
          orderBy: { orden: 'asc' },
        },
      },
      orderBy: { orden: 'asc' },
    });

    // Calcular estadísticas por factor
    return factores.map((f: any) => {
      const criterios = f.criterios_factor;
      const evaluados = criterios.filter((c: any) => (c as any).autoevaluaciones.length > 0);
      const logrados = criterios.filter((c: any) =>
        (c as any).autoevaluaciones[0]?.nivel_logro === 'LOGRADO',
      );

      return {
        factor_id: f.id,
        factor_codigo: f.codigo,
        factor_nombre: f.nombre,
        ponderacion: f.ponderacion,
        total_criterios: criterios.length,
        criterios_evaluados: evaluados.length,
        criterios_logrados: logrados.length,
        porcentaje_avance: criterios.length
          ? Math.round((evaluados.length / criterios.length) * 100) : 0,
        criterios: criterios.map((c: any) => ({
          criterio_id: c.id,
          criterio_codigo: c.codigo,
          criterio_nombre: c.nombre,
          autoevaluacion: (c as any).autoevaluaciones[0] || null,
        })),
      };
    });
  }

  // ═══════════════════════════════════════════════════════
  // EVIDENCIAS (tabla polimórfica)
  // ═══════════════════════════════════════════════════════

  async registrarEvidencia(dto: SubirEvidenciaDto, subioPor: string) {
    return this.prisma.evidencias.create({
      data: {
        entidad_tipo: dto.entidad_tipo,
        entidad_id: dto.entidad_id,
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        archivo_url: dto.archivo_url,
        tipo_mime: dto.tipo_mime,
        tamano_bytes: dto.tamano_bytes,
        codigo_evidencia: dto.codigo_evidencia,
        fecha_documento: dto.fecha_documento ? new Date(dto.fecha_documento) : undefined,
        subido_por: subioPor,
      },
    });
  }

  async obtenerEvidencias(entidadTipo: string, entidadId: string) {
    return this.prisma.evidencias.findMany({
      where: { entidad_tipo: entidadTipo, entidad_id: entidadId },
      include: {
        usuarios: { select: { nombres: true, apellidos: true } },
      },
      orderBy: { creado_en: 'desc' },
    });
  }

  // ═══════════════════════════════════════════════════════
  // CRONOGRAMA Y ALERTAS
  // ═══════════════════════════════════════════════════════

  async cronogramaAcreditacion() {
    const procesos = await this.prisma.procesos_acreditacion.findMany({
      where: {
        estados_flujo: { codigo: { notIn: ['ACREDITADO', 'NO_ACREDITADO'] } },
      },
      include: {
        programas_academicos: { select: { nombre: true, nivel: true } },
        estandares_acreditacion: { select: { codigo: true, organismo: true } },
        estados_flujo: { select: { codigo: true, nombre: true, color_hex: true } },
      },
      orderBy: { fecha_visita_externa: 'asc' },
    });

    return procesos.map((p: any) => ({
      ...p,
      alerta_visita: p.fecha_visita_externa
        ? estaProximoAVencer(p.fecha_visita_externa, 90) : false,
      alerta_vencimiento: p.fecha_vencimiento
        ? estaProximoAVencer(p.fecha_vencimiento, 180) : false,
    }));
  }

  // ─── Privado ──────────────────────────────────────────

  private async recalcularPuntuacionProceso(procesoId: string) {
    const autoevaluaciones = await this.prisma.autoevaluaciones.findMany({
      where: { proceso_acreditacion_id: procesoId },
      include: {
        criterios_factor: {
          include: { factores_estandar: { select: { ponderacion: true } } },
        },
      },
    });

    if (!autoevaluaciones.length) return;

    const totalPuntuacion = autoevaluaciones.reduce((acc: any, ae: any) => {
      return acc + (Number(ae.puntuacion) || 0);
    }, 0);

    const promedio = totalPuntuacion / autoevaluaciones.length;

    await this.prisma.procesos_acreditacion.update({
      where: { id: procesoId },
      data: { puntuacion_total: Math.round(promedio * 100) / 100 },
    });
  }
}
