import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  UseGuards, ParseUUIDPipe, HttpCode, HttpStatus, Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { AuditoriasService } from './auditorias.service';
import { ExportacionService, ColumnaExportacion } from '../../common/services/exportacion.service';
import { CrearChecklistDto, ActualizarChecklistDto, CrearItemChecklistDto, ActualizarItemChecklistDto } from './dto/checklist.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, RolSistema } from '../../common/decorators/roles.decorator';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator';
import { UsuarioJwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('checklists')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'checklists', version: '1' })
export class ChecklistsController {
  constructor(
    private readonly auditoriasService: AuditoriasService,
    private readonly exportacionService: ExportacionService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar plantillas de checklist' })
  listar() {
    return this.auditoriasService.listarChecklists();
  }

  @Get('exportar/csv')
  @ApiOperation({ summary: 'Exportar checklists a CSV' })
  async exportarCSV(@Res() res: Response) {
    const datos = await this.auditoriasService.listarTodosChecklists();
    const columnas: ColumnaExportacion[] = [
      { titulo: 'Nombre', campo: 'nombre' },
      { titulo: 'Tipo Auditoría', campo: 'tipos_auditoria.nombre' },
      { titulo: 'Versión', campo: 'version' },
      { titulo: 'Items', campo: '_count.items_checklist' },
      { titulo: 'Activo', campo: 'esta_activo' },
    ];
    const stream = this.exportacionService.generarCSV(datos, columnas, 'checklists');
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="checklists.csv"',
    });
    stream.getStream().pipe(res);
  }

  @Get('exportar/xlsx')
  @ApiOperation({ summary: 'Exportar checklists a Excel' })
  async exportarXLSX(@Res() res: Response) {
    const datos = await this.auditoriasService.listarTodosChecklists();
    const columnas: ColumnaExportacion[] = [
      { titulo: 'Nombre', campo: 'nombre' },
      { titulo: 'Tipo Auditoría', campo: 'tipos_auditoria.nombre' },
      { titulo: 'Versión', campo: 'version' },
      { titulo: 'Items', campo: '_count.items_checklist' },
      { titulo: 'Activo', campo: 'esta_activo' },
    ];
    const stream = await this.exportacionService.generarXLSX(datos, columnas, 'checklists', 'Checklists');
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="checklists.xlsx"',
    });
    stream.getStream().pipe(res);
  }

  @Get('exportar/pdf')
  @ApiOperation({ summary: 'Exportar checklists a PDF' })
  async exportarPDF(@Res() res: Response) {
    const datos = await this.auditoriasService.listarTodosChecklists();
    const columnas: ColumnaExportacion[] = [
      { titulo: 'Nombre', campo: 'nombre' },
      { titulo: 'Tipo Auditoría', campo: 'tipos_auditoria.nombre' },
      { titulo: 'Versión', campo: 'version' },
      { titulo: 'Items', campo: '_count.items_checklist' },
      { titulo: 'Activo', campo: 'esta_activo' },
    ];
    const stream = await this.exportacionService.generarPDF(
      'Checklists de Auditoría — SIGC-UNT',
      [
        { etiqueta: 'Fecha de exportación', valor: new Date().toLocaleDateString('es-PE') },
        { etiqueta: 'Total de checklists', valor: String(datos.length) },
      ],
      columnas, datos, 'checklists',
    );
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="checklists.pdf"',
    });
    stream.getStream().pipe(res);
  }

  @Get(':id/exportar/xlsx')
  @ApiOperation({ summary: 'Exportar checklist con items a Excel' })
  async exportarXLSXDetalle(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const cl = await this.auditoriasService.obtenerChecklist(id);
    const items = cl.items_checklist ?? [];
    const nomArchivo = `checklist-${cl.nombre.toLowerCase().replace(/\s+/g, '-')}`;

    const columnas: ColumnaExportacion[] = [
      { titulo: '#', campo: 'orden', ancho: 6 },
      { titulo: 'Criterio', campo: 'criterio_referencia', ancho: 18 },
      { titulo: 'Pregunta', campo: 'pregunta', ancho: 50 },
      { titulo: 'Tipo Respuesta', campo: 'tipo_respuesta', ancho: 16 },
      { titulo: 'Obligatorio', campo: 'obligatorio', ancho: 12 },
      { titulo: 'Ayuda', campo: 'descripcion_ayuda', ancho: 35 },
    ];

    const metadatos = [
      { etiqueta: 'Versión', valor: `v${cl.version}` },
      { etiqueta: 'Tipo Auditoría', valor: cl.tipos_auditoria?.nombre ?? '-' },
    ];
    if (cl.descripcion) metadatos.push({ etiqueta: 'Descripción', valor: cl.descripcion });

    const stream = await this.exportacionService.generarXLSXConEncabezado(
      cl.nombre, metadatos, columnas, items, nomArchivo,
    );

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${nomArchivo}.xlsx"`,
    });
    stream.getStream().pipe(res);
  }

  @Get(':id/exportar/pdf')
  @ApiOperation({ summary: 'Exportar checklist con sus items a PDF' })
  async exportarPDFDetalle(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const cl = await this.auditoriasService.obtenerChecklist(id);
    const items = cl.items_checklist ?? [];
    const nomArchivo = `checklist-${cl.nombre.toLowerCase().replace(/\s+/g, '-')}`;

    const columnas: ColumnaExportacion[] = [
      { titulo: '#', campo: 'orden' },
      { titulo: 'Criterio', campo: 'criterio_referencia' },
      { titulo: 'Pregunta', campo: 'pregunta' },
      { titulo: 'Tipo', campo: 'tipo_respuesta' },
      { titulo: 'Oblig.', campo: 'obligatorio' },
    ];

    const metadatos = [
      { etiqueta: 'Versión', valor: `v${cl.version}` },
      { etiqueta: 'Tipo Auditoría', valor: cl.tipos_auditoria?.nombre ?? '-' },
    ];
    if (cl.descripcion) metadatos.push({ etiqueta: 'Descripción', valor: cl.descripcion });

    const stream = await this.exportacionService.generarPDF(
      cl.nombre, metadatos, columnas, items, nomArchivo,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${nomArchivo}.pdf"`,
    });
    stream.getStream().pipe(res);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener plantilla con sus items' })
  obtener(@Param('id', ParseUUIDPipe) id: string) {
    return this.auditoriasService.obtenerChecklist(id);
  }

  @Post()
  @Roles(RolSistema.ADMIN_CALIDAD, RolSistema.AUDITOR_LIDER)
  @ApiOperation({ summary: 'Crear plantilla de checklist' })
  crear(@Body() dto: CrearChecklistDto, @UsuarioActual() u: UsuarioJwtPayload) {
    return this.auditoriasService.crearChecklist(dto, u.sub);
  }

  @Patch(':id')
  @Roles(RolSistema.ADMIN_CALIDAD, RolSistema.AUDITOR_LIDER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar plantilla de checklist' })
  actualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ActualizarChecklistDto) {
    return this.auditoriasService.actualizarChecklist(id, dto);
  }

  @Delete(':id')
  @Roles(RolSistema.ADMIN_CALIDAD, RolSistema.AUDITOR_LIDER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar plantilla de checklist' })
  eliminar(@Param('id', ParseUUIDPipe) id: string) {
    return this.auditoriasService.eliminarChecklist(id);
  }

  @Post(':id/items')
  @Roles(RolSistema.ADMIN_CALIDAD, RolSistema.AUDITOR_LIDER)
  @ApiOperation({ summary: 'Agregar item a checklist' })
  agregarItem(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CrearItemChecklistDto) {
    return this.auditoriasService.agregarItem(id, dto);
  }

  @Patch('items/:itemId')
  @Roles(RolSistema.ADMIN_CALIDAD, RolSistema.AUDITOR_LIDER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar item de checklist' })
  actualizarItem(@Param('itemId', ParseUUIDPipe) itemId: string, @Body() dto: ActualizarItemChecklistDto) {
    return this.auditoriasService.actualizarItem(itemId, dto);
  }

  @Delete('items/:itemId')
  @Roles(RolSistema.ADMIN_CALIDAD, RolSistema.AUDITOR_LIDER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar item de checklist' })
  eliminarItem(@Param('itemId', ParseUUIDPipe) itemId: string) {
    return this.auditoriasService.eliminarItem(itemId);
  }
}
