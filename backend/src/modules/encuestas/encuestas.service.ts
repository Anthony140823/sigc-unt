// src/modules/encuestas/encuestas.service.ts
// ================================================================
import {
  Injectable, NotFoundException, ConflictException,
  ForbiddenException, BadRequestException, Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../database/prisma.service';
import { CrearEncuestaDto } from './dto/crear-encuesta.dto';
import { CrearSeccionDto } from './dto/crear-seccion.dto';
import { CrearPreguntaDto } from './dto/crear-pregunta.dto';
import { ResponderEncuestaDto } from './dto/responder-encuesta.dto';
import { FiltrarEncuestasDto } from './dto/filtrar-encuestas.dto';
import { construirPaginacion, construirRespuestaPaginada } from '../../common/utils/paginacion.util';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class EncuestasService {
  private readonly logger = new Logger(EncuestasService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async crear(dto: CrearEncuestaDto, creadoPor: string) {
    const estadoDiseno = await this.prisma.estados_flujo.findFirst({
      where: { modulo: 'GS', codigo: 'DISENO' },
    });

    const codigo = `ENC-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    return this.prisma.encuestas.create({
      data: {
        codigo,
        titulo: dto.titulo,
        descripcion: dto.descripcion,
        poblacion_objetivo: dto.poblacion_objetivo,
        programa_id: dto.programa_id,
        area_id: dto.area_id,
        ciclo_academico: dto.ciclo_academico,
        fecha_inicio: dto.fecha_inicio ? new Date(dto.fecha_inicio) : undefined,
        fecha_fin: dto.fecha_fin ? new Date(dto.fecha_fin) : undefined,
        es_anonima: dto.es_anonima ?? true,
        estado_id: estadoDiseno!.id,
        creado_por: creadoPor,
      },
    });
  }

  async findAll(filtros: FiltrarEncuestasDto) {
    const { pagina, limite, skip, order, sortBy } = construirPaginacion(filtros);
    const where: any = {};

    if (filtros.poblacion) where.poblacion_objetivo = filtros.poblacion;
    if (filtros.programa_id) where.programa_id = filtros.programa_id;
    if (filtros.estado_codigo) where.estados_flujo = { codigo: filtros.estado_codigo };

    const [datos, total] = await Promise.all([
      this.prisma.encuestas.findMany({
        where,
        include: {
          estados_flujo: { select: { codigo: true, nombre: true, color_hex: true } },
          programas_academicos: { select: { nombre: true } },
          _count: { select: { secciones_encuesta: true, participaciones_encuesta: true } },
        },
        skip, take: limite,
        orderBy: { [sortBy]: order },
      }),
      this.prisma.encuestas.count({ where }),
    ]);

    return construirRespuestaPaginada(datos, total, pagina, limite);
  }

  async listarTodos() {
    return this.prisma.encuestas.findMany({
      include: {
        estados_flujo: { select: { codigo: true, nombre: true, color_hex: true } },
        programas_academicos: { select: { nombre: true } },
      },
      orderBy: { creado_en: 'desc' },
    });
  }

  async findOne(id: string) {
    const encuesta = await this.prisma.encuestas.findUnique({
      where: { id },
      include: {
        estados_flujo: true,
        secciones_encuesta: {
          include: {
            preguntas_encuesta: {
              include: {
                tipos_pregunta: true,
                opciones_pregunta: { orderBy: { orden: 'asc' } },
              },
              orderBy: { orden: 'asc' },
            },
          },
          orderBy: { orden: 'asc' },
        },
        _count: {
          select: { participaciones_encuesta: true },
        },
      },
    });

    if (!encuesta) throw new NotFoundException(`Encuesta ${id} no encontrada.`);
    return encuesta;
  }

  async publicar(id: string, usuarioId: string) {
    const encuesta = await this.findOne(id) as any;

    if (encuesta.estados_flujo.codigo !== 'DISENO') {
      throw new ForbiddenException('Solo se puede publicar una encuesta en estado Diseño.');
    }

    const seccionesConPreguntas = encuesta.secciones_encuesta?.filter(
      (s: any) => s.preguntas_encuesta?.length > 0,
    );
    if (!seccionesConPreguntas?.length) {
      throw new BadRequestException('La encuesta debe tener al menos una sección con preguntas.');
    }

    const estadoActiva = await this.prisma.estados_flujo.findFirst({
      where: { modulo: 'GS', codigo: 'ACTIVA' },
    });

    return this.prisma.encuestas.update({
      where: { id },
      data: { estado_id: estadoActiva!.id },
      include: { estados_flujo: true },
    });
  }

  async cerrar(id: string, usuarioId: string) {
    const estadoCerrada = await this.prisma.estados_flujo.findFirst({
      where: { modulo: 'GS', codigo: 'CERRADA' },
    });

    return this.prisma.encuestas.update({
      where: { id },
      data: { estado_id: estadoCerrada!.id, fecha_fin: new Date() },
    });
  }

  // ─── Secciones y Preguntas ────────────────────────────

  async crearSeccion(encuestaId: string, dto: CrearSeccionDto) {
    await this.findOne(encuestaId);

    const maxOrden = await this.prisma.secciones_encuesta.aggregate({
      where: { encuesta_id: encuestaId },
      _max: { orden: true },
    });

    return this.prisma.secciones_encuesta.create({
      data: {
        encuesta_id: encuestaId,
        titulo: dto.titulo,
        descripcion: dto.descripcion,
        orden: (maxOrden._max.orden || 0) + 1,
      },
    });
  }

  async crearPregunta(seccionId: string, dto: CrearPreguntaDto) {
    const seccion = await this.prisma.secciones_encuesta.findUnique({
      where: { id: seccionId },
    });
    if (!seccion) throw new NotFoundException('Sección no encontrada.');

    const maxOrden = await this.prisma.preguntas_encuesta.aggregate({
      where: { seccion_id: seccionId },
      _max: { orden: true },
    });

    const pregunta = await this.prisma.preguntas_encuesta.create({
      data: {
        seccion_id: seccionId,
        tipo_id: dto.tipo_id,
        texto: dto.texto,
        texto_ayuda: dto.texto_ayuda,
        obligatoria: dto.obligatoria ?? true,
        orden: (maxOrden._max.orden || 0) + 1,
        configuracion: dto.configuracion,
      },
    });

    // Crear opciones si se proporcionaron
    if (dto.opciones?.length) {
      await Promise.all(
        dto.opciones.map((op, idx) =>
          this.prisma.opciones_pregunta.create({
            data: {
              pregunta_id: pregunta.id,
              texto: op.texto,
              valor: op.valor,
              orden: idx + 1,
            },
          }),
        ),
      );
    }

    return this.prisma.preguntas_encuesta.findUnique({
      where: { id: pregunta.id },
      include: { tipos_pregunta: true, opciones_pregunta: true },
    });
  }

  // ─── Participación y Respuestas ───────────────────────

  async generarTokenParticipacion(encuestaId: string, usuarioId?: string) {
    const encuesta = await this.findOne(encuestaId) as any;

    if (encuesta.estados_flujo.codigo !== 'ACTIVA') {
      throw new ForbiddenException('La encuesta no está activa.');
    }

    // Si no es anónima, verificar que no haya respondido ya
    if (!encuesta.es_anonima && usuarioId) {
      const participacionExistente = await this.prisma.participaciones_encuesta.findFirst({
        where: { encuesta_id: encuestaId, usuario_id: usuarioId, completada: true },
      });
      if (participacionExistente) {
        throw new ConflictException('Ya respondiste esta encuesta.');
      }
    }

    const token = uuidv4();
    const participacion = await this.prisma.participaciones_encuesta.create({
      data: {
        encuesta_id: encuestaId,
        usuario_id: encuesta.es_anonima ? null : usuarioId,
        token_anonimo: token,
        fecha_inicio: new Date(),
      },
    });

    return { participacion_id: participacion.id, token };
  }

  async responder(participacionId: string, dto: ResponderEncuestaDto) {
    const participacion = await this.prisma.participaciones_encuesta.findUnique({
      where: { id: participacionId },
    });
    if (!participacion) throw new NotFoundException('Participación no encontrada.');
    if (participacion.completada) {
      throw new ConflictException('Esta participación ya fue completada.');
    }

    // Guardar respuestas (upsert)
    await Promise.all(
      dto.respuestas.map((r) =>
        this.prisma.respuestas_encuesta.upsert({
          where: {
            participacion_id_pregunta_id: {
              participacion_id: participacionId,
              pregunta_id: r.pregunta_id,
            },
          },
          create: {
            participacion_id: participacionId,
            pregunta_id: r.pregunta_id,
            valor_texto: r.valor_texto,
            valor_numerico: r.valor_numerico,
            opciones_seleccionadas: r.opciones_seleccionadas,
          },
          update: {
            valor_texto: r.valor_texto,
            valor_numerico: r.valor_numerico,
            opciones_seleccionadas: r.opciones_seleccionadas,
          },
        }),
      ),
    );

    // Marcar como completada si es el envío final
    if (dto.es_envio_final) {
      await this.prisma.participaciones_encuesta.update({
        where: { id: participacionId },
        data: { completada: true, fecha_fin: new Date() },
      });
    }

    return { guardadas: dto.respuestas.length, completada: dto.es_envio_final };
  }

  // ─── Resultados y Análisis ────────────────────────────

  async obtenerResultados(encuestaId: string) {
    const encuesta = await this.findOne(encuestaId) as any;

    const totalParticipaciones = await this.prisma.participaciones_encuesta.count({
      where: { encuesta_id: encuestaId, completada: true },
    });

    const resultadosPorPregunta: any[] = [];

    for (const seccion of encuesta.secciones_encuesta) {
      for (const pregunta of seccion.preguntas_encuesta) {
        const respuestas = await this.prisma.respuestas_encuesta.findMany({
          where: {
            pregunta_id: pregunta.id,
            participaciones_encuesta: { encuesta_id: encuestaId, completada: true },
          },
        });

        const tipoCodigo = pregunta.tipos_pregunta?.codigo;

        let analisis: any = { total_respuestas: respuestas.length };

        if (['LIKERT', 'ESCALA'].includes(tipoCodigo)) {
          const valores = respuestas
            .map((r: any) => r.valor_numerico)
            .filter((v: any) => v !== null);
          analisis.promedio = valores.length
            ? valores.reduce((a: number, b: number) => a + b, 0) / valores.length
            : null;
          analisis.min = valores.length ? Math.min(...valores) : null;
          analisis.max = valores.length ? Math.max(...valores) : null;
        }

        if (['OPCION_M', 'MULTI_SEL', 'BINARIA'].includes(tipoCodigo)) {
          const conteo: Record<string, number> = {};
          for (const r of respuestas) {
            const val = r.valor_texto || '';
            conteo[val] = (conteo[val] || 0) + 1;
          }
          analisis.conteo_opciones = conteo;
        }

        resultadosPorPregunta.push({
          seccion_titulo: seccion.titulo,
          pregunta_id: pregunta.id,
          pregunta_texto: pregunta.texto,
          tipo: tipoCodigo,
          ...analisis,
        });
      }
    }

    return {
      encuesta_titulo: encuesta.titulo,
      total_participaciones: totalParticipaciones,
      resultados: resultadosPorPregunta,
    };
  }
}
