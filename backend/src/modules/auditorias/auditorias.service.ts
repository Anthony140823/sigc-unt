// src/modules/auditorias/auditorias.service.ts
import {
  Injectable, NotFoundException, ConflictException,
  BadRequestException, ForbiddenException, Logger,
} from '@nestjs/common';
import { CrearChecklistDto, ActualizarChecklistDto, CrearItemChecklistDto, ActualizarItemChecklistDto } from './dto/checklist.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../database/prisma.service';
import { CrearPlanAuditoriaDto } from './dto/crear-plan-auditoria.dto';
import { CrearAuditoriaDto } from './dto/crear-auditoria.dto';
import { FiltrarAuditoriasDto } from './dto/filtrar-auditorias.dto';
import { AsignarAuditorDto } from './dto/asignar-auditor.dto';
import { ResponderChecklistDto } from './dto/responder-checklist.dto';
import { CrearHallazgoDto } from './dto/crear-hallazgo.dto';
import { CerrarHallazgoDto } from './dto/cerrar-hallazgo.dto';
import { construirPaginacion, construirRespuestaPaginada } from '../../common/utils/paginacion.util';
import { generarCodigo } from '../../common/utils/paginacion.util';

@Injectable()
export class AuditoriasService {
  private readonly logger = new Logger(AuditoriasService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ═══════════════════════════════════════════════════════
  // PLANES DE AUDITORÍA
  // ═══════════════════════════════════════════════════════

  async crearPlan(dto: CrearPlanAuditoriaDto, creadoPor: string) {
    const estadoInicial = await this.prisma.estados_flujo.findFirst({
      where: { modulo: 'AI', codigo: 'PROGRAMADA' },
    });

    return this.prisma.planes_auditoria.create({
      data: {
        anio: dto.anio,
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        area_responsable_id: dto.area_responsable_id,
        estado_id: estadoInicial!.id,
        creado_por: creadoPor,
      },
      include: {
        areas: { select: { nombre: true } },
        estados_flujo: true,
      },
    });
  }

  async findAllPlanes(anio?: number) {
    const where: any = {};
    if (anio) where.anio = anio;

    return this.prisma.planes_auditoria.findMany({
      where,
      include: {
        areas: { select: { nombre: true } },
        estados_flujo: true,
        _count: { select: { auditorias: true } },
      },
      orderBy: [{ anio: 'desc' }, { nombre: 'asc' }],
    });
  }

  async aprobarPlan(planId: string, aprobadoPor: string) {
    const estado = await this.prisma.estados_flujo.findFirst({
      where: { modulo: 'AI', codigo: 'INFORME_EMITIDO' },
    });

    return this.prisma.planes_auditoria.update({
      where: { id: planId },
      data: {
        estado_id: estado!.id,
        aprobado_por: aprobadoPor,
        fecha_aprobacion: new Date(),
      },
    });
  }

  // ═══════════════════════════════════════════════════════
  // AUDITORÍAS
  // ═══════════════════════════════════════════════════════

  async crear(dto: CrearAuditoriaDto, creadoPor: string) {
    // Verificar código único
    const existe = await this.prisma.auditorias.findFirst({
      where: { codigo: dto.codigo },
    });
    if (existe) throw new ConflictException(`Ya existe una auditoría con código ${dto.codigo}.`);

    const estadoInicial = await this.prisma.estados_flujo.findFirst({
      where: { modulo: 'AI', codigo: 'PROGRAMADA' },
    });

    const auditoria = await this.prisma.auditorias.create({
      data: {
        plan_id: dto.plan_id,
        tipo_id: dto.tipo_id,
        codigo: dto.codigo,
        nombre: dto.nombre,
        objetivo: dto.objetivo,
        alcance: dto.alcance,
        area_auditada_id: dto.area_auditada_id,
        proceso_auditado_id: dto.proceso_auditado_id,
        fecha_programada_inicio: new Date(dto.fecha_programada_inicio),
        fecha_programada_fin: new Date(dto.fecha_programada_fin),
        estado_id: estadoInicial!.id,
        creado_por: creadoPor,
      },
      include: {
        tipos_auditoria: true,
        areas: { select: { nombre: true } },
        estados_flujo: true,
      },
    });

    this.logger.log(`Auditoría creada: ${auditoria.codigo}`);
    return auditoria;
  }

  async findAll(filtros: FiltrarAuditoriasDto) {
    const { pagina, limite, skip, order, sortBy } = construirPaginacion(filtros);
    const where: any = {};

    if (filtros.plan_id) where.plan_id = filtros.plan_id;
    if (filtros.tipo_id) where.tipo_id = filtros.tipo_id;
    if (filtros.area_id) where.area_auditada_id = filtros.area_id;
    if (filtros.estado_codigo) where.estados_flujo = { codigo: filtros.estado_codigo };
    if (filtros.anio) {
      where.fecha_programada_inicio = {
        gte: new Date(`${filtros.anio}-01-01`),
        lte: new Date(`${filtros.anio}-12-31`),
      };
    }

    const [datos, total] = await Promise.all([
      this.prisma.auditorias.findMany({
        where,
        include: {
          planes_auditoria: { select: { nombre: true, anio: true } },
          tipos_auditoria: { select: { nombre: true } },
          areas: { select: { nombre: true } },
          estados_flujo: { select: { codigo: true, nombre: true, color_hex: true } },
          _count: { select: { hallazgos: true, auditores_asignados: true } },
        },
        skip, take: limite,
        orderBy: { [sortBy]: order },
      }),
      this.prisma.auditorias.count({ where }),
    ]);

    return construirRespuestaPaginada(datos, total, pagina, limite);
  }

  async listarTodos() {
    return this.prisma.auditorias.findMany({
      include: {
        planes_auditoria: { select: { nombre: true, anio: true } },
        tipos_auditoria: { select: { nombre: true } },
        areas: { select: { nombre: true } },
        estados_flujo: { select: { codigo: true, nombre: true, color_hex: true } },
      },
      orderBy: { creado_en: 'desc' },
    });
  }

  async findOne(id: string) {
    const auditoria = await this.prisma.auditorias.findUnique({
      where: { id },
      include: {
        planes_auditoria: true,
        tipos_auditoria: true,
        areas: true,
        procesos: { select: { nombre: true, codigo: true } },
        estados_flujo: true,
        auditores_asignados: {
          include: {
            usuarios: { select: { nombres: true, apellidos: true, email: true, cargo: true } },
          },
        },
        hallazgos: {
          include: {
            tipos_hallazgo: true,
            estados_flujo: { select: { codigo: true, nombre: true, color_hex: true } },
          },
          orderBy: { fecha_deteccion: 'desc' },
        },
      },
    });

    if (!auditoria) throw new NotFoundException(`Auditoría con ID ${id} no encontrada.`);
    return auditoria;
  }

  async cambiarEstado(id: string, nuevoCodigo: string, usuarioId: string) {
    await this.findOne(id);

    const nuevoEstado = await this.prisma.estados_flujo.findFirst({
      where: { modulo: 'AI', codigo: nuevoCodigo },
    });
    if (!nuevoEstado) throw new NotFoundException(`Estado '${nuevoCodigo}' no válido para auditorías.`);

    const data: any = { estado_id: nuevoEstado.id };

    if (nuevoCodigo === 'EN_EJECUCION') data.fecha_real_inicio = new Date();
    if (nuevoCodigo === 'FINALIZADA' || nuevoCodigo === 'INFORME_EMITIDO') {
      data.fecha_real_fin = new Date();
    }

    return this.prisma.auditorias.update({ where: { id }, data, include: { estados_flujo: true } });
  }

  // ═══════════════════════════════════════════════════════
  // EQUIPO AUDITOR
  // ═══════════════════════════════════════════════════════

  async asignarAuditor(auditoriaId: string, dto: AsignarAuditorDto) {
    await this.findOne(auditoriaId);

    const existente = await this.prisma.auditores_asignados.findFirst({
      where: { auditoria_id: auditoriaId, usuario_id: dto.usuario_id },
    });
    if (existente) throw new ConflictException('El auditor ya está asignado a esta auditoría.');

    return this.prisma.auditores_asignados.create({
      data: {
        auditoria_id: auditoriaId,
        usuario_id: dto.usuario_id,
        rol_auditoria: dto.rol_auditoria,
      },
      include: {
        usuarios: { select: { nombres: true, apellidos: true, cargo: true } },
      },
    });
  }

  async removerAuditor(auditoriaId: string, asignacionId: number) {
    const asig = await this.prisma.auditores_asignados.findFirst({
      where: { id: asignacionId, auditoria_id: auditoriaId },
    });
    if (!asig) throw new NotFoundException('Asignación no encontrada.');

    await this.prisma.auditores_asignados.delete({ where: { id: asignacionId } });
    return { mensaje: 'Auditor removido del equipo.' };
  }

  // ═══════════════════════════════════════════════════════
  // CHECKLISTS
  // ═══════════════════════════════════════════════════════

  async responderChecklist(auditoriaId: string, respuestas: ResponderChecklistDto, usuarioId: string) {
    await this.findOne(auditoriaId);

    // Upsert de cada respuesta
    const resultados = await Promise.all(
      respuestas.items.map((item) =>
        this.prisma.respuestas_checklist.upsert({
          where: {
            auditoria_id_item_id: {
              auditoria_id: auditoriaId,
              item_id: item.item_id,
            },
          },
          create: {
            auditoria_id: auditoriaId,
            item_id: item.item_id,
            respuesta: item.respuesta,
            observacion: item.observacion,
            genera_hallazgo: item.genera_hallazgo || false,
            respondido_por: usuarioId,
          },
          update: {
            respuesta: item.respuesta,
            observacion: item.observacion,
            genera_hallazgo: item.genera_hallazgo || false,
            respondido_por: usuarioId,
          },
        }),
      ),
    );

    return { guardados: resultados.length, mensaje: 'Checklist guardado correctamente.' };
  }

  async obtenerRespuestasChecklist(auditoriaId: string) {
    const auditoria = await this.prisma.auditorias.findUnique({
      where: { id: auditoriaId },
      select: { tipo_id: true },
    });
    if (!auditoria) return [];

    const checklist = await this.prisma.checklists.findFirst({
      where: { tipo_auditoria_id: auditoria.tipo_id, esta_activo: true },
      select: { id: true },
    });
    if (!checklist) return [];

    const items = await this.prisma.items_checklist.findMany({
      where: { checklist_id: checklist.id },
      orderBy: { orden: 'asc' },
    });

    const respuestas = await this.prisma.respuestas_checklist.findMany({
      where: { auditoria_id: auditoriaId },
    });

    const respMap = new Map(respuestas.map(r => [r.item_id, r]));

    return items.map(item => ({
      ...item,
      respuestas_checklist: respMap.has(item.id) ? [respMap.get(item.id)] : [],
    }));
  }

  // ═══════════════════════════════════════════════════════
  // PLANTILLAS CHECKLIST (MANTENEDOR)
  // ═══════════════════════════════════════════════════════

  async listarTodosChecklists() {
    return this.prisma.checklists.findMany({
      include: {
        tipos_auditoria: { select: { nombre: true } },
        _count: { select: { items_checklist: true } },
      },
      orderBy: { nombre: 'asc' },
    });
  }

  async listarChecklists() {
    return this.prisma.checklists.findMany({
      include: {
        tipos_auditoria: { select: { nombre: true } },
        _count: { select: { items_checklist: true } },
      },
      orderBy: { nombre: 'asc' },
    });
  }

  async obtenerChecklist(id: string) {
    const cl = await this.prisma.checklists.findUnique({
      where: { id },
      include: {
        tipos_auditoria: { select: { nombre: true } },
        items_checklist: { orderBy: { orden: 'asc' } },
      },
    });
    if (!cl) throw new NotFoundException('Checklist no encontrado.');
    return cl;
  }

  async crearChecklist(dto: CrearChecklistDto, creadoPor: string) {
    return this.prisma.checklists.create({
      data: {
        tipo_auditoria_id: dto.tipo_auditoria_id,
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        version: dto.version || '1.0',
        creado_por: creadoPor,
      },
      include: {
        tipos_auditoria: { select: { nombre: true } },
      },
    });
  }

  async actualizarChecklist(id: string, dto: ActualizarChecklistDto) {
    await this.obtenerChecklist(id);
    return this.prisma.checklists.update({
      where: { id },
      data: {
        tipo_auditoria_id: dto.tipo_auditoria_id,
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        version: dto.version,
        esta_activo: dto.esta_activo,
      },
      include: {
        tipos_auditoria: { select: { nombre: true } },
      },
    });
  }

  async eliminarChecklist(id: string) {
    await this.obtenerChecklist(id);
    await this.prisma.checklists.delete({ where: { id } });
    return { mensaje: 'Checklist eliminado correctamente.' };
  }

  async agregarItem(checklistId: string, dto: CrearItemChecklistDto) {
    await this.obtenerChecklist(checklistId);

    const maxOrden = await this.prisma.items_checklist.aggregate({
      where: { checklist_id: checklistId },
      _max: { orden: true },
    });

    return this.prisma.items_checklist.create({
      data: {
        checklist_id: checklistId,
        criterio_referencia: dto.criterio_referencia,
        pregunta: dto.pregunta,
        descripcion_ayuda: dto.descripcion_ayuda,
        tipo_respuesta: dto.tipo_respuesta || 'SI_NO',
        obligatorio: dto.obligatorio ?? true,
        orden: dto.orden ?? (maxOrden._max.orden ?? 0) + 1,
      },
    });
  }

  async actualizarItem(itemId: string, dto: ActualizarItemChecklistDto) {
    const item = await this.prisma.items_checklist.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Item de checklist no encontrado.');

    return this.prisma.items_checklist.update({
      where: { id: itemId },
      data: {
        criterio_referencia: dto.criterio_referencia,
        pregunta: dto.pregunta,
        descripcion_ayuda: dto.descripcion_ayuda,
        tipo_respuesta: dto.tipo_respuesta,
        obligatorio: dto.obligatorio,
        orden: dto.orden,
      },
    });
  }

  async eliminarItem(itemId: string) {
    const item = await this.prisma.items_checklist.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Item de checklist no encontrado.');
    await this.prisma.items_checklist.delete({ where: { id: itemId } });
    return { mensaje: 'Item eliminado correctamente.' };
  }

  // ═══════════════════════════════════════════════════════
  // HALLAZGOS
  // ═══════════════════════════════════════════════════════

  async crearHallazgo(auditoriaId: string, dto: CrearHallazgoDto, creadoPor: string) {
    await this.findOne(auditoriaId);

    // Generar código de hallazgo: HALL-2025-0001
    const conteo = await this.prisma.hallazgos.count({
      where: { auditoria_id: auditoriaId },
    });
    const codigo = `H${String(conteo + 1).padStart(3, '0')}`;

    const estadoAbierto = await this.prisma.estados_flujo.findFirst({
      where: { modulo: 'HALL', codigo: 'ABIERTO' },
    });

    const hallazgo = await this.prisma.hallazgos.create({
      data: {
        auditoria_id: auditoriaId,
        tipo_id: dto.tipo_id,
        codigo,
        descripcion: dto.descripcion,
        requisito_incumplido: dto.requisito_incumplido,
        proceso_id: dto.proceso_id,
        area_id: dto.area_id,
        estado_id: estadoAbierto!.id,
        fecha_deteccion: new Date(),
        fecha_limite_cierre: dto.fecha_limite_cierre
          ? new Date(dto.fecha_limite_cierre) : undefined,
      },
      include: {
        tipos_hallazgo: true,
        estados_flujo: true,
        areas: { select: { nombre: true } },
      },
    });

    // Notificar al área auditada
    this.eventEmitter.emit('auditoria.hallazgo-creado', {
      hallazgoId: hallazgo.id,
      auditoriaId,
      tipoSeveridad: (hallazgo as any).tipos_hallazgo?.severidad,
      areaId: dto.area_id,
    });

    return hallazgo;
  }

  async findAllHallazgos(filtros: Partial<FiltrarAuditoriasDto & { abiertos?: boolean }>) {
    const where: any = {};
    if (filtros.area_id) where.area_id = filtros.area_id;
    if (filtros.abiertos) where.fecha_cierre_real = null;

    return this.prisma.hallazgos.findMany({
      where,
      include: {
        auditorias: { select: { codigo: true, nombre: true } },
        tipos_hallazgo: true,
        estados_flujo: { select: { codigo: true, nombre: true, color_hex: true } },
        areas: { select: { nombre: true } },
      },
      orderBy: [
        { tipos_hallazgo: { severidad: 'desc' } },
        { fecha_deteccion: 'desc' },
      ],
    });
  }

  async cerrarHallazgo(hallazgoId: string, dto: CerrarHallazgoDto, cerradoPor: string) {
    const hallazgo = await this.prisma.hallazgos.findUnique({ where: { id: hallazgoId } });
    if (!hallazgo) throw new NotFoundException('Hallazgo no encontrado.');

    const estadoCerrado = await this.prisma.estados_flujo.findFirst({
      where: {
        modulo: 'HALL',
        codigo: dto.con_observacion ? 'CERRADO_OBS' : 'CERRADO',
      },
    });

    return this.prisma.hallazgos.update({
      where: { id: hallazgoId },
      data: {
        estado_id: estadoCerrado!.id,
        fecha_cierre_real: new Date(),
        cerrado_por: cerradoPor,
        observacion_cierre: dto.observacion_cierre,
      },
      include: { estados_flujo: true },
    });
  }

  async resumenPorTipo(auditoriaId: string) {
    return this.prisma.hallazgos.groupBy({
      by: ['tipo_id'],
      where: { auditoria_id: auditoriaId },
      _count: { id: true },
    });
  }
}
