// src/modules/encuestas/encuestas.controller.ts
import {
  Controller, Get, Post, Patch, Body, Param,
  Query, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus, Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ExportacionService, ColumnaExportacion } from '../../common/services/exportacion.service';
import { EncuestasService } from './encuestas.service';
import { CrearEncuestaDto } from './dto/crear-encuesta.dto';
import { CrearSeccionDto } from './dto/crear-seccion.dto';
import { CrearPreguntaDto } from './dto/crear-pregunta.dto';
import { ResponderEncuestaDto } from './dto/responder-encuesta.dto';
import { FiltrarEncuestasDto } from './dto/filtrar-encuestas.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, RolSistema, Publico } from '../../common/decorators/roles.decorator';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator';
import { UsuarioJwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('encuestas')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'encuestas', version: '1' })
export class EncuestasController {
  constructor(
    private readonly encuestasService: EncuestasService,
    private readonly exportacionService: ExportacionService,
  ) {}

  @Post()
  @Roles(RolSistema.ADMIN_CALIDAD, RolSistema.DIRECTOR_CALIDAD, RolSistema.JEFE_AREA)
  @ApiOperation({ summary: 'Crear nueva encuesta en estado Diseño' })
  crear(@Body() dto: CrearEncuestaDto, @UsuarioActual() u: UsuarioJwtPayload) {
    return this.encuestasService.crear(dto, u.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Listar encuestas con filtros' })
  findAll(@Query() filtros: FiltrarEncuestasDto) {
    return this.encuestasService.findAll(filtros);
  }

  @Get('exportar/csv')
  @ApiOperation({ summary: 'Exportar encuestas a CSV' })
  async exportarCSV(@Res() res: Response) {
    const datos = await this.encuestasService.listarTodos();
    const columnas: ColumnaExportacion[] = [
      { titulo: 'Título', campo: 'titulo' },
      { titulo: 'Descripción', campo: 'descripcion' },
      { titulo: 'Estado', campo: 'estados_flujo.codigo' },
      { titulo: 'Programa', campo: 'programas_academicos.nombre' },
      { titulo: 'Fecha Inicio', campo: 'fecha_inicio' },
      { titulo: 'Fecha Fin', campo: 'fecha_fin' },
    ];
    const stream = this.exportacionService.generarCSV(datos, columnas, 'encuestas');
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="encuestas.csv"',
    });
    stream.getStream().pipe(res);
  }

  @Get('exportar/xlsx')
  @ApiOperation({ summary: 'Exportar encuestas a Excel' })
  async exportarXLSX(@Res() res: Response) {
    const datos = await this.encuestasService.listarTodos();
    const columnas: ColumnaExportacion[] = [
      { titulo: 'Título', campo: 'titulo' },
      { titulo: 'Descripción', campo: 'descripcion' },
      { titulo: 'Estado', campo: 'estados_flujo.codigo' },
      { titulo: 'Programa', campo: 'programas_academicos.nombre' },
      { titulo: 'Fecha Inicio', campo: 'fecha_inicio' },
      { titulo: 'Fecha Fin', campo: 'fecha_fin' },
    ];
    const stream = await this.exportacionService.generarXLSX(datos, columnas, 'encuestas', 'Encuestas');
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="encuestas.xlsx"',
    });
    stream.getStream().pipe(res);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de encuesta con secciones y preguntas' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.encuestasService.findOne(id);
  }

  @Patch(':id/publicar')
  @Roles(RolSistema.ADMIN_CALIDAD, RolSistema.DIRECTOR_CALIDAD)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publicar encuesta (Diseño → Activa)' })
  publicar(@Param('id', ParseUUIDPipe) id: string, @UsuarioActual() u: UsuarioJwtPayload) {
    return this.encuestasService.publicar(id, u.sub);
  }

  @Patch(':id/cerrar')
  @Roles(RolSistema.ADMIN_CALIDAD, RolSistema.DIRECTOR_CALIDAD)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar encuesta (deja de recibir respuestas)' })
  cerrar(@Param('id', ParseUUIDPipe) id: string, @UsuarioActual() u: UsuarioJwtPayload) {
    return this.encuestasService.cerrar(id, u.sub);
  }

  // ─── Diseño: Secciones y Preguntas ────────────────────

  @Post(':id/secciones')
  @Roles(RolSistema.ADMIN_CALIDAD, RolSistema.JEFE_AREA)
  @ApiOperation({ summary: 'Agregar sección a la encuesta' })
  crearSeccion(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CrearSeccionDto) {
    return this.encuestasService.crearSeccion(id, dto);
  }

  @Post('secciones/:seccionId/preguntas')
  @Roles(RolSistema.ADMIN_CALIDAD, RolSistema.JEFE_AREA)
  @ApiOperation({ summary: 'Agregar pregunta a una sección' })
  crearPregunta(
    @Param('seccionId', ParseUUIDPipe) seccionId: string,
    @Body() dto: CrearPreguntaDto,
  ) {
    return this.encuestasService.crearPregunta(seccionId, dto);
  }

  // ─── Participación ─────────────────────────────────────

  @Post(':id/token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener token de participación',
    description: 'Para encuestas anónimas genera un token único. Para encuestas no anónimas verifica que el usuario no haya respondido ya.',
  })
  generarToken(
    @Param('id', ParseUUIDPipe) id: string,
    @UsuarioActual() u: UsuarioJwtPayload,
  ) {
    return this.encuestasService.generarTokenParticipacion(id, u.sub);
  }

  @Post('participaciones/:participacionId/responder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Enviar respuestas a la encuesta',
    description: 'Se puede llamar múltiples veces (guardado parcial). Usar es_envio_final=true para completar.',
  })
  responder(
    @Param('participacionId', ParseUUIDPipe) participacionId: string,
    @Body() dto: ResponderEncuestaDto,
  ) {
    return this.encuestasService.responder(participacionId, dto);
  }

  // ─── Resultados ────────────────────────────────────────

  @Get(':id/resultados')
  @Roles(RolSistema.ADMIN_CALIDAD, RolSistema.DIRECTOR_CALIDAD, RolSistema.JEFE_AREA)
  @ApiOperation({ summary: 'Obtener resultados estadísticos de la encuesta' })
  resultados(@Param('id', ParseUUIDPipe) id: string) {
    return this.encuestasService.obtenerResultados(id);
  }
}
