// src/modules/indicadores/indicadores.service.ts
// ================================================================
import {
  Injectable, NotFoundException, ConflictException,
  BadRequestException, Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../database/prisma.service';
import { CrearIndicadorDto } from './dto/crear-indicador.dto';
import { ActualizarIndicadorDto } from './dto/actualizar-indicador.dto';
import { FiltrarIndicadoresDto } from './dto/filtrar-indicadores.dto';
import { RegistrarMedicionDto } from './dto/registrar-medicion.dto';
import { construirPaginacion, construirRespuestaPaginada } from '../../common/utils/paginacion.util';
import { calcularSemaforo } from '../../common/utils/paginacion.util';

@Injectable()
export class IndicadoresService {
  private readonly logger = new Logger(IndicadoresService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async crear(dto: CrearIndicadorDto, creadoPor: string) {
    const existe = await this.prisma.indicadores.findFirst({
      where: { codigo: dto.codigo },
    });
    if (existe) throw new ConflictException(`Ya existe un indicador con código ${dto.codigo}.`);

    const indicador = await this.prisma.indicadores.create({
      data: {
        codigo: dto.codigo,
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        formula: dto.formula,
        unidad_medida: dto.unidad_medida,
        tipo_tendencia: dto.tipo_tendencia,
        meta_valor: dto.meta_valor,
        meta_descripcion: dto.meta_descripcion,
        frecuencia_id: dto.frecuencia_id,
        proceso_id: dto.proceso_id,
        area_responsable_id: dto.area_responsable_id,
        responsable_id: dto.responsable_id,
        objetivo_estrategico_id: dto.objetivo_estrategico_id,
        fuente_datos: dto.fuente_datos,
        creado_por: creadoPor,
      },
      include: {
        areas: { select: { id: true, nombre: true } },
        frecuencias_medicion: true,
        objetivos_estrategicos: { select: { codigo: true, nombre: true } },
      },
    });

    return indicador;
  }

  async findAll(filtros: FiltrarIndicadoresDto) {
    const { pagina, limite, skip, order, sortBy } = construirPaginacion(filtros);
    const where: any = { esta_activo: true };

    if (filtros.area_id) where.area_responsable_id = filtros.area_id;
    if (filtros.proceso_id) where.proceso_id = filtros.proceso_id;
    if (filtros.objetivo_id) where.objetivo_estrategico_id = filtros.objetivo_id;
    if (filtros.frecuencia_id) where.frecuencia_id = filtros.frecuencia_id;
    if (filtros.busqueda) {
      where.OR = [
        { nombre: { contains: filtros.busqueda, mode: 'insensitive' } },
        { codigo: { contains: filtros.busqueda, mode: 'insensitive' } },
      ];
    }

    const [datos, total] = await Promise.all([
      this.prisma.indicadores.findMany({
        where,
        include: {
          areas: { select: { id: true, nombre: true } },
          frecuencias_medicion: { select: { codigo: true, nombre: true } },
          procesos: { select: { id: true, nombre: true } },
          objetivos_estrategicos: { select: { codigo: true, nombre: true } },
          usuarios_indicadores_responsable_idTousuarios: {
            select: { nombres: true, apellidos: true },
          },
          mediciones_indicador: {
            orderBy: { fecha_registro: 'desc' },
            take: 1, // Última medición para semáforo
          },
        },
        skip,
        take: limite,
        orderBy: { [sortBy]: order },
      }),
      this.prisma.indicadores.count({ where }),
    ]);

    return construirRespuestaPaginada(datos, total, pagina, limite);
  }

  async listarTodos() {
    return this.prisma.indicadores.findMany({
      where: { esta_activo: true },
      include: {
        areas: { select: { id: true, nombre: true } },
        frecuencias_medicion: { select: { codigo: true, nombre: true } },
        procesos: { select: { id: true, nombre: true } },
        objetivos_estrategicos: { select: { codigo: true, nombre: true } },
      },
      orderBy: { creado_en: 'desc' },
    });
  }

  async findOne(id: string) {
    const ind = await this.prisma.indicadores.findUnique({
      where: { id },
      include: {
        areas: true,
        frecuencias_medicion: true,
        procesos: { select: { id: true, nombre: true, codigo: true } },
        objetivos_estrategicos: true,
        usuarios_indicadores_responsable_idTousuarios: {
          select: { id: true, nombres: true, apellidos: true, email: true },
        },
        mediciones_indicador: {
          include: {
            usuarios_mediciones_indicador_registrado_porTousuarios: {
              select: { nombres: true, apellidos: true },
            },
          },
          orderBy: { fecha_registro: 'desc' },
          take: 12, // Últimas 12 mediciones para gráfico
        },
      },
    });

    if (!ind) throw new NotFoundException(`Indicador con ID ${id} no encontrado.`);
    return ind;
  }

  async actualizar(id: string, dto: ActualizarIndicadorDto, modificadoPor: string) {
    await this.findOne(id);
    return this.prisma.indicadores.update({
      where: { id },
      data: { ...dto, modificado_por: modificadoPor },
    });
  }

  async registrarMedicion(indicadorId: string, dto: RegistrarMedicionDto, registradoPor: string) {
    const indicador = await this.findOne(indicadorId) as any;

    // Calcular semáforo automáticamente
    const semaforo = calcularSemaforo(
      dto.valor_real,
      indicador.meta_valor || dto.valor_meta || 0,
      indicador.tipo_tendencia,
    );

    const medicion = await this.prisma.mediciones_indicador.create({
      data: {
        indicador_id: indicadorId,
        periodo_inicio: new Date(dto.periodo_inicio),
        periodo_fin: new Date(dto.periodo_fin),
        valor_real: dto.valor_real,
        valor_meta: dto.valor_meta || indicador.meta_valor,
        estado_semaforo: semaforo,
        observaciones: dto.observaciones,
        evidencia_url: dto.evidencia_url,
        registrado_por: registradoPor,
      },
    });

    // Emitir alerta si semáforo es ROJO
    if (semaforo === 'ROJO') {
      this.eventEmitter.emit('indicador.alerta-roja', {
        indicadorId,
        indicadorNombre: indicador.nombre,
        valorReal: dto.valor_real,
        valorMeta: indicador.meta_valor,
        responsableId: indicador.responsable_id,
      });
    }

    this.logger.log(
      `Medición registrada: ${indicador.codigo} = ${dto.valor_real} [${semaforo}]`,
    );

    return medicion;
  }

  async validarMedicion(medicionId: number, validadoPor: string) {
    const medicion = await this.prisma.mediciones_indicador.findUnique({
      where: { id: medicionId },
    });
    if (!medicion) throw new NotFoundException('Medición no encontrada.');

    return this.prisma.mediciones_indicador.update({
      where: { id: medicionId },
      data: { validado_por: validadoPor, fecha_validacion: new Date() },
    });
  }

  async obtenerHistorial(indicadorId: string, meses = 12) {
    await this.findOne(indicadorId);
    const desde = new Date();
    desde.setMonth(desde.getMonth() - meses);

    return this.prisma.mediciones_indicador.findMany({
      where: {
        indicador_id: indicadorId,
        fecha_registro: { gte: desde },
      },
      orderBy: { periodo_fin: 'asc' },
    });
  }

  async resumenSemaforos() {
    const resumen = await this.prisma.mediciones_indicador.groupBy({
      by: ['estado_semaforo'],
      _count: { id: true },
      where: {
        fecha_registro: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30)),
        },
      },
    });

    return resumen.reduce((acc: any, r: any) => {
      acc[r.estado_semaforo.toLowerCase()] = r._count.id;
      return acc;
    }, { verde: 0, amarillo: 0, rojo: 0 });
  }
}
