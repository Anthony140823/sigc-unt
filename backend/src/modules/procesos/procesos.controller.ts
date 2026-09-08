// src/modules/procesos/procesos.controller.ts
// ================================================================
import {
  Controller, Get, Post, Put, Patch, Body, Param,
  Query, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus, Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { ExportacionService, ColumnaExportacion } from '../../common/services/exportacion.service';
import { ProcesosService } from './procesos.service';
import { CrearMacroProcesoDto } from './dto/crear-macroproceso.dto';
import { CrearProcesoDto } from './dto/crear-proceso.dto';
import { CrearSubprocesoDto } from './dto/crear-subproceso.dto';
import { ActualizarProcesoDto } from './dto/actualizar-proceso.dto';
import { ActualizarMatrizRaciDto } from './dto/actualizar-matriz-raci.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, RolSistema } from '../../common/decorators/roles.decorator';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator';
import { UsuarioJwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('procesos')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'procesos', version: '1' })
export class ProcesosController {
  constructor(
    private readonly procesosService: ProcesosService,
    private readonly exportacionService: ExportacionService,
  ) {}

  @Get('mapa')
  @ApiOperation({ summary: 'Mapa de procesos completo: macroprocesos → procesos → subprocesos' })
  mapa() { return this.procesosService.mapaProcesosCompleto(); }

  @Get('macroprocesos')
  @ApiOperation({ summary: 'Listar macroprocesos activos' })
  findAllMacro() { return this.procesosService.findAllMacroprocesos(); }

  @Post('macroprocesos')
  @Roles(RolSistema.ADMIN_CALIDAD, RolSistema.SUPERADMIN)
  @ApiOperation({ summary: 'Crear macroproceso' })
  crearMacro(@Body() dto: CrearMacroProcesoDto) {
    return this.procesosService.crearMacroproceso(dto);
  }

  @Post()
  @Roles(RolSistema.ADMIN_CALIDAD, RolSistema.DIRECTOR_CALIDAD)
  @ApiOperation({ summary: 'Crear proceso dentro de un macroproceso' })
  crear(@Body() dto: CrearProcesoDto, @UsuarioActual() u: UsuarioJwtPayload) {
    return this.procesosService.crear(dto, u.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Listar procesos con filtros' })
  @ApiQuery({ name: 'macroproceso_id', required: false })
  @ApiQuery({ name: 'tipo', required: false, description: 'ESTRATEGICO | MISIONAL | SOPORTE' })
  findAll(@Query('macroproceso_id') macroId?: string, @Query('tipo') tipo?: string) {
    return this.procesosService.findAll(macroId, tipo);
  }

  @Get('exportar/csv')
  @ApiOperation({ summary: 'Exportar procesos a CSV' })
  async exportarCSV(@Res() res: Response) {
    const datos = await this.procesosService.findAll();
    const columnas: ColumnaExportacion[] = [
      { titulo: 'Código', campo: 'codigo' },
      { titulo: 'Nombre', campo: 'nombre' },
      { titulo: 'Macroproceso', campo: 'macroprocesos.nombre' },
      { titulo: 'Estado', campo: 'estados_flujo.codigo' },
    ];
    const stream = this.exportacionService.generarCSV(datos, columnas, 'procesos');
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="procesos.csv"',
    });
    stream.getStream().pipe(res);
  }

  @Get('exportar/xlsx')
  @ApiOperation({ summary: 'Exportar procesos a Excel' })
  async exportarXLSX(@Res() res: Response) {
    const datos = await this.procesosService.findAll();
    const columnas: ColumnaExportacion[] = [
      { titulo: 'Código', campo: 'codigo' },
      { titulo: 'Nombre', campo: 'nombre' },
      { titulo: 'Macroproceso', campo: 'macroprocesos.nombre' },
      { titulo: 'Estado', campo: 'estados_flujo.codigo' },
    ];
    const stream = await this.exportacionService.generarXLSX(datos, columnas, 'procesos', 'Procesos');
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="procesos.xlsx"',
    });
    stream.getStream().pipe(res);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle del proceso con subprocesos, documentos, indicadores y RACI' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.procesosService.findOne(id);
  }

  @Put(':id')
  @Roles(RolSistema.ADMIN_CALIDAD, RolSistema.DIRECTOR_CALIDAD, RolSistema.RESPONSABLE_PROCESO)
  @ApiOperation({ summary: 'Actualizar proceso (incluye diagrama BPMN JSON)' })
  actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarProcesoDto,
    @UsuarioActual() u: UsuarioJwtPayload,
  ) {
    return this.procesosService.actualizar(id, dto, u.sub);
  }

  @Post(':id/subprocesos')
  @Roles(RolSistema.ADMIN_CALIDAD, RolSistema.RESPONSABLE_PROCESO)
  @ApiOperation({ summary: 'Agregar subproceso a un proceso' })
  crearSubproceso(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CrearSubprocesoDto) {
    return this.procesosService.crearSubproceso(id, dto);
  }

  @Put(':id/raci')
  @Roles(RolSistema.ADMIN_CALIDAD, RolSistema.DIRECTOR_CALIDAD)
  @ApiOperation({ summary: 'Actualizar matriz RACI completa del proceso (reemplaza la anterior)' })
  actualizarRaci(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() items: ActualizarMatrizRaciDto[],
    @UsuarioActual() u: UsuarioJwtPayload,
  ) {
    return this.procesosService.actualizarMatrizRaci(id, items, u.sub);
  }

  @Patch(':id/estado')
  @Roles(RolSistema.ADMIN_CALIDAD, RolSistema.DIRECTOR_CALIDAD)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cambiar estado del proceso (BORRADOR → VIGENTE → EN_REVISION → OBSOLETO)' })
  cambiarEstado(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('estado_codigo') estadoCodigo: string,
    @UsuarioActual() u: UsuarioJwtPayload,
  ) {
    return this.procesosService.cambiarEstado(id, estadoCodigo, u.sub);
  }
}
