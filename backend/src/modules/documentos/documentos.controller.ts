// src/modules/documentos/documentos.controller.ts
import {
  Controller, Get, Post, Put, Delete, Patch, Body, Param,
  Query, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus,
  UploadedFile, UseInterceptors, Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes,
  ApiBody, ApiQuery, ApiResponse,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ExportacionService, ColumnaExportacion } from '../../common/services/exportacion.service';
import { DocumentosService } from './documentos.service';
import { CrearDocumentoDto } from './dto/crear-documento.dto';
import { ActualizarDocumentoDto } from './dto/actualizar-documento.dto';
import { FiltrarDocumentosDto } from './dto/filtrar-documentos.dto';
import { CrearVersionDto } from './dto/crear-version.dto';
import { AprobarDocumentoDto } from './dto/aprobar-documento.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, RolSistema } from '../../common/decorators/roles.decorator';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator';
import { UsuarioJwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('documentos')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'documentos', version: '1' })
export class DocumentosController {
  constructor(
    private readonly documentosService: DocumentosService,
    private readonly exportacionService: ExportacionService,
  ) {}

  @Post()
  @Roles(RolSistema.ADMIN_CALIDAD, RolSistema.DIRECTOR_CALIDAD, RolSistema.JEFE_AREA, RolSistema.RESPONSABLE_PROCESO)
  @ApiOperation({ summary: 'Crear documento en estado Borrador' })
  crear(@Body() dto: CrearDocumentoDto, @UsuarioActual() u: UsuarioJwtPayload) {
    return this.documentosService.crear(dto, u.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Listar documentos con filtros y paginación' })
  findAll(@Query() filtros: FiltrarDocumentosDto) {
    return this.documentosService.findAll(filtros);
  }

  @Get('buscar')
  @ApiOperation({ summary: 'Búsqueda full-text en título, código y palabras clave' })
  @ApiQuery({ name: 'q', description: 'Término de búsqueda' })
  buscar(@Query('q') termino: string) {
    return this.documentosService.buscarFullText(termino);
  }

  @Get('exportar/csv')
  @ApiOperation({ summary: 'Exportar documentos a CSV' })
  async exportarCSV(@Res() res: Response) {
    const datos = await this.documentosService.listarTodos();
    const columnas: ColumnaExportacion[] = [
      { titulo: 'Código', campo: 'codigo' },
      { titulo: 'Título', campo: 'titulo' },
      { titulo: 'Tipo', campo: 'tipos_documento.nombre' },
      { titulo: 'Estado', campo: 'estados_flujo.codigo' },
      { titulo: 'Versión', campo: 'version_actual' },
      { titulo: 'Activo', campo: 'esta_activo' },
    ];
    const stream = this.exportacionService.generarCSV(datos, columnas, 'documentos');
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="documentos.csv"',
    });
    stream.getStream().pipe(res);
  }

  @Get('exportar/xlsx')
  @ApiOperation({ summary: 'Exportar documentos a Excel' })
  async exportarXLSX(@Res() res: Response) {
    const datos = await this.documentosService.listarTodos();
    const columnas: ColumnaExportacion[] = [
      { titulo: 'Código', campo: 'codigo' },
      { titulo: 'Título', campo: 'titulo' },
      { titulo: 'Tipo', campo: 'tipos_documento.nombre' },
      { titulo: 'Estado', campo: 'estados_flujo.codigo' },
      { titulo: 'Versión', campo: 'version_actual' },
      { titulo: 'Activo', campo: 'esta_activo' },
    ];
    const stream = await this.exportacionService.generarXLSX(datos, columnas, 'documentos', 'Documentos');
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="documentos.xlsx"',
    });
    stream.getStream().pipe(res);
  }

  @Get('exportar/pdf')
  @ApiOperation({ summary: 'Exportar documentos a PDF' })
  async exportarPDF(@Res() res: Response) {
    const datos = await this.documentosService.listarTodos();
    const columnas: ColumnaExportacion[] = [
      { titulo: 'Código', campo: 'codigo' },
      { titulo: 'Título', campo: 'titulo' },
      { titulo: 'Tipo', campo: 'tipos_documento.nombre' },
      { titulo: 'Versión', campo: 'version_actual' },
    ];
    const stream = await this.exportacionService.generarPDF(
      'Documentos del SIGC-UNT',
      [
        { etiqueta: 'Fecha de exportación', valor: new Date().toLocaleDateString('es-PE') },
        { etiqueta: 'Total de documentos', valor: String(datos.length) },
      ],
      columnas, datos, 'documentos',
    );
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="documentos.pdf"',
    });
    stream.getStream().pipe(res);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener documento con todas sus versiones' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentosService.findOne(id);
  }

  @Put(':id')
  @Roles(RolSistema.ADMIN_CALIDAD, RolSistema.JEFE_AREA, RolSistema.RESPONSABLE_PROCESO)
  @ApiOperation({ summary: 'Actualizar metadatos del documento (solo en Borrador/En Revisión)' })
  actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarDocumentoDto,
    @UsuarioActual() u: UsuarioJwtPayload,
  ) {
    return this.documentosService.actualizar(id, dto, u.sub);
  }

  @Delete(':id')
  @Roles(RolSistema.ADMIN_CALIDAD, RolSistema.DIRECTOR_CALIDAD)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar documento (solo en Borrador)' })
  eliminar(@Param('id', ParseUUIDPipe) id: string, @UsuarioActual() u: UsuarioJwtPayload) {
    return this.documentosService.eliminar(id, u.sub);
  }

  // ─── Versiones ────────────────────────────────────────

  @Get(':id/versiones')
  @ApiOperation({ summary: 'Listar todas las versiones del documento' })
  obtenerVersiones(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentosService.obtenerVersiones(id);
  }

  @Post(':id/versiones')
  @Roles(RolSistema.ADMIN_CALIDAD, RolSistema.JEFE_AREA, RolSistema.RESPONSABLE_PROCESO)
  @UseInterceptors(FileInterceptor('archivo', {
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB máximo
    fileFilter: (_req, file, cb) => {
      const tiposPermitidos = [
        'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];
      if (tiposPermitidos.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Solo se permiten archivos PDF, Word y Excel.'), false);
      }
    },
  }))
  @ApiOperation({ summary: 'Crear nueva versión del documento con archivo adjunto' })
  @ApiConsumes('multipart/form-data')
  crearVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CrearVersionDto,
    @UploadedFile() archivo: Express.Multer.File,
    @UsuarioActual() u: UsuarioJwtPayload,
  ) {
    return this.documentosService.crearVersion(id, dto, archivo, u.sub);
  }

  @Get(':id/descargar')
  @ApiOperation({ summary: 'Obtener URL presignada de descarga del documento (1 hora)' })
  @ApiQuery({ name: 'version_id', required: false })
  descargar(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('version_id') versionId?: string,
  ) {
    return this.documentosService.generarUrlDescarga(id, versionId);
  }

  // ─── Flujo de Aprobación ──────────────────────────────

  @Patch(':id/estado')
  @Roles(
    RolSistema.ADMIN_CALIDAD, RolSistema.DIRECTOR_CALIDAD,
    RolSistema.JEFE_AREA, RolSistema.AUDITOR_LIDER,
  )
  @ApiOperation({
    summary: 'Cambiar estado del documento en el flujo de aprobación',
    description: 'Transiciones: BORRADOR→EN_REVISION→APROBADO→PUBLICADO→OBSOLETO→ARCHIVADO',
  })
  cambiarEstado(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AprobarDocumentoDto,
    @UsuarioActual() u: UsuarioJwtPayload,
  ) {
    return this.documentosService.cambiarEstado(id, dto, u.sub);
  }
}
