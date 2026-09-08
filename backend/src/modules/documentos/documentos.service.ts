// src/modules/documentos/documentos.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../database/prisma.service';
import { MinioService } from './minio.service';
import { CrearDocumentoDto } from './dto/crear-documento.dto';
import { ActualizarDocumentoDto } from './dto/actualizar-documento.dto';
import { FiltrarDocumentosDto } from './dto/filtrar-documentos.dto';
import { CrearVersionDto } from './dto/crear-version.dto';
import { AprobarDocumentoDto } from './dto/aprobar-documento.dto';
import { construirPaginacion, construirRespuestaPaginada } from '../../common/utils/paginacion.util';

// Transiciones válidas del flujo documental
const TRANSICIONES_VALIDAS: Record<string, string[]> = {
  BORRADOR:    ['EN_REVISION'],
  EN_REVISION: ['APROBADO', 'BORRADOR'],    // Puede rechazarse de vuelta a borrador
  APROBADO:    ['PUBLICADO'],
  PUBLICADO:   ['OBSOLETO'],
  OBSOLETO:    ['ARCHIVADO'],
};

@Injectable()
export class DocumentosService {
  private readonly logger = new Logger(DocumentosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly minioService: MinioService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async crear(dto: CrearDocumentoDto, creadoPor: string) {
    // Verificar código único
    const existe = await this.prisma.documentos.findFirst({
      where: { codigo: dto.codigo },
    });
    if (existe) {
      throw new ConflictException(`Ya existe un documento con el código ${dto.codigo}.`);
    }

    // Obtener estado inicial BORRADOR
    const estadoBorrador = await this.prisma.estados_flujo.findFirst({
      where: { modulo: 'GD', codigo: 'BORRADOR' },
    });
    if (!estadoBorrador) throw new BadRequestException('Estado BORRADOR no configurado en el sistema.');

    const documento = await this.prisma.documentos.create({
      data: {
        codigo: dto.codigo,
        tipo_documento_id: dto.tipo_documento_id,
        titulo: dto.titulo,
        descripcion: dto.descripcion,
        area_id: dto.area_id,
        proceso_id: dto.proceso_id,
        palabras_clave: dto.palabras_clave || [],
        aplica_a: dto.aplica_a || [],
        estado_id: estadoBorrador.id,
        version_actual: '1.0',
        creado_por: creadoPor,
      },
      include: {
        tipos_documento: true,
        areas: { select: { id: true, nombre: true } },
        estados_flujo: true,
      },
    });

    this.logger.log(`Documento creado: ${documento.codigo} por ${creadoPor}`);
    this.eventEmitter.emit('documento.creado', {
      documentoId: documento.id,
      codigo: documento.codigo,
      creadoPor,
    });

    return documento;
  }

  async findAll(filtros: FiltrarDocumentosDto) {
    const { pagina, limite, skip, order, sortBy } = construirPaginacion(filtros);

    const where: any = { esta_activo: true, eliminado_en: null };

    if (filtros.tipo_documento_id) where.tipo_documento_id = filtros.tipo_documento_id;
    if (filtros.area_id) where.area_id = filtros.area_id;
    if (filtros.proceso_id) where.proceso_id = filtros.proceso_id;
    if (filtros.estado_codigo) {
      where.estados_flujo = { codigo: filtros.estado_codigo };
    }
    if (filtros.busqueda) {
      where.OR = [
        { titulo: { contains: filtros.busqueda, mode: 'insensitive' } },
        { codigo: { contains: filtros.busqueda, mode: 'insensitive' } },
        { palabras_clave: { has: filtros.busqueda } },
      ];
    }

    const [datos, total] = await Promise.all([
      this.prisma.documentos.findMany({
        where,
        include: {
          tipos_documento: { select: { codigo: true, nombre: true } },
          areas: { select: { id: true, nombre: true, codigo: true } },
          estados_flujo: { select: { codigo: true, nombre: true, color_hex: true } },
          usuarios_documentos_creado_porTousuarios: {
            select: { nombres: true, apellidos: true },
          },
        },
        skip,
        take: limite,
        orderBy: { [sortBy]: order },
      }),
      this.prisma.documentos.count({ where }),
    ]);

    return construirRespuestaPaginada(datos, total, pagina, limite);
  }

  async listarTodos() {
    return this.prisma.documentos.findMany({
      where: { esta_activo: true, eliminado_en: null },
      include: {
        tipos_documento: { select: { codigo: true, nombre: true } },
        areas: { select: { id: true, nombre: true, codigo: true } },
        estados_flujo: { select: { codigo: true, nombre: true, color_hex: true } },
      },
      orderBy: { creado_en: 'desc' },
    });
  }

  async findOne(id: string) {
    const documento = await this.prisma.documentos.findUnique({
      where: { id },
      include: {
        tipos_documento: true,
        areas: true,
        estados_flujo: true,
        procesos: { select: { id: true, nombre: true, codigo: true } },
        versiones_documento: {
          include: {
            estados_flujo: true,
            usuarios_versiones_documento_elaborado_porTousuarios: {
              select: { nombres: true, apellidos: true },
            },
          },
          orderBy: { fecha_elaboracion: 'desc' },
        },
      },
    });

    if (!documento || documento.eliminado_en) {
      throw new NotFoundException(`Documento con ID ${id} no encontrado.`);
    }

    return documento;
  }

  async actualizar(id: string, dto: ActualizarDocumentoDto, modificadoPor: string) {
    const doc = await this.findOne(id);

    // Solo se puede editar si está en BORRADOR o EN_REVISION
    const estadoActual = (doc as any).estados_flujo?.codigo;
    if (!['BORRADOR', 'EN_REVISION'].includes(estadoActual)) {
      throw new ForbiddenException(
        `No se puede editar un documento en estado ${estadoActual}. Solo documentos en Borrador o En Revisión.`,
      );
    }

    return this.prisma.documentos.update({
      where: { id },
      data: { ...dto, modificado_por: modificadoPor },
      include: {
        tipos_documento: true,
        areas: { select: { id: true, nombre: true } },
        estados_flujo: true,
      },
    });
  }

  async eliminar(id: string, eliminadoPor: string) {
    const doc = await this.findOne(id);
    const estadoActual = (doc as any).estados_flujo?.codigo;

    if (['PUBLICADO', 'OBSOLETO'].includes(estadoActual)) {
      throw new ForbiddenException(
        `No se puede eliminar un documento en estado ${estadoActual}.`,
      );
    }

    await this.prisma.documentos.update({
      where: { id },
      data: {
        esta_activo: false,
        eliminado_en: new Date(),
        eliminado_por: eliminadoPor,
      },
    });

    return { mensaje: 'Documento eliminado correctamente.' };
  }

  // ─── Gestión de Versiones ─────────────────────────────

  async crearVersion(
    documentoId: string,
    dto: CrearVersionDto,
    archivo: Express.Multer.File | undefined,
    elaboradoPor: string,
  ) {
    const documento = await this.findOne(documentoId);

    // Verificar que no haya versión en proceso
    const versionActiva = await this.prisma.versiones_documento.findFirst({
      where: {
        documento_id: documentoId,
        estados_flujo: { codigo: { in: ['BORRADOR', 'EN_REVISION'] } },
      },
    });

    if (versionActiva) {
      throw new ConflictException(
        'Ya existe una versión en proceso (Borrador o En Revisión). Complete el flujo actual antes de crear una nueva versión.',
      );
    }

    let contenidoUrl: string | undefined;
    if (archivo) {
      const nombreArchivo = this.minioService.generarNombreArchivo(
        archivo.originalname,
        `documentos/${documento.codigo}`,
      );
      contenidoUrl = await this.minioService.subirArchivo(
        'documentos',
        nombreArchivo,
        archivo.buffer,
        archivo.mimetype,
      );
    }

    const estadoBorrador = await this.prisma.estados_flujo.findFirst({
      where: { modulo: 'GD', codigo: 'BORRADOR' },
    });

    const version = await this.prisma.versiones_documento.create({
      data: {
        documento_id: documentoId,
        numero_version: dto.numero_version,
        contenido_url: contenidoUrl,
        resumen_cambios: dto.resumen_cambios,
        estado_id: estadoBorrador!.id,
        es_version_actual: false,
        elaborado_por: elaboradoPor,
      },
    });

    this.eventEmitter.emit('documento.version-creada', {
      documentoId,
      versionId: version.id,
      elaboradoPor,
    });

    return version;
  }

  async obtenerVersiones(documentoId: string) {
    await this.findOne(documentoId);

    return this.prisma.versiones_documento.findMany({
      where: { documento_id: documentoId },
      include: {
        estados_flujo: true,
        usuarios_versiones_documento_elaborado_porTousuarios: {
          select: { nombres: true, apellidos: true },
        },
        usuarios_versiones_documento_aprobado_porTousuarios: {
          select: { nombres: true, apellidos: true },
        },
      },
      orderBy: { fecha_elaboracion: 'desc' },
    });
  }

  // ─── Flujo de Aprobación ──────────────────────────────

  async cambiarEstado(
    documentoId: string,
    dto: AprobarDocumentoDto,
    usuarioId: string,
  ) {
    const documento = await this.findOne(documentoId);
    const estadoActual = (documento as any).estados_flujo?.codigo;
    const transicionesPermitidas = TRANSICIONES_VALIDAS[estadoActual] || [];

    if (!transicionesPermitidas.includes(dto.nuevo_estado)) {
      throw new BadRequestException(
        `Transición no válida: de ${estadoActual} a ${dto.nuevo_estado}. ` +
        `Transiciones permitidas: ${transicionesPermitidas.join(', ')}.`,
      );
    }

    const nuevoEstado = await this.prisma.estados_flujo.findFirst({
      where: { modulo: 'GD', codigo: dto.nuevo_estado },
    });

    if (!nuevoEstado) {
      throw new NotFoundException(`Estado ${dto.nuevo_estado} no encontrado.`);
    }

    // Si se publica, marcar la versión actual
    if (dto.nuevo_estado === 'PUBLICADO' && dto.version_id) {
      await this.prisma.$transaction([
        this.prisma.versiones_documento.updateMany({
          where: { documento_id: documentoId },
          data: { es_version_actual: false },
        }),
        this.prisma.versiones_documento.update({
          where: { id: dto.version_id },
          data: {
            es_version_actual: true,
            aprobado_por: usuarioId,
            fecha_aprobacion: new Date(),
            fecha_publicacion: new Date(),
          },
        }),
      ]);
    }

    const documentoActualizado = await this.prisma.documentos.update({
      where: { id: documentoId },
      data: {
        estado_id: nuevoEstado.id,
        modificado_por: usuarioId,
      },
      include: { estados_flujo: true },
    });

    // Registrar en tabla de aprobaciones
    await this.prisma.aprobaciones_documento.create({
      data: {
        version_id: dto.version_id || '',
        paso: 1,
        tipo_paso: dto.nuevo_estado === 'APROBADO' ? 'APROBACION' : 'REVISION',
        usuario_id: usuarioId,
        accion: dto.nuevo_estado === 'BORRADOR' ? 'RECHAZADO' : 'APROBADO',
        comentarios: dto.comentarios,
        fecha_accion: new Date(),
      },
    });

    this.eventEmitter.emit('documento.estado-cambiado', {
      documentoId,
      estadoAnterior: estadoActual,
      estadoNuevo: dto.nuevo_estado,
      usuarioId,
    });

    return documentoActualizado;
  }

  async generarUrlDescarga(documentoId: string, versionId?: string) {
    const documento = await this.findOne(documentoId);

    let version: any;
    if (versionId) {
      version = await this.prisma.versiones_documento.findUnique({
        where: { id: versionId },
      });
    } else {
      version = await this.prisma.versiones_documento.findFirst({
        where: { documento_id: documentoId, es_version_actual: true },
      });
    }

    if (!version?.contenido_url) {
      throw new NotFoundException('El documento no tiene archivo adjunto.');
    }

    const partes = version.contenido_url.split('/');
    const nombreArchivo = partes.slice(1).join('/');

    const url = await this.minioService.generarUrlDescarga('documentos', nombreArchivo, 3600);
    return { url, expira_en: '1 hora', nombre_archivo: partes[partes.length - 1] };
  }

  async buscarFullText(termino: string, limite = 20) {
    return this.prisma.documentos.findMany({
      where: {
        esta_activo: true,
        eliminado_en: null,
        OR: [
          { titulo: { contains: termino, mode: 'insensitive' } },
          { codigo: { contains: termino, mode: 'insensitive' } },
          { descripcion: { contains: termino, mode: 'insensitive' } },
          { palabras_clave: { has: termino } },
        ],
      },
      include: {
        tipos_documento: { select: { codigo: true, nombre: true } },
        estados_flujo: { select: { codigo: true, nombre: true, color_hex: true } },
      },
      take: limite,
      orderBy: { modificado_en: 'desc' },
    });
  }
}
