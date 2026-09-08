import { Controller, Get, Post, Put, Body, Param, Query, Res, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { ExportacionService, ColumnaExportacion } from '../../common/services/exportacion.service';
import { FacultadesService } from './facultades.service';
import { CrearFacultadDto } from './dto/crear-facultad.dto';
import { ActualizarFacultadDto } from './dto/actualizar-facultad.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, RolSistema } from '../../common/decorators/roles.decorator';

@ApiTags('facultades')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'facultades', version: '1' })
export class FacultadesController {
  constructor(
    private readonly facultadesService: FacultadesService,
    private readonly exportacionService: ExportacionService,
  ) {}

  @Post()
  @Roles(RolSistema.SUPERADMIN, RolSistema.ADMIN_CALIDAD)
  @ApiOperation({ summary: 'Crear nueva facultad' })
  crear(@Body() dto: CrearFacultadDto) {
    return this.facultadesService.crear(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar facultades' })
  @ApiQuery({ name: 'soloActivos', required: false, type: Boolean })
  findAll(@Query('soloActivos') soloActivos?: string) {
    return this.facultadesService.findAll(soloActivos !== 'false');
  }

  @Get('exportar/csv')
  @ApiOperation({ summary: 'Exportar facultades a CSV' })
  async exportarCSV(@Res() res: Response) {
    const datos = await this.facultadesService.findAll();
    const columnas: ColumnaExportacion[] = [
      { titulo: 'Código', campo: 'codigo' },
      { titulo: 'Nombre', campo: 'nombre' },
      { titulo: 'Nombre Corto', campo: 'nombre_corto' },
      { titulo: 'Decano', campo: 'decano_nombre' },
      { titulo: 'Email', campo: 'email' },
      { titulo: 'Activo', campo: 'esta_activo' },
    ];
    const stream = this.exportacionService.generarCSV(datos, columnas, 'facultades');
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="facultades.csv"',
    });
    stream.getStream().pipe(res);
  }

  @Get('exportar/xlsx')
  @ApiOperation({ summary: 'Exportar facultades a Excel' })
  async exportarXLSX(@Res() res: Response) {
    const datos = await this.facultadesService.findAll();
    const columnas: ColumnaExportacion[] = [
      { titulo: 'Código', campo: 'codigo' },
      { titulo: 'Nombre', campo: 'nombre' },
      { titulo: 'Nombre Corto', campo: 'nombre_corto' },
      { titulo: 'Decano', campo: 'decano_nombre' },
      { titulo: 'Email', campo: 'email' },
      { titulo: 'Activo', campo: 'esta_activo' },
    ];
    const stream = await this.exportacionService.generarXLSX(datos, columnas, 'facultades', 'Facultades');
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="facultades.xlsx"',
    });
    stream.getStream().pipe(res);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de facultad con programas y áreas' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.facultadesService.findOne(id);
  }

  @Put(':id')
  @Roles(RolSistema.SUPERADMIN, RolSistema.ADMIN_CALIDAD)
  @ApiOperation({ summary: 'Actualizar facultad' })
  actualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ActualizarFacultadDto) {
    return this.facultadesService.actualizar(id, dto);
  }
}
