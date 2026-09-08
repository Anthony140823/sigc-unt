// src/modules/procesos/procesos.service.ts
// ================================================================
import {
  Injectable, NotFoundException, ConflictException, Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CrearMacroProcesoDto } from './dto/crear-macroproceso.dto';
import { CrearProcesoDto } from './dto/crear-proceso.dto';
import { CrearSubprocesoDto } from './dto/crear-subproceso.dto';
import { ActualizarProcesoDto } from './dto/actualizar-proceso.dto';
import { ActualizarMatrizRaciDto } from './dto/actualizar-matriz-raci.dto';
import { construirPaginacion, construirRespuestaPaginada } from '../../common/utils/paginacion.util';

@Injectable()
export class ProcesosService {
  private readonly logger = new Logger(ProcesosService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Macroprocesos ────────────────────────────────────

  async crearMacroproceso(dto: CrearMacroProcesoDto) {
    const existe = await this.prisma.macroprocesos.findFirst({
      where: { codigo: dto.codigo },
    });
    if (existe) throw new ConflictException(`Ya existe macroproceso con código ${dto.codigo}.`);

    return this.prisma.macroprocesos.create({ data: dto });
  }

  async findAllMacroprocesos() {
    return this.prisma.macroprocesos.findMany({
      where: { esta_activo: true },
      include: {
        _count: { select: { procesos: true } },
      },
      orderBy: [{ tipo: 'asc' }, { orden: 'asc' }],
    });
  }

  // ─── Mapa de procesos jerárquico ──────────────────────

  async mapaProcesosCompleto() {
    return this.prisma.macroprocesos.findMany({
      where: { esta_activo: true },
      include: {
        procesos: {
          where: { esta_activo: true },
          include: {
            areas: { select: { nombre: true, codigo: true } },
            estados_flujo: { select: { codigo: true, color_hex: true } },
            subprocesos: {
              where: { esta_activo: true },
              select: { id: true, codigo: true, nombre: true, descripcion: true },
              orderBy: { orden: 'asc' },
            },
            _count: { select: { documentos: true, indicadores: true, subprocesos: true } },
          },
          orderBy: { orden: 'asc' },
        },
      },
      orderBy: [{ tipo: 'asc' }, { orden: 'asc' }],
    });
  }

  // ─── Procesos ─────────────────────────────────────────

  async crear(dto: CrearProcesoDto, creadoPor: string) {
    const existe = await this.prisma.procesos.findFirst({ where: { codigo: dto.codigo } });
    if (existe) throw new ConflictException(`Código de proceso ${dto.codigo} ya en uso.`);

    const estadoVigente = await this.prisma.estados_flujo.findFirst({
      where: { modulo: 'MP', codigo: 'BORRADOR' },
    });

    return this.prisma.procesos.create({
      data: {
        macroproceso_id: dto.macroproceso_id,
        codigo: dto.codigo,
        nombre: dto.nombre,
        objetivo: dto.objetivo,
        alcance: dto.alcance,
        entradas: dto.entradas || [],
        salidas: dto.salidas || [],
        area_responsable_id: dto.area_responsable_id,
        estado_id: estadoVigente!.id,
        diagrama_bpmn_url: dto.diagrama_bpmn_url,
        diagrama_bpmn_json: dto.diagrama_bpmn_json,
        creado_por: creadoPor,
      },
      include: {
        macroprocesos: { select: { nombre: true, tipo: true } },
        areas: { select: { nombre: true } },
        estados_flujo: true,
      },
    });
  }

  async findAll(macroProcesoId?: string, tipo?: string) {
    const where: any = { esta_activo: true };
    if (macroProcesoId) where.macroproceso_id = macroProcesoId;
    if (tipo) where.macroprocesos = { tipo };

    return this.prisma.procesos.findMany({
      where,
      include: {
        macroprocesos: { select: { codigo: true, nombre: true, tipo: true } },
        areas: { select: { nombre: true, codigo: true } },
        estados_flujo: { select: { codigo: true, nombre: true, color_hex: true } },
        _count: {
          select: {
            subprocesos: true,
            documentos: true,
            indicadores: true,
            hallazgos: true,
          },
        },
      },
      orderBy: { orden: 'asc' },
    });
  }

  async findOne(id: string) {
    const proceso = await this.prisma.procesos.findUnique({
      where: { id },
      include: {
        macroprocesos: true,
        areas: true,
        estados_flujo: true,
        subprocesos: {
          where: { esta_activo: true },
          include: {
            usuarios: { select: { nombres: true, apellidos: true } },
          },
          orderBy: { orden: 'asc' },
        },
        documentos: {
          where: { esta_activo: true },
          include: {
            tipos_documento: { select: { codigo: true, nombre: true } },
            estados_flujo: { select: { codigo: true, nombre: true } },
          },
          take: 10,
        },
        indicadores: {
          where: { esta_activo: true },
          select: { codigo: true, nombre: true, meta_valor: true, unidad_medida: true },
          take: 10,
        },
        matriz_raci: {
          include: {
            areas: { select: { nombre: true } },
            usuarios: { select: { nombres: true, apellidos: true } },
          },
        },
      },
    });
    if (!proceso) throw new NotFoundException(`Proceso ${id} no encontrado.`);
    return proceso;
  }

  async actualizar(id: string, dto: ActualizarProcesoDto, modificadoPor: string) {
    await this.findOne(id);
    return this.prisma.procesos.update({
      where: { id },
      data: { ...dto, modificado_por: modificadoPor },
    });
  }

  // ─── Subprocesos ──────────────────────────────────────

  async crearSubproceso(procesoId: string, dto: CrearSubprocesoDto) {
    await this.findOne(procesoId);
    const existe = await this.prisma.subprocesos.findFirst({ where: { codigo: dto.codigo } });
    if (existe) throw new ConflictException(`Código ${dto.codigo} ya en uso.`);

    const maxOrden = await this.prisma.subprocesos.aggregate({
      where: { proceso_id: procesoId },
      _max: { orden: true },
    });

    return this.prisma.subprocesos.create({
      data: {
        proceso_id: procesoId,
        codigo: dto.codigo,
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        responsable_id: dto.responsable_id,
        orden: (maxOrden._max.orden || 0) + 1,
      },
    });
  }

  // ─── Matriz RACI ──────────────────────────────────────

  async actualizarMatrizRaci(procesoId: string, items: ActualizarMatrizRaciDto[], usuarioId: string) {
    await this.findOne(procesoId);

    // Eliminar RACI anterior del proceso
    await this.prisma.matriz_raci.deleteMany({ where: { proceso_id: procesoId } });

    // Insertar nuevo RACI
    const creados = await Promise.all(
      items.map((item) =>
        this.prisma.matriz_raci.create({
          data: {
            proceso_id: procesoId,
            subproceso_id: item.subproceso_id,
            area_id: item.area_id,
            usuario_id: item.usuario_id,
            rol_raci: item.rol_raci,
            descripcion: item.descripcion,
          },
        }),
      ),
    );

    return { actualizados: creados.length };
  }

  async cambiarEstado(id: string, nuevoCodigo: string, usuarioId: string) {
    const estado = await this.prisma.estados_flujo.findFirst({
      where: { modulo: 'MP', codigo: nuevoCodigo },
    });
    if (!estado) throw new NotFoundException(`Estado MP '${nuevoCodigo}' no encontrado.`);
    return this.prisma.procesos.update({ where: { id }, data: { estado_id: estado.id } });
  }
}

// ================================================================
