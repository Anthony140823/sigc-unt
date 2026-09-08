// src/modules/riesgos/riesgos.service.ts
// ================================================================
import {
  Injectable, NotFoundException, ConflictException, Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CrearRiesgoDto } from './dto/crear-riesgo.dto';
import { ActualizarRiesgoDto } from './dto/actualizar-riesgo.dto';
import { FiltrarRiesgosDto } from './dto/filtrar-riesgos.dto';
import { CrearPlanMitigacionDto } from './dto/crear-plan-mitigacion.dto';
import { RegistrarSeguimientoDto } from './dto/registrar-seguimiento.dto';
import { construirPaginacion, construirRespuestaPaginada } from '../../common/utils/paginacion.util';
import { generarCodigo } from '../../common/utils/paginacion.util';

@Injectable()
export class RiesgosService {
  private readonly logger = new Logger(RiesgosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async crear(dto: CrearRiesgoDto, creadoPor: string) {
    // Código automático: RIES-2025-0001
    const conteo = await this.prisma.riesgos.count({
      where: { codigo: { startsWith: `RIES-${new Date().getFullYear()}` } },
    });
    const codigo = generarCodigo('RIES', conteo + 1);

    // Determinar nivel de riesgo automáticamente por puntuación
    const puntuacion = dto.probabilidad * dto.impacto;
    const nivelRiesgo = await this.prisma.niveles_riesgo.findFirst({
      where: {
        rango_min: { lte: puntuacion },
        rango_max: { gte: puntuacion },
        esta_activo: true,
      },
    });

    const estadoInicial = await this.prisma.estados_flujo.findFirst({
      where: { modulo: 'GR', codigo: 'IDENTIFICADO' },
    });

    const riesgo = await this.prisma.riesgos.create({
      data: {
        codigo,
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        tipo_riesgo: dto.tipo_riesgo,
        area_id: dto.area_id,
        proceso_id: dto.proceso_id,
        objetivo_estrategico_id: dto.objetivo_estrategico_id,
        causa: dto.causa,
        consecuencia: dto.consecuencia,
        probabilidad: dto.probabilidad,
        impacto: dto.impacto,
        nivel_riesgo_id: nivelRiesgo!.id,
        responsable_id: dto.responsable_id,
        estado_id: estadoInicial!.id,
        creado_por: creadoPor,
      },
      include: {
        areas: { select: { nombre: true } },
        niveles_riesgo: true,
        estados_flujo: true,
      },
    });

    // Alerta si es crítico o alto
    if (['CRITICO', 'ALTO'].includes(nivelRiesgo?.codigo || '')) {
      this.eventEmitter.emit('riesgo.nivel-critico', {
        riesgoId: riesgo.id, codigo, nivel: nivelRiesgo?.codigo, areaId: dto.area_id,
      });
    }

    return riesgo;
  }

  async findAll(filtros: FiltrarRiesgosDto) {
    const { pagina, limite, skip, order, sortBy } = construirPaginacion(filtros);
    const where: any = { activo: true };
    const direccionOrden = order as Prisma.SortOrder;

    if (filtros.tipo_riesgo) where.tipo_riesgo = filtros.tipo_riesgo;
    if (filtros.area_id) where.area_id = filtros.area_id;
    if (filtros.nivel_id) where.nivel_riesgo_id = filtros.nivel_id;
    if (filtros.estado_codigo) where.estados_flujo = { codigo: filtros.estado_codigo };

    const [datos, total] = await Promise.all([
      this.prisma.riesgos.findMany({
        where,
        include: {
          areas: { select: { nombre: true } },
          niveles_riesgo: true,
          estados_flujo: { select: { codigo: true, nombre: true, color_hex: true } },
          procesos: { select: { nombre: true } },
          objetivos_estrategicos: { select: { codigo: true, nombre: true } },
          _count: { select: { planes_mitigacion: true, seguimientos_riesgo: true } },
        },
        skip, take: limite,
        orderBy: sortBy === 'puntuacion'
          ? { puntuacion: direccionOrden }
          : { [sortBy]: direccionOrden },
      }),
      this.prisma.riesgos.count({ where }),
    ]);

    return construirRespuestaPaginada(datos, total, pagina, limite);
  }

  async listarTodos() {
    return this.prisma.riesgos.findMany({
      where: { activo: true },
      include: {
        areas: { select: { nombre: true } },
        niveles_riesgo: true,
        estados_flujo: { select: { codigo: true, nombre: true, color_hex: true } },
        procesos: { select: { nombre: true } },
        objetivos_estrategicos: { select: { codigo: true, nombre: true } },
      },
      orderBy: { creado_en: 'desc' },
    });
  }

  async findOne(id: string) {
    const riesgo = await this.prisma.riesgos.findUnique({
      where: { id },
      include: {
        areas: true,
        procesos: { select: { nombre: true } },
        objetivos_estrategicos: true,
        niveles_riesgo: true,
        estados_flujo: true,
        usuarios_riesgos_responsable_idTousuarios: {
          select: { nombres: true, apellidos: true },
        },
        planes_mitigacion: {
          include: { estados_flujo: true },
        },
        seguimientos_riesgo: {
          orderBy: { fecha_seguimiento: 'desc' },
          take: 10,
        },
      },
    });
    if (!riesgo) throw new NotFoundException(`Riesgo ${id} no encontrado.`);
    return riesgo;
  }

  async actualizar(id: string, dto: ActualizarRiesgoDto, modificadoPor: string) {
    await this.findOne(id);

    // Recalcular nivel si cambia probabilidad o impacto
    let nivelRiesgoId: number | undefined;
    if (dto.probabilidad !== undefined || dto.impacto !== undefined) {
      const riesgoActual = await this.prisma.riesgos.findUnique({ where: { id } }) as any;
      const prob = dto.probabilidad ?? riesgoActual.probabilidad;
      const imp  = dto.impacto    ?? riesgoActual.impacto;
      const puntuacion = prob * imp;

      const nivel = await this.prisma.niveles_riesgo.findFirst({
        where: {
          rango_min: { lte: puntuacion },
          rango_max: { gte: puntuacion },
          esta_activo: true,
        },
      });
      if (nivel) nivelRiesgoId = nivel.id;
    }

    return this.prisma.riesgos.update({
      where: { id },
      data: {
        ...dto,
        ...(nivelRiesgoId ? { nivel_riesgo_id: nivelRiesgoId } : {}),
        modificado_por: modificadoPor,
      },
      include: { niveles_riesgo: true, estados_flujo: true },
    });
  }

  async crearPlanMitigacion(riesgoId: string, dto: CrearPlanMitigacionDto, creadoPor: string) {
    await this.findOne(riesgoId);

    const estadoInicial = await this.prisma.estados_flujo.findFirst({
      where: { modulo: 'GR', codigo: 'EN_TRATAMIENTO' },
    });

    const plan = await this.prisma.planes_mitigacion.create({
      data: {
        riesgo_id: riesgoId,
        tipo_respuesta: dto.tipo_respuesta,
        descripcion: dto.descripcion,
        responsable_id: dto.responsable_id,
        fecha_inicio: dto.fecha_inicio ? new Date(dto.fecha_inicio) : undefined,
        fecha_fin: dto.fecha_fin ? new Date(dto.fecha_fin) : undefined,
        estado_id: estadoInicial!.id,
        probabilidad_residual: dto.probabilidad_residual,
        impacto_residual: dto.impacto_residual,
      },
    });

    // Avanzar riesgo a EN_TRATAMIENTO
    await this.prisma.riesgos.update({
      where: { id: riesgoId },
      data: { estado_id: estadoInicial!.id },
    });

    return plan;
  }

  async registrarSeguimiento(riesgoId: string, dto: RegistrarSeguimientoDto, registradoPor: string) {
    await this.findOne(riesgoId);

    return this.prisma.seguimientos_riesgo.create({
      data: {
        riesgo_id: riesgoId,
        fecha_seguimiento: new Date(),
        probabilidad_actual: dto.probabilidad_actual,
        impacto_actual: dto.impacto_actual,
        estado_control: dto.estado_control,
        observaciones: dto.observaciones,
        registrado_por: registradoPor,
      },
    });
  }

  async mapaCalor() {
    const riesgos = await this.prisma.riesgos.findMany({
      where: { activo: true },
      select: {
        probabilidad: true, impacto: true, puntuacion: true,
        nombre: true, codigo: true,
        niveles_riesgo: { select: { codigo: true, color_hex: true } },
      },
    });

    // Agrupa por celda probabilidad × impacto para heatmap
    const celdas: Record<string, { count: number; riesgos: any[] }> = {};
    for (const r of riesgos) {
      const key = `${r.probabilidad}x${r.impacto}`;
      if (!celdas[key]) celdas[key] = { count: 0, riesgos: [] };
      celdas[key].count++;
      celdas[key].riesgos.push({ codigo: r.codigo, nombre: r.nombre });
    }

    return { celdas, total: riesgos.length };
  }
}
