// src/modules/areas/areas.controller.ts
// ================================================================
import { Controller, Get, Post, Put, Body, Param, Query, Res, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { ExportacionService, ColumnaExportacion } from '../../common/services/exportacion.service';
import { AreasService } from './areas.service';
import { CrearAreaDto } from './dto/crear-area.dto';
import { ActualizarAreaDto } from './dto/actualizar-area.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, RolSistema } from '../../common/decorators/roles.decorator';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator';
import { UsuarioJwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('areas')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'areas', version: '1' })
export class AreasController {
  constructor(
    private readonly areasService: AreasService,
    private readonly exportacionService: ExportacionService,
  ) {}

  @Post()
  @Roles(RolSistema.SUPERADMIN, RolSistema.ADMIN_CALIDAD)
  @ApiOperation({ summary: 'Crear nueva área organizacional' })
  crear(@Body() dto: CrearAreaDto, @UsuarioActual() u: UsuarioJwtPayload) {
    return this.areasService.crear(dto, u.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Listar áreas organizacionales' })
  @ApiQuery({ name: 'soloActivos', required: false, type: Boolean })
  findAll(@Query('soloActivos') soloActivos?: string) {
    return this.areasService.findAll(soloActivos !== 'false');
  }

  @Get('exportar/csv')
  @ApiOperation({ summary: 'Exportar áreas a CSV' })
  async exportarCSV(@Res() res: Response) {
    const datos = await this.areasService.findAll();
    const columnas: ColumnaExportacion[] = [
      { titulo: 'Código', campo: 'codigo' },
      { titulo: 'Nombre', campo: 'nombre' },
      { titulo: 'Nombre Corto', campo: 'nombre_corto' },
      { titulo: 'Activo', campo: 'esta_activo' },
    ];
    const stream = this.exportacionService.generarCSV(datos, columnas, 'areas');
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="areas.csv"',
    });
    stream.getStream().pipe(res);
  }

  @Get('exportar/xlsx')
  @ApiOperation({ summary: 'Exportar áreas a Excel' })
  async exportarXLSX(@Res() res: Response) {
    const datos = await this.areasService.findAll();
    const columnas: ColumnaExportacion[] = [
      { titulo: 'Código', campo: 'codigo' },
      { titulo: 'Nombre', campo: 'nombre' },
      { titulo: 'Nombre Corto', campo: 'nombre_corto' },
      { titulo: 'Activo', campo: 'esta_activo' },
    ];
    const stream = await this.exportacionService.generarXLSX(datos, columnas, 'areas', 'Áreas');
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="areas.xlsx"',
    });
    stream.getStream().pipe(res);
  }

  @Get('arbol')
  @ApiOperation({ summary: 'Estructura jerárquica de áreas para menú y selects' })
  arbol() {
    return this.areasService.arbolJerarquico();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle del área con usuarios y métricas' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.areasService.findOne(id);
  }

  @Put(':id')
  @Roles(RolSistema.SUPERADMIN, RolSistema.ADMIN_CALIDAD)
  @ApiOperation({ summary: 'Actualizar área organizacional' })
  actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarAreaDto,
    @UsuarioActual() u: UsuarioJwtPayload,
  ) {
    return this.areasService.actualizar(id, dto, u.sub);
  }
}

// ================================================================
