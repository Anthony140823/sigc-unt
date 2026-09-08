// src/modules/auditorias/auditorias.controller.ts
import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  Query, UseGuards, ParseUUIDPipe, ParseIntPipe, HttpCode, HttpStatus, Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { ExportacionService, ColumnaExportacion } from '../../common/services/exportacion.service';
import { AuditoriasService } from './auditorias.service';
import { CrearPlanAuditoriaDto } from './dto/crear-plan-auditoria.dto';
import { CrearAuditoriaDto } from './dto/crear-auditoria.dto';
import { FiltrarAuditoriasDto } from './dto/filtrar-auditorias.dto';
import { AsignarAuditorDto } from './dto/asignar-auditor.dto';
import { ResponderChecklistDto } from './dto/responder-checklist.dto';
import { CrearHallazgoDto } from './dto/crear-hallazgo.dto';
import { CerrarHallazgoDto } from './dto/cerrar-hallazgo.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, RolSistema } from '../../common/decorators/roles.decorator';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator';
import { UsuarioJwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('auditorias')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'auditorias', version: '1' })
export class AuditoriasController {
  constructor(
    private readonly auditoriasService: AuditoriasService,
    private readonly exportacionService: ExportacionService,
  ) {}

  // ─── Planes ────────────────────────────────────────────

  @Post('planes')
  @Roles(RolSistema.ADMIN_CALIDAD, RolSistema.DIRECTOR_CALIDAD, RolSistema.AUDITOR_LIDER)
  @ApiOperation({ summary: 'Crear plan anual de auditorías' })
  crearPlan(@Body() dto: CrearPlanAuditoriaDto, @UsuarioActual() u: UsuarioJwtPayload) {
    return this.auditoriasService.crearPlan(dto, u.sub);
  }

  @Get('planes')
  @ApiOperation({ summary: 'Listar planes de auditoría' })
  @ApiQuery({ name: 'anio', required: false })
  findAllPlanes(@Query('anio') anio?: string) {
    return this.auditoriasService.findAllPlanes(anio ? parseInt(anio) : undefined);
  }

  @Patch('planes/:id/aprobar')
  @Roles(RolSistema.ADMIN_CALIDAD, RolSistema.DIRECTOR_CALIDAD)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aprobar plan anual de auditorías' })
  aprobarPlan(@Param('id', ParseUUIDPipe) id: string, @UsuarioActual() u: UsuarioJwtPayload) {
    return this.auditoriasService.aprobarPlan(id, u.sub);
  }

  // ─── Auditorías ────────────────────────────────────────

  @Post()
  @Roles(RolSistema.ADMIN_CALIDAD, RolSistema.AUDITOR_LIDER)
  @ApiOperation({ summary: 'Programar nueva auditoría dentro de un plan' })
  crear(@Body() dto: CrearAuditoriaDto, @UsuarioActual() u: UsuarioJwtPayload) {
    return this.auditoriasService.crear(dto, u.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Listar auditorías con filtros (plan, área, estado, año)' })
  findAll(@Query() filtros: FiltrarAuditoriasDto) {
    return this.auditoriasService.findAll(filtros);
  }

  @Get('exportar/csv')
  @ApiOperation({ summary: 'Exportar auditorías a CSV' })
  async exportarCSV(@Res() res: Response) {
    const datos = await this.auditoriasService.listarTodos();
    const columnas: ColumnaExportacion[] = [
      { titulo: 'Código', campo: 'codigo' },
      { titulo: 'Nombre', campo: 'nombre' },
      { titulo: 'Tipo', campo: 'tipos_auditoria.nombre' },
      { titulo: 'Plan', campo: 'planes_auditoria.nombre' },
      { titulo: 'Estado', campo: 'estados_flujo.codigo' },
      { titulo: 'Fecha Inicio', campo: 'fecha_programada_inicio' },
      { titulo: 'Fecha Fin', campo: 'fecha_programada_fin' },
    ];
    const stream = this.exportacionService.generarCSV(datos, columnas, 'auditorias');
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="auditorias.csv"',
    });
    stream.getStream().pipe(res);
  }

  @Get('exportar/xlsx')
  @ApiOperation({ summary: 'Exportar auditorías a Excel' })
  async exportarXLSX(@Res() res: Response) {
    const datos = await this.auditoriasService.listarTodos();
    const columnas: ColumnaExportacion[] = [
      { titulo: 'Código', campo: 'codigo' },
      { titulo: 'Nombre', campo: 'nombre' },
      { titulo: 'Tipo', campo: 'tipos_auditoria.nombre' },
      { titulo: 'Plan', campo: 'planes_auditoria.nombre' },
      { titulo: 'Estado', campo: 'estados_flujo.codigo' },
      { titulo: 'Fecha Inicio', campo: 'fecha_programada_inicio' },
      { titulo: 'Fecha Fin', campo: 'fecha_programada_fin' },
    ];
    const stream = await this.exportacionService.generarXLSX(datos, columnas, 'auditorias', 'Auditorías');
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="auditorias.xlsx"',
    });
    stream.getStream().pipe(res);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de auditoría con equipo y hallazgos' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.auditoriasService.findOne(id);
  }

  @Patch(':id/estado')
  @Roles(RolSistema.ADMIN_CALIDAD, RolSistema.AUDITOR_LIDER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cambiar estado de la auditoría',
    description: 'PROGRAMADA → EN_EJECUCION → FINALIZADA → INFORME_EMITIDO → CERRADA',
  })
  cambiarEstado(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('estado_codigo') estadoCodigo: string,
    @UsuarioActual() u: UsuarioJwtPayload,
  ) {
    return this.auditoriasService.cambiarEstado(id, estadoCodigo, u.sub);
  }

  // ─── Equipo Auditor ────────────────────────────────────

  @Post(':id/auditores')
  @Roles(RolSistema.ADMIN_CALIDAD, RolSistema.AUDITOR_LIDER)
  @ApiOperation({ summary: 'Asignar auditor al equipo' })
  asignarAuditor(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AsignarAuditorDto) {
    return this.auditoriasService.asignarAuditor(id, dto);
  }

  @Delete(':id/auditores/:asignacionId')
  @Roles(RolSistema.ADMIN_CALIDAD, RolSistema.AUDITOR_LIDER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover auditor del equipo' })
  removerAuditor(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('asignacionId', ParseIntPipe) asignacionId: number,
  ) {
    return this.auditoriasService.removerAuditor(id, asignacionId);
  }

  // ─── Checklist ─────────────────────────────────────────

  @Post(':id/checklist')
  @Roles(RolSistema.AUDITOR_LIDER, RolSistema.AUDITOR, RolSistema.ADMIN_CALIDAD)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Guardar/actualizar respuestas del checklist de auditoría' })
  responderChecklist(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResponderChecklistDto,
    @UsuarioActual() u: UsuarioJwtPayload,
  ) {
    return this.auditoriasService.responderChecklist(id, dto, u.sub);
  }

  @Get(':id/checklist')
  @ApiOperation({ summary: 'Obtener respuestas del checklist de la auditoría' })
  obtenerChecklist(@Param('id', ParseUUIDPipe) id: string) {
    return this.auditoriasService.obtenerRespuestasChecklist(id);
  }

  // ─── Hallazgos ─────────────────────────────────────────

  @Post(':id/hallazgos')
  @Roles(RolSistema.AUDITOR_LIDER, RolSistema.AUDITOR, RolSistema.ADMIN_CALIDAD)
  @ApiOperation({ summary: 'Registrar hallazgo en la auditoría' })
  crearHallazgo(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CrearHallazgoDto,
    @UsuarioActual() u: UsuarioJwtPayload,
  ) {
    return this.auditoriasService.crearHallazgo(id, dto, u.sub);
  }

  @Get(':id/hallazgos')
  @ApiOperation({ summary: 'Listar hallazgos de la auditoría' })
  findHallazgos(@Param('id', ParseUUIDPipe) id: string) {
    return this.auditoriasService.findAllHallazgos({ area_id: undefined });
  }

  @Get(':id/hallazgos/resumen')
  @ApiOperation({ summary: 'Resumen de hallazgos por tipo (para informe)' })
  resumenHallazgos(@Param('id', ParseUUIDPipe) id: string) {
    return this.auditoriasService.resumenPorTipo(id);
  }

  @Patch('hallazgos/:hallazgoId/cerrar')
  @Roles(RolSistema.ADMIN_CALIDAD, RolSistema.AUDITOR_LIDER, RolSistema.DIRECTOR_CALIDAD)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar hallazgo con evidencia de cierre' })
  cerrarHallazgo(
    @Param('hallazgoId', ParseUUIDPipe) hallazgoId: string,
    @Body() dto: CerrarHallazgoDto,
    @UsuarioActual() u: UsuarioJwtPayload,
  ) {
    return this.auditoriasService.cerrarHallazgo(hallazgoId, dto, u.sub);
  }

  @Get('hallazgos/abiertos')
  @ApiOperation({ summary: 'Todos los hallazgos sin cerrar (para dashboard)' })
  hallazgosAbiertos() {
    return this.auditoriasService.findAllHallazgos({ abiertos: true });
  }
}
