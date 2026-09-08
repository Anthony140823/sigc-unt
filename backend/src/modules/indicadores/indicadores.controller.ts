// src/modules/indicadores/indicadores.controller.ts
import {
  Controller, Get, Post, Put, Patch, Body, Param,
  Query, UseGuards, ParseUUIDPipe, ParseIntPipe, HttpCode, HttpStatus, Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { ExportacionService, ColumnaExportacion } from '../../common/services/exportacion.service';
import { IndicadoresService } from './indicadores.service';
import { CrearIndicadorDto } from './dto/crear-indicador.dto';
import { ActualizarIndicadorDto } from './dto/actualizar-indicador.dto';
import { FiltrarIndicadoresDto } from './dto/filtrar-indicadores.dto';
import { RegistrarMedicionDto } from './dto/registrar-medicion.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, RolSistema } from '../../common/decorators/roles.decorator';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator';
import { UsuarioJwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('indicadores')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'indicadores', version: '1' })
export class IndicadoresController {
  constructor(
    private readonly indicadoresService: IndicadoresService,
    private readonly exportacionService: ExportacionService,
  ) {}

  @Post()
  @Roles(RolSistema.ADMIN_CALIDAD, RolSistema.DIRECTOR_CALIDAD)
  @ApiOperation({ summary: 'Definir nuevo indicador de gestión (KPI)' })
  crear(@Body() dto: CrearIndicadorDto, @UsuarioActual() u: UsuarioJwtPayload) {
    return this.indicadoresService.crear(dto, u.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Listar indicadores con última medición y semáforo' })
  findAll(@Query() filtros: FiltrarIndicadoresDto) {
    return this.indicadoresService.findAll(filtros);
  }

  @Get('semaforos')
  @ApiOperation({ summary: 'Resumen de semáforos (conteo verde/amarillo/rojo) del último mes' })
  resumenSemaforos() {
    return this.indicadoresService.resumenSemaforos();
  }

  @Get('exportar/csv')
  @ApiOperation({ summary: 'Exportar indicadores a CSV' })
  async exportarCSV(@Res() res: Response) {
    const datos = await this.indicadoresService.listarTodos();
    const columnas: ColumnaExportacion[] = [
      { titulo: 'Código', campo: 'codigo' },
      { titulo: 'Nombre', campo: 'nombre' },
      { titulo: 'Unidad Medida', campo: 'unidad_medida' },
      { titulo: 'Meta', campo: 'meta_valor' },
      { titulo: 'Proceso', campo: 'procesos.nombre' },
      { titulo: 'Área Responsable', campo: 'areas.nombre' },
    ];
    const stream = this.exportacionService.generarCSV(datos, columnas, 'indicadores');
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="indicadores.csv"',
    });
    stream.getStream().pipe(res);
  }

  @Get('exportar/xlsx')
  @ApiOperation({ summary: 'Exportar indicadores a Excel' })
  async exportarXLSX(@Res() res: Response) {
    const datos = await this.indicadoresService.listarTodos();
    const columnas: ColumnaExportacion[] = [
      { titulo: 'Código', campo: 'codigo' },
      { titulo: 'Nombre', campo: 'nombre' },
      { titulo: 'Unidad Medida', campo: 'unidad_medida' },
      { titulo: 'Meta', campo: 'meta_valor' },
      { titulo: 'Proceso', campo: 'procesos.nombre' },
      { titulo: 'Área Responsable', campo: 'areas.nombre' },
    ];
    const stream = await this.exportacionService.generarXLSX(datos, columnas, 'indicadores', 'Indicadores');
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="indicadores.xlsx"',
    });
    stream.getStream().pipe(res);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener indicador con historial de mediciones (últimas 12)' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.indicadoresService.findOne(id);
  }

  @Put(':id')
  @Roles(RolSistema.ADMIN_CALIDAD, RolSistema.DIRECTOR_CALIDAD)
  @ApiOperation({ summary: 'Actualizar definición del indicador' })
  actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarIndicadorDto,
    @UsuarioActual() u: UsuarioJwtPayload,
  ) {
    return this.indicadoresService.actualizar(id, dto, u.sub);
  }

  @Post(':id/mediciones')
  @Roles(RolSistema.ADMIN_CALIDAD, RolSistema.JEFE_AREA, RolSistema.DIGITADOR, RolSistema.RESPONSABLE_PROCESO)
  @ApiOperation({
    summary: 'Registrar medición del indicador',
    description: 'El semáforo se calcula automáticamente comparando valor_real vs meta.',
  })
  registrarMedicion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RegistrarMedicionDto,
    @UsuarioActual() u: UsuarioJwtPayload,
  ) {
    return this.indicadoresService.registrarMedicion(id, dto, u.sub);
  }

  @Patch('mediciones/:medicionId/validar')
  @Roles(RolSistema.ADMIN_CALIDAD, RolSistema.DIRECTOR_CALIDAD, RolSistema.JEFE_AREA)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validar medición registrada (confirma el dato)' })
  validarMedicion(
    @Param('medicionId', ParseIntPipe) medicionId: number,
    @UsuarioActual() u: UsuarioJwtPayload,
  ) {
    return this.indicadoresService.validarMedicion(medicionId, u.sub);
  }

  @Get(':id/historial')
  @ApiOperation({ summary: 'Historial completo de mediciones para gráficos de tendencia' })
  @ApiQuery({ name: 'meses', required: false, description: 'Número de meses hacia atrás (default: 12)' })
  obtenerHistorial(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('meses') meses?: string,
  ) {
    return this.indicadoresService.obtenerHistorial(id, meses ? parseInt(meses) : 12);
  }
}
