// src/modules/acreditacion/acreditacion.controller.ts
import {
  Controller, Get, Post, Patch, Body, Param,
  Query, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AcreditacionService } from './acreditacion.service';
import { IniciarProcesoDto } from './dto/iniciar-proceso.dto';
import { RegistrarAutoevaluacionDto } from './dto/registrar-autoevaluacion.dto';
import { SubirEvidenciaDto } from './dto/subir-evidencia.dto';
import { FiltrarAcreditacionDto } from './dto/filtrar-acreditacion.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, RolSistema } from '../../common/decorators/roles.decorator';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator';
import { UsuarioJwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('acreditacion')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'acreditacion', version: '1' })
export class AcreditacionController {
  constructor(private readonly acreditacionService: AcreditacionService) {}

  // ─── Procesos ──────────────────────────────────────────

  @Post('procesos')
  @Roles(RolSistema.ADMIN_CALIDAD, RolSistema.DIRECTOR_CALIDAD)
  @ApiOperation({ summary: 'Iniciar proceso de acreditación para un programa académico' })
  iniciarProceso(@Body() dto: IniciarProcesoDto, @UsuarioActual() u: UsuarioJwtPayload) {
    return this.acreditacionService.iniciarProceso(dto, u.sub);
  }

  @Get('procesos')
  @ApiOperation({ summary: 'Listar procesos de acreditación activos e históricos' })
  findAllProcesos(@Query() filtros: FiltrarAcreditacionDto) {
    return this.acreditacionService.findAllProcesos(filtros);
  }

  @Get('procesos/cronograma')
  @ApiOperation({ summary: 'Cronograma de procesos activos con alertas de visita y vencimiento' })
  cronograma() {
    return this.acreditacionService.cronogramaAcreditacion();
  }

  @Get('procesos/:id')
  @ApiOperation({ summary: 'Detalle completo del proceso con factores, criterios y autoevaluaciones' })
  findOneProceso(@Param('id', ParseUUIDPipe) id: string) {
    return this.acreditacionService.findOneProceso(id);
  }

  @Patch('procesos/:id/estado')
  @Roles(RolSistema.ADMIN_CALIDAD, RolSistema.DIRECTOR_CALIDAD)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cambiar estado del proceso',
    description: 'PLANIFICACION → AUTOEVALUACION → INFORME_PREVIO → VISITA_EXTERNA → ACREDITADO | NO_ACREDITADO',
  })
  cambiarEstado(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('estado_codigo') estadoCodigo: string,
    @UsuarioActual() u: UsuarioJwtPayload,
  ) {
    return this.acreditacionService.cambiarEstado(id, estadoCodigo, u.sub);
  }

  // ─── Autoevaluaciones ──────────────────────────────────

  @Post('procesos/:procesoId/autoevaluacion/:criterioId')
  @Roles(RolSistema.ADMIN_CALIDAD, RolSistema.DIRECTOR_CALIDAD, RolSistema.JEFE_AREA, RolSistema.RESPONSABLE_PROCESO)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Registrar/actualizar autoevaluación de un criterio',
    description: 'Operación upsert: crea si no existe, actualiza si ya existe. Recalcula puntuación total del proceso automáticamente.',
  })
  registrarAutoevaluacion(
    @Param('procesoId', ParseUUIDPipe) procesoId: string,
    @Param('criterioId', ParseUUIDPipe) criterioId: string,
    @Body() dto: RegistrarAutoevaluacionDto,
    @UsuarioActual() u: UsuarioJwtPayload,
  ) {
    return this.acreditacionService.registrarAutoevaluacion(procesoId, criterioId, dto, u.sub);
  }

  @Get('procesos/:id/matriz-cumplimiento')
  @ApiOperation({
    summary: 'Matriz de cumplimiento del proceso',
    description: 'Retorna todos los factores y criterios con su estado de autoevaluación, avance por factor y puntuaciones.',
  })
  matrizCumplimiento(@Param('id', ParseUUIDPipe) id: string) {
    return this.acreditacionService.obtenerMatrizCumplimiento(id);
  }

  // ─── Evidencias ────────────────────────────────────────

  @Post('evidencias')
  @Roles(
    RolSistema.ADMIN_CALIDAD, RolSistema.DIRECTOR_CALIDAD,
    RolSistema.JEFE_AREA, RolSistema.RESPONSABLE_PROCESO, RolSistema.DIGITADOR,
  )
  @ApiOperation({
    summary: 'Registrar evidencia (polimórfica)',
    description: 'entidad_tipo puede ser: AUTOEVALUACION, HALLAZGO, CAPA_ACCION, INSPECCION, MEDICION, DOCUMENTO',
  })
  registrarEvidencia(@Body() dto: SubirEvidenciaDto, @UsuarioActual() u: UsuarioJwtPayload) {
    return this.acreditacionService.registrarEvidencia(dto, u.sub);
  }

  @Get('evidencias/:entidadTipo/:entidadId')
  @ApiOperation({ summary: 'Listar evidencias de una entidad específica' })
  @ApiParam({ name: 'entidadTipo', description: 'AUTOEVALUACION | HALLAZGO | CAPA_ACCION | MEDICION' })
  @ApiParam({ name: 'entidadId', description: 'UUID de la entidad' })
  obtenerEvidencias(
    @Param('entidadTipo') entidadTipo: string,
    @Param('entidadId', ParseUUIDPipe) entidadId: string,
  ) {
    return this.acreditacionService.obtenerEvidencias(entidadTipo, entidadId);
  }
}
