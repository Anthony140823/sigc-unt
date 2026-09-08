// src/modules/riesgos/riesgos.controller.ts
import {
  Controller, Get, Post, Put, Body, Param,
  Query, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus, Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ExportacionService, ColumnaExportacion } from '../../common/services/exportacion.service';
import { RiesgosService } from './riesgos.service';
import { CrearRiesgoDto } from './dto/crear-riesgo.dto';
import { ActualizarRiesgoDto } from './dto/actualizar-riesgo.dto';
import { FiltrarRiesgosDto } from './dto/filtrar-riesgos.dto';
import { CrearPlanMitigacionDto } from './dto/crear-plan-mitigacion.dto';
import { RegistrarSeguimientoDto } from './dto/registrar-seguimiento.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, RolSistema } from '../../common/decorators/roles.decorator';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator';
import { UsuarioJwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('riesgos')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'riesgos', version: '1' })
export class RiesgosController {
  constructor(
    private readonly riesgosService: RiesgosService,
    private readonly exportacionService: ExportacionService,
  ) {}

  @Post()
  @Roles(RolSistema.ADMIN_CALIDAD, RolSistema.DIRECTOR_CALIDAD, RolSistema.JEFE_AREA)
  @ApiOperation({ summary: 'Registrar nuevo riesgo (nivel calculado automáticamente por P×I)' })
  crear(@Body() dto: CrearRiesgoDto, @UsuarioActual() u: UsuarioJwtPayload) {
    return this.riesgosService.crear(dto, u.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Listar matriz de riesgos con filtros' })
  findAll(@Query() filtros: FiltrarRiesgosDto) {
    return this.riesgosService.findAll(filtros);
  }

  @Get('mapa-calor')
  @ApiOperation({ summary: 'Datos agregados P×I para mapa de calor de riesgos' })
  mapaCalor() {
    return this.riesgosService.mapaCalor();
  }

  @Get('exportar/csv')
  @ApiOperation({ summary: 'Exportar riesgos a CSV' })
  async exportarCSV(@Res() res: Response) {
    const datos = await this.riesgosService.listarTodos();
    const columnas: ColumnaExportacion[] = [
      { titulo: 'Código', campo: 'codigo' },
      { titulo: 'Nombre', campo: 'nombre' },
      { titulo: 'Tipo', campo: 'tipo_riesgo' },
      { titulo: 'Probabilidad', campo: 'probabilidad' },
      { titulo: 'Impacto', campo: 'impacto' },
      { titulo: 'Nivel', campo: 'niveles_riesgo.codigo' },
      { titulo: 'Estado', campo: 'estados_flujo.codigo' },
      { titulo: 'Área', campo: 'areas.nombre' },
    ];
    const stream = this.exportacionService.generarCSV(datos, columnas, 'riesgos');
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="riesgos.csv"',
    });
    stream.getStream().pipe(res);
  }

  @Get('exportar/xlsx')
  @ApiOperation({ summary: 'Exportar riesgos a Excel' })
  async exportarXLSX(@Res() res: Response) {
    const datos = await this.riesgosService.listarTodos();
    const columnas: ColumnaExportacion[] = [
      { titulo: 'Código', campo: 'codigo' },
      { titulo: 'Nombre', campo: 'nombre' },
      { titulo: 'Tipo', campo: 'tipo_riesgo' },
      { titulo: 'Probabilidad', campo: 'probabilidad' },
      { titulo: 'Impacto', campo: 'impacto' },
      { titulo: 'Nivel', campo: 'niveles_riesgo.codigo' },
      { titulo: 'Estado', campo: 'estados_flujo.codigo' },
      { titulo: 'Área', campo: 'areas.nombre' },
    ];
    const stream = await this.exportacionService.generarXLSX(datos, columnas, 'riesgos', 'Riesgos');
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="riesgos.xlsx"',
    });
    stream.getStream().pipe(res);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de riesgo con planes de mitigación y seguimientos' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.riesgosService.findOne(id);
  }

  @Put(':id')
  @Roles(RolSistema.ADMIN_CALIDAD, RolSistema.DIRECTOR_CALIDAD, RolSistema.JEFE_AREA)
  @ApiOperation({ summary: 'Actualizar riesgo (recalcula nivel si cambia P o I)' })
  actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarRiesgoDto,
    @UsuarioActual() u: UsuarioJwtPayload,
  ) {
    return this.riesgosService.actualizar(id, dto, u.sub);
  }

  @Post(':id/mitigaciones')
  @Roles(RolSistema.ADMIN_CALIDAD, RolSistema.DIRECTOR_CALIDAD, RolSistema.JEFE_AREA)
  @ApiOperation({ summary: 'Crear plan de mitigación para el riesgo' })
  crearPlanMitigacion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CrearPlanMitigacionDto,
    @UsuarioActual() u: UsuarioJwtPayload,
  ) {
    return this.riesgosService.crearPlanMitigacion(id, dto, u.sub);
  }

  @Post(':id/seguimientos')
  @Roles(RolSistema.ADMIN_CALIDAD, RolSistema.JEFE_AREA, RolSistema.RESPONSABLE_PROCESO)
  @ApiOperation({ summary: 'Registrar seguimiento periódico del riesgo' })
  registrarSeguimiento(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RegistrarSeguimientoDto,
    @UsuarioActual() u: UsuarioJwtPayload,
  ) {
    return this.riesgosService.registrarSeguimiento(id, dto, u.sub);
  }
}
