// src/modules/capa/capa.service.ts
import {
  Injectable, NotFoundException, ConflictException,
  BadRequestException, Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../database/prisma.service';
import { CrearNoConformidadDto } from './dto/crear-no-conformidad.dto';
import { ActualizarNoConformidadDto } from './dto/actualizar-no-conformidad.dto';
import { FiltrarCapaDto } from './dto/filtrar-capa.dto';
import { CrearAnalisisCausaRaizDto } from './dto/crear-analisis-causa-raiz.dto';
import { CrearAccionCapaDto } from './dto/crear-accion-capa.dto';
import { ActualizarAccionCapaDto } from './dto/actualizar-accion-capa.dto';
import { VerificarEfectividadDto } from './dto/verificar-efectividad.dto';
import { construirPaginacion, construirRespuestaPaginada } from '../../common/utils/paginacion.util';
import { generarCodigo } from '../../common/utils/paginacion.util';
import { estaVencido, estaProximoAVencer } from '../../common/utils/paginacion.util';

@Injectable()
export class CapaService {
  private readonly logger = new Logger(CapaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ═══════════════════════════════════════════════════════
  // NO CONFORMIDADES
  // ═══════════════════════════════════════════════════════

  async crearNC(dto: CrearNoConformidadDto, creadoPor: string) {
    // Generar código secuencial: NC-2025-0042
    const conteo = await this.prisma.no_conformidades.count({
      where: { codigo: { startsWith: `NC-${new Date().getFullYear()}` } },
    });
    const codigo = generarCodigo('NC', conteo + 1, new Date().getFullYear());

    const estadoInicial = await this.prisma.estados_flujo.findFirst({
      where: { modulo: 'CAPA', codigo: 'IDENTIFICADA' },
    });
    if (!estadoInicial) throw new BadRequestException('Estado inicial CAPA no configurado.');

    const nc = await this.prisma.no_conformidades.create({
      data: {
        codigo,
        origen: dto.origen,
        hallazgo_id: dto.hallazgo_id,
        descripcion: dto.descripcion,
        requisito_afectado: dto.requisito_afectado,
        proceso_id: dto.proceso_id,
        area_id: dto.area_id,
        detectado_por: dto.detectado_por || creadoPor,
        estado_id: estadoInicial.id,
        fecha_deteccion: dto.fecha_deteccion ? new Date(dto.fecha_deteccion) : new Date(),
        creado_por: creadoPor,
      },
      include: {
        areas: { select: { id: true, nombre: true } },
        estados_flujo: true,
        hallazgos: { select: { codigo: true } },
      },
    });

    this.logger.log(`NC creada: ${codigo} - Origen: ${dto.origen}`);
    this.eventEmitter.emit('capa.nc-creada', {
      ncId: nc.id, codigo, areaId: dto.area_id, creadoPor,
    });

    return nc;
  }

  async findAllNC(filtros: FiltrarCapaDto) {
    const { pagina, limite, skip, order, sortBy } = construirPaginacion(filtros);
    const where: any = {};

    if (filtros.origen) where.origen = filtros.origen;
    if (filtros.area_id) where.area_id = filtros.area_id;
    if (filtros.estado_codigo) {
      where.estados_flujo = { codigo: filtros.estado_codigo };
    }
    if (filtros.desde) where.fecha_deteccion = { gte: new Date(filtros.desde) };
    if (filtros.hasta) {
      where.fecha_deteccion = {
        ...where.fecha_deteccion,
        lte: new Date(filtros.hasta),
      };
    }
    if (filtros.busqueda) {
      where.OR = [
        { codigo: { contains: filtros.busqueda, mode: 'insensitive' } },
        { descripcion: { contains: filtros.busqueda, mode: 'insensitive' } },
      ];
    }

    const [datos, total] = await Promise.all([
      this.prisma.no_conformidades.findMany({
        where,
        include: {
          areas: { select: { id: true, nombre: true } },
          estados_flujo: { select: { codigo: true, nombre: true, color_hex: true } },
          procesos: { select: { nombre: true } },
          _count: { select: { acciones_capa: true, analisis_causa_raiz: true } },
        },
        skip, take: limite,
        orderBy: { [sortBy]: order },
      }),
      this.prisma.no_conformidades.count({ where }),
    ]);

    return construirRespuestaPaginada(datos, total, pagina, limite);
  }

  async listarTodasNC() {
    return this.prisma.no_conformidades.findMany({
      include: {
        areas: { select: { id: true, nombre: true } },
        estados_flujo: { select: { codigo: true, nombre: true, color_hex: true } },
        procesos: { select: { nombre: true } },
      },
      orderBy: { fecha_deteccion: 'desc' },
    });
  }

  async findOneNC(id: string) {
    const nc = await this.prisma.no_conformidades.findUnique({
      where: { id },
      include: {
        areas: true,
        procesos: { select: { nombre: true, codigo: true } },
        estados_flujo: true,
        hallazgos: { select: { codigo: true, descripcion: true } },
        analisis_causa_raiz: {
          include: {
            metodos_causa_raiz: true,
            usuarios_analisis_causa_raiz_analista_idTousuarios: {
              select: { nombres: true, apellidos: true },
            },
          },
        },
        acciones_capa: {
          include: {
            estados_flujo: true,
            areas: { select: { nombre: true } },
            usuarios_acciones_capa_responsable_idTousuarios: {
              select: { nombres: true, apellidos: true },
            },
          },
          orderBy: { fecha_compromiso: 'asc' },
        },
      },
    });

    if (!nc) throw new NotFoundException(`No conformidad con ID ${id} no encontrada.`);
    return nc;
  }

  async cambiarEstadoNC(id: string, nuevoCodigo: string, usuarioId: string) {
    await this.findOneNC(id);
    const nuevoEstado = await this.prisma.estados_flujo.findFirst({
      where: { modulo: 'CAPA', codigo: nuevoCodigo },
    });
    if (!nuevoEstado) throw new NotFoundException(`Estado CAPA '${nuevoCodigo}' no encontrado.`);

    return this.prisma.no_conformidades.update({
      where: { id },
      data: { estado_id: nuevoEstado.id },
      include: { estados_flujo: true },
    });
  }

  // ═══════════════════════════════════════════════════════
  // ANÁLISIS DE CAUSA RAÍZ
  // ═══════════════════════════════════════════════════════

  async crearAnalisisCausaRaiz(ncId: string, dto: CrearAnalisisCausaRaizDto, analistaId: string) {
    await this.findOneNC(ncId);

    // Avanzar NC a estado ANALISIS
    await this.cambiarEstadoNC(ncId, 'ANALISIS', analistaId);

    const analisis = await this.prisma.analisis_causa_raiz.create({
      data: {
        nc_id: ncId,
        metodo_id: dto.metodo_id,
        descripcion_causa: dto.descripcion_causa,
        causa_raiz: dto.causa_raiz,
        factores_contribuyentes: dto.factores_contribuyentes || [],
        analista_id: analistaId,
        fecha_analisis: new Date(),
        datos_metodo: dto.datos_metodo || {},
      },
      include: { metodos_causa_raiz: true },
    });

    return analisis;
  }

  // ═══════════════════════════════════════════════════════
  // ACCIONES CAPA
  // ═══════════════════════════════════════════════════════

  async crearAccion(ncId: string, dto: CrearAccionCapaDto, creadoPor: string) {
    await this.findOneNC(ncId);

    const estadoPlanAccion = await this.prisma.estados_flujo.findFirst({
      where: { modulo: 'CAPA', codigo: 'PLAN_ACCION' },
    });

    const estadoAccion = await this.prisma.estados_flujo.findFirst({
      where: { modulo: 'CAPA', codigo: 'PLAN_ACCION' },
    });

    const accion = await this.prisma.acciones_capa.create({
      data: {
        nc_id: ncId,
        tipo_accion: dto.tipo_accion,
        descripcion: dto.descripcion,
        responsable_id: dto.responsable_id,
        area_id: dto.area_id,
        fecha_compromiso: new Date(dto.fecha_compromiso),
        estado_id: estadoAccion!.id,
        resultado_esperado: dto.resultado_esperado,
        recursos_requeridos: dto.recursos_requeridos,
      },
      include: {
        estados_flujo: true,
        usuarios_acciones_capa_responsable_idTousuarios: {
          select: { nombres: true, apellidos: true, email: true },
        },
      },
    });

    // Avanzar NC a PLAN_ACCION
    await this.cambiarEstadoNC(ncId, 'PLAN_ACCION', creadoPor);

    // Notificar al responsable
    this.eventEmitter.emit('capa.accion-asignada', {
      accionId: accion.id,
      responsableId: dto.responsable_id,
      fechaCompromiso: dto.fecha_compromiso,
      ncId,
    });

    return accion;
  }

  async actualizarAccion(accionId: string, dto: ActualizarAccionCapaDto, usuarioId: string) {
    const accion = await this.prisma.acciones_capa.findUnique({ where: { id: accionId } });
    if (!accion) throw new NotFoundException('Acción CAPA no encontrada.');

    // Si avanza a 100%, cambiar estado a VERIFICACION
    const data: any = { ...dto };
    if (dto.porcentaje_avance === 100) {
      const estadoVerif = await this.prisma.estados_flujo.findFirst({
        where: { modulo: 'CAPA', codigo: 'VERIFICACION' },
      });
      if (estadoVerif) data.estado_id = estadoVerif.id;
    }

    return this.prisma.acciones_capa.update({
      where: { id: accionId },
      data,
      include: { estados_flujo: true },
    });
  }

  async verificarEfectividad(accionId: string, dto: VerificarEfectividadDto, verificadoPor: string) {
    const accion = await this.prisma.acciones_capa.findUnique({
      where: { id: accionId },
      include: { no_conformidades: { include: { acciones_capa: true } } },
    });
    if (!accion) throw new NotFoundException('Acción CAPA no encontrada.');

    const esEfectiva = dto.es_efectiva;
    const estadoCodigo = esEfectiva ? 'CERRADA' : 'CERRADA_INEF';

    const estadoAccion = await this.prisma.estados_flujo.findFirst({
      where: { modulo: 'CAPA', codigo: estadoCodigo },
    });

    const accionActualizada = await this.prisma.acciones_capa.update({
      where: { id: accionId },
      data: {
        verificacion_efectividad: dto.descripcion_verificacion,
        verificado_por: verificadoPor,
        fecha_verificacion: new Date(),
        fecha_real_cierre: esEfectiva ? new Date() : undefined,
        estado_id: estadoAccion!.id,
        resultado_real: dto.resultado_obtenido,
      },
    });

    // Si todas las acciones de la NC están cerradas → cerrar NC
    const nc = accion.no_conformidades as any;
    const todasCerradas = nc.acciones_capa.every(
      (a: any) => a.id === accionId
        ? esEfectiva
        : ['CERRADA', 'CERRADA_INEF'].includes(a.estados_flujo?.codigo || ''),
    );

    if (todasCerradas && esEfectiva) {
      await this.cambiarEstadoNC(nc.id, 'CERRADA', verificadoPor);
    }

    return accionActualizada;
  }

  async obtenerAlertasVencimiento() {
    const hoy = new Date();
    const en15Dias = new Date();
    en15Dias.setDate(en15Dias.getDate() + 15);

    return this.prisma.acciones_capa.findMany({
      where: {
        fecha_real_cierre: null,
        fecha_compromiso: { lte: en15Dias },
        estados_flujo: { codigo: { notIn: ['CERRADA', 'CERRADA_INEF'] } },
      },
      include: {
        no_conformidades: { select: { codigo: true } },
        areas: { select: { nombre: true } },
        usuarios_acciones_capa_responsable_idTousuarios: {
          select: { nombres: true, apellidos: true, email: true },
        },
        estados_flujo: { select: { codigo: true, nombre: true } },
      },
      orderBy: { fecha_compromiso: 'asc' },
    });
  }

  /** Tarea programada: Revisa vencimientos cada día a las 7 AM */
  @Cron('0 7 * * *', { name: 'alerta-vencimientos-capa', timeZone: 'America/Lima' })
  async verificarVencimientosDiario() {
    this.logger.log('⏰ Verificando vencimientos CAPA...');
    const alertas = await this.obtenerAlertasVencimiento();

    for (const accion of alertas) {
      const vencida = estaVencido(accion.fecha_compromiso);
      const proximaAVencer = estaProximoAVencer(accion.fecha_compromiso);

      const responsable = (accion as any)
        .usuarios_acciones_capa_responsable_idTousuarios;

      if (vencida || proximaAVencer) {
        this.eventEmitter.emit('capa.alerta-vencimiento', {
          accionId: accion.id,
          ncCodigo: (accion as any).no_conformidades?.codigo,
          responsableId: accion.responsable_id,
          responsableEmail: responsable?.email,
          fechaCompromiso: accion.fecha_compromiso,
          vencida,
        });
      }
    }

    this.logger.log(`✅ Alertas CAPA procesadas: ${alertas.length} acciones próximas o vencidas.`);
  }

  async estadisticas() {
    const [porEstado, porOrigen, porArea] = await Promise.all([
      this.prisma.no_conformidades.groupBy({
        by: ['estado_id'],
        _count: { id: true },
      }),
      this.prisma.no_conformidades.groupBy({
        by: ['origen'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      this.prisma.acciones_capa.groupBy({
        by: ['area_id'],
        _count: { id: true },
        where: { fecha_real_cierre: null },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
    ]);

    const accionesVencidas = await this.prisma.acciones_capa.count({
      where: {
        fecha_real_cierre: null,
        fecha_compromiso: { lt: new Date() },
      },
    });

    return { porEstado, porOrigen, porArea, accionesVencidas };
  }
}
