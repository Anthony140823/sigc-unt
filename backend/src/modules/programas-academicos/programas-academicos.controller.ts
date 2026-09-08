import { Controller, Get, Post, Put, Patch, Body, Param, Query, Res, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { ExportacionService, ColumnaExportacion } from '../../common/services/exportacion.service';
import { ProgramasAcademicosService } from './programas-academicos.service';
import { CrearProgramaAcademicoDto } from './dto/crear-programa-academico.dto';
import { ActualizarProgramaAcademicoDto } from './dto/actualizar-programa-academico.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, RolSistema } from '../../common/decorators/roles.decorator';

@ApiTags('programas-academicos')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'programas-academicos', version: '1' })
export class ProgramasAcademicosController {
  constructor(
    private readonly programasAcademicosService: ProgramasAcademicosService,
    private readonly exportacionService: ExportacionService,
  ) {}

  @Post()
  @Roles(RolSistema.SUPERADMIN, RolSistema.ADMIN_CALIDAD)
  @ApiOperation({ summary: 'Crear nuevo programa académico' })
  crear(@Body() dto: CrearProgramaAcademicoDto) {
    return this.programasAcademicosService.crear(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar programas académicos' })
  @ApiQuery({ name: 'soloActivos', required: false, type: Boolean })
  findAll(@Query('soloActivos') soloActivos?: string) {
    return this.programasAcademicosService.findAll(soloActivos !== 'false');
  }

  @Get('exportar/csv')
  @ApiOperation({ summary: 'Exportar programas académicos a CSV' })
  async exportarCSV(@Res() res: Response) {
    const datos = await this.programasAcademicosService.findAll();
    const columnas: ColumnaExportacion[] = [
      { titulo: 'Código', campo: 'codigo' },
      { titulo: 'Nombre', campo: 'nombre' },
      { titulo: 'Nivel', campo: 'nivel' },
      { titulo: 'Modalidad', campo: 'modalidad' },
      { titulo: 'Facultad', campo: 'facultades.nombre' },
      { titulo: 'Activo', campo: 'esta_activo' },
    ];
    const stream = this.exportacionService.generarCSV(datos, columnas, 'programas-academicos');
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="programas-academicos.csv"',
    });
    stream.getStream().pipe(res);
  }

  @Get('exportar/xlsx')
  @ApiOperation({ summary: 'Exportar programas académicos a Excel' })
  async exportarXLSX(@Res() res: Response) {
    const datos = await this.programasAcademicosService.findAll();
    const columnas: ColumnaExportacion[] = [
      { titulo: 'Código', campo: 'codigo' },
      { titulo: 'Nombre', campo: 'nombre' },
      { titulo: 'Nivel', campo: 'nivel' },
      { titulo: 'Modalidad', campo: 'modalidad' },
      { titulo: 'Facultad', campo: 'facultades.nombre' },
      { titulo: 'Activo', campo: 'esta_activo' },
    ];
    const stream = await this.exportacionService.generarXLSX(datos, columnas, 'programas-academicos', 'Programas');
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="programas-academicos.xlsx"',
    });
    stream.getStream().pipe(res);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de programa académico' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.programasAcademicosService.findOne(id);
  }

  @Put(':id')
  @Roles(RolSistema.SUPERADMIN, RolSistema.ADMIN_CALIDAD)
  @ApiOperation({ summary: 'Actualizar programa académico' })
  actualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ActualizarProgramaAcademicoDto) {
    return this.programasAcademicosService.actualizar(id, dto);
  }

  @Patch(':id/toggle-activo')
  @Roles(RolSistema.SUPERADMIN, RolSistema.ADMIN_CALIDAD)
  @ApiOperation({ summary: 'Activar/desactivar programa académico' })
  toggleActivo(@Param('id', ParseUUIDPipe) id: string) {
    return this.programasAcademicosService.toggleActivo(id);
  }
}
