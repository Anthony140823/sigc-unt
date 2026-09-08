// src/modules/capa/capa.controller.ts
import {
  Controller, Get, Post, Put, Patch, Body, Param,
  Query, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus, Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Response } from 'express';
import { ExportacionService, ColumnaExportacion } from '../../common/services/exportacion.service';
import { CapaService } from './capa.service';
import { CrearNoConformidadDto } from './dto/crear-no-conformidad.dto';
import { FiltrarCapaDto } from './dto/filtrar-capa.dto';
import { CrearAnalisisCausaRaizDto } from './dto/crear-analisis-causa-raiz.dto';
import { CrearAccionCapaDto } from './dto/crear-accion-capa.dto';
import { ActualizarAccionCapaDto } from './dto/actualizar-accion-capa.dto';
import { VerificarEfectividadDto } from './dto/verificar-efectividad.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, RolSistema } from '../../common/decorators/roles.decorator';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator';
import { UsuarioJwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('capa')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'capa', version: '1' })
export class CapaController {
  constructor(
    private readonly capaService: CapaService,
    private readonly exportacionService: ExportacionService,
  ) {}

  // ─── No Conformidades ──────────────────────────────────

  @Post('no-conformidades')
  @Roles(RolSistema.ADMIN_CALIDAD, RolSistema.AUDITOR_LIDER, RolSistema.AUDITOR, RolSistema.JEFE_AREA)
  @ApiOperation({ summary: 'Registrar nueva no conformidad (NC)' })
  crearNC(@Body() dto: CrearNoConformidadDto, @UsuarioActual() u: UsuarioJwtPayload) {
    return this.capaService.crearNC(dto, u.sub);
  }

  @Get('no-conformidades')
  @ApiOperation({ summary: 'Listar no conformidades con filtros' })
  findAllNC(@Query() filtros: FiltrarCapaDto) {
    return this.capaService.findAllNC(filtros);
  }

  @Get('no-conformidades/estadisticas')
  @Roles(RolSistema.ADMIN_CALIDAD, RolSistema.DIRECTOR_CALIDAD, RolSistema.AUDITOR_LIDER)
  @ApiOperation({ summary: 'Estadísticas CAPA: NC por estado, origen y área' })
  estadisticas() {
    return this.capaService.estadisticas();
  }

  @Get('no-conformidades/alertas')
  @ApiOperation({ summary: 'Acciones CAPA vencidas o próximas a vencer (≤15 días)' })
  alertasVencimiento() {
    return this.capaService.obtenerAlertasVencimiento();
  }

  @Get('no-conformidades/exportar/csv')
  @ApiOperation({ summary: 'Exportar no conformidades a CSV' })
  async exportarCSV(@Res() res: Response) {
    const datos = await this.capaService.listarTodasNC();
    const columnas: ColumnaExportacion[] = [
      { titulo: 'Código', campo: 'codigo' },
      { titulo: 'Descripción', campo: 'descripcion' },
      { titulo: 'Origen', campo: 'origen' },
      { titulo: 'Estado', campo: 'estados_flujo.codigo' },
      { titulo: 'Área', campo: 'areas.nombre' },
      { titulo: 'Proceso', campo: 'procesos.nombre' },
    ];
    const stream = this.exportacionService.generarCSV(datos, columnas, 'no-conformidades');
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="no-conformidades.csv"',
    });
    stream.getStream().pipe(res);
  }

  @Get('no-conformidades/exportar/xlsx')
  @ApiOperation({ summary: 'Exportar no conformidades a Excel' })
  async exportarXLSX(@Res() res: Response) {
    const datos = await this.capaService.listarTodasNC();
    const columnas: ColumnaExportacion[] = [
      { titulo: 'Código', campo: 'codigo' },
      { titulo: 'Descripción', campo: 'descripcion' },
      { titulo: 'Origen', campo: 'origen' },
      { titulo: 'Estado', campo: 'estados_flujo.codigo' },
      { titulo: 'Área', campo: 'areas.nombre' },
      { titulo: 'Proceso', campo: 'procesos.nombre' },
    ];
    const stream = await this.exportacionService.generarXLSX(datos, columnas, 'no-conformidades', 'NC');
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="no-conformidades.xlsx"',
    });
    stream.getStream().pipe(res);
  }

  @Get('no-conformidades/:id')
  @ApiOperation({ summary: 'Detalle completo de NC con análisis y acciones' })
  findOneNC(@Param('id', ParseUUIDPipe) id: string) {
    return this.capaService.findOneNC(id);
  }

  @Patch('no-conformidades/:id/estado')
  @Roles(RolSistema.ADMIN_CALIDAD, RolSistema.DIRECTOR_CALIDAD, RolSistema.AUDITOR_LIDER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cambiar estado de la NC manualmente' })
  cambiarEstado(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('estado_codigo') estadoCodigo: string,
    @UsuarioActual() u: UsuarioJwtPayload,
  ) {
    return this.capaService.cambiarEstadoNC(id, estadoCodigo, u.sub);
  }

  // ─── Análisis de Causa Raíz ────────────────────────────

  @Post('no-conformidades/:id/analisis')
  @Roles(RolSistema.ADMIN_CALIDAD, RolSistema.AUDITOR_LIDER, RolSistema.AUDITOR, RolSistema.JEFE_AREA)
  @ApiOperation({
    summary: 'Registrar análisis de causa raíz',
    description: 'Soporta métodos: 5 Porqués, Ishikawa, Pareto, FTA, 8D. Los datos estructurados del método van en datos_metodo (JSONB).',
  })
  crearAnalisis(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CrearAnalisisCausaRaizDto,
    @UsuarioActual() u: UsuarioJwtPayload,
  ) {
    return this.capaService.crearAnalisisCausaRaiz(id, dto, u.sub);
  }

  // ─── Acciones CAPA ─────────────────────────────────────

  @Post('no-conformidades/:id/acciones')
  @Roles(RolSistema.ADMIN_CALIDAD, RolSistema.AUDITOR_LIDER, RolSistema.JEFE_AREA)
  @ApiOperation({ summary: 'Crear acción correctiva, preventiva o de mejora' })
  crearAccion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CrearAccionCapaDto,
    @UsuarioActual() u: UsuarioJwtPayload,
  ) {
    return this.capaService.crearAccion(id, dto, u.sub);
  }

  @Put('acciones/:accionId')
  @Roles(RolSistema.ADMIN_CALIDAD, RolSistema.JEFE_AREA, RolSistema.RESPONSABLE_PROCESO, RolSistema.DIGITADOR)
  @ApiOperation({ summary: 'Actualizar avance y resultado de una acción CAPA' })
  actualizarAccion(
    @Param('accionId', ParseUUIDPipe) accionId: string,
    @Body() dto: ActualizarAccionCapaDto,
    @UsuarioActual() u: UsuarioJwtPayload,
  ) {
    return this.capaService.actualizarAccion(accionId, dto, u.sub);
  }

  @Patch('acciones/:accionId/verificar')
  @Roles(RolSistema.ADMIN_CALIDAD, RolSistema.AUDITOR_LIDER, RolSistema.DIRECTOR_CALIDAD)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Registrar verificación de efectividad',
    description: 'Si es efectiva y todas las acciones de la NC están cerradas, la NC pasa a CERRADA.',
  })
  verificarEfectividad(
    @Param('accionId', ParseUUIDPipe) accionId: string,
    @Body() dto: VerificarEfectividadDto,
    @UsuarioActual() u: UsuarioJwtPayload,
  ) {
    return this.capaService.verificarEfectividad(accionId, dto, u.sub);
  }
}
