import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CatalogosService } from './catalogos.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, RolSistema } from '../../common/decorators/roles.decorator';
import {
  CrearRolDto, ActualizarRolDto,
  CrearTipoDocumentoDto, ActualizarTipoDocumentoDto,
  CrearFrecuenciaDto, ActualizarFrecuenciaDto,
  CrearTipoAuditoriaDto, ActualizarTipoAuditoriaDto,
  CrearEstandarDto, ActualizarEstandarDto,
  CrearObjetivoEstrategicoDto, ActualizarObjetivoEstrategicoDto,
} from './dto/crear-catalogo.dto';

@ApiTags('catalogos')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'catalogos', version: '1' })
export class CatalogosController {
  constructor(private readonly catalogosService: CatalogosService) {}

  // ── TIPOS DOCUMENTO ──────────────────────────────────
  @Get('tipos-documento')
  @ApiOperation({ summary: 'Listar tipos de documento' })
  listarTiposDocumento() { return this.catalogosService.listarTiposDocumento(); }

  @Post('tipos-documento')
  @UseGuards(RolesGuard)
  @Roles(RolSistema.SUPERADMIN, RolSistema.ADMIN_CALIDAD)
  @ApiOperation({ summary: 'Crear tipo de documento' })
  crearTipoDocumento(@Body() dto: CrearTipoDocumentoDto) { return this.catalogosService.crearTipoDocumento(dto); }

  @Patch('tipos-documento/:id')
  @UseGuards(RolesGuard)
  @Roles(RolSistema.SUPERADMIN, RolSistema.ADMIN_CALIDAD)
  @ApiOperation({ summary: 'Actualizar tipo de documento' })
  actualizarTipoDocumento(@Param('id', ParseIntPipe) id: number, @Body() dto: ActualizarTipoDocumentoDto) {
    return this.catalogosService.actualizarTipoDocumento(id, dto);
  }

  @Delete('tipos-documento/:id')
  @UseGuards(RolesGuard)
  @Roles(RolSistema.SUPERADMIN, RolSistema.ADMIN_CALIDAD)
  @ApiOperation({ summary: 'Eliminar tipo de documento' })
  eliminarTipoDocumento(@Param('id', ParseIntPipe) id: number) {
    return this.catalogosService.eliminarTipoDocumento(id);
  }

  // ── FRECUENCIAS MEDICIÓN ────────────────────────────
  @Get('frecuencias-medicion')
  @ApiOperation({ summary: 'Listar frecuencias de medición' })
  listarFrecuenciasMedicion() { return this.catalogosService.listarFrecuenciasMedicion(); }

  @Post('frecuencias-medicion')
  @UseGuards(RolesGuard)
  @Roles(RolSistema.SUPERADMIN, RolSistema.ADMIN_CALIDAD)
  @ApiOperation({ summary: 'Crear frecuencia de medición' })
  crearFrecuencia(@Body() dto: CrearFrecuenciaDto) { return this.catalogosService.crearFrecuencia(dto); }

  @Patch('frecuencias-medicion/:id')
  @UseGuards(RolesGuard)
  @Roles(RolSistema.SUPERADMIN, RolSistema.ADMIN_CALIDAD)
  @ApiOperation({ summary: 'Actualizar frecuencia de medición' })
  actualizarFrecuencia(@Param('id', ParseIntPipe) id: number, @Body() dto: ActualizarFrecuenciaDto) {
    return this.catalogosService.actualizarFrecuencia(id, dto);
  }

  @Delete('frecuencias-medicion/:id')
  @UseGuards(RolesGuard)
  @Roles(RolSistema.SUPERADMIN, RolSistema.ADMIN_CALIDAD)
  @ApiOperation({ summary: 'Eliminar frecuencia de medición' })
  eliminarFrecuencia(@Param('id', ParseIntPipe) id: number) {
    return this.catalogosService.eliminarFrecuencia(id);
  }

  // ── TIPOS AUDITORÍA ────────────────────────────────
  @Get('tipos-auditoria')
  @ApiOperation({ summary: 'Listar tipos de auditoría' })
  listarTiposAuditoria() { return this.catalogosService.listarTiposAuditoria(); }

  @Post('tipos-auditoria')
  @UseGuards(RolesGuard)
  @Roles(RolSistema.SUPERADMIN, RolSistema.ADMIN_CALIDAD)
  @ApiOperation({ summary: 'Crear tipo de auditoría' })
  crearTipoAuditoria(@Body() dto: CrearTipoAuditoriaDto) { return this.catalogosService.crearTipoAuditoria(dto); }

  @Patch('tipos-auditoria/:id')
  @UseGuards(RolesGuard)
  @Roles(RolSistema.SUPERADMIN, RolSistema.ADMIN_CALIDAD)
  @ApiOperation({ summary: 'Actualizar tipo de auditoría' })
  actualizarTipoAuditoria(@Param('id', ParseIntPipe) id: number, @Body() dto: ActualizarTipoAuditoriaDto) {
    return this.catalogosService.actualizarTipoAuditoria(id, dto);
  }

  @Delete('tipos-auditoria/:id')
  @UseGuards(RolesGuard)
  @Roles(RolSistema.SUPERADMIN, RolSistema.ADMIN_CALIDAD)
  @ApiOperation({ summary: 'Eliminar tipo de auditoría' })
  eliminarTipoAuditoria(@Param('id', ParseIntPipe) id: number) {
    return this.catalogosService.eliminarTipoAuditoria(id);
  }

  // ── ESTÁNDARES ACREDITACIÓN ─────────────────────────
  @Get('estandares-acreditacion')
  @ApiOperation({ summary: 'Listar estándares de acreditación' })
  listarEstandaresAcreditacion() { return this.catalogosService.listarEstandaresAcreditacion(); }

  @Post('estandares-acreditacion')
  @UseGuards(RolesGuard)
  @Roles(RolSistema.SUPERADMIN, RolSistema.ADMIN_CALIDAD)
  @ApiOperation({ summary: 'Crear estándar de acreditación' })
  crearEstandar(@Body() dto: CrearEstandarDto) { return this.catalogosService.crearEstandar(dto); }

  @Patch('estandares-acreditacion/:id')
  @UseGuards(RolesGuard)
  @Roles(RolSistema.SUPERADMIN, RolSistema.ADMIN_CALIDAD)
  @ApiOperation({ summary: 'Actualizar estándar de acreditación' })
  actualizarEstandar(@Param('id', ParseIntPipe) id: number, @Body() dto: ActualizarEstandarDto) {
    return this.catalogosService.actualizarEstandar(id, dto);
  }

  @Delete('estandares-acreditacion/:id')
  @UseGuards(RolesGuard)
  @Roles(RolSistema.SUPERADMIN, RolSistema.ADMIN_CALIDAD)
  @ApiOperation({ summary: 'Eliminar estándar de acreditación' })
  eliminarEstandar(@Param('id', ParseIntPipe) id: number) {
    return this.catalogosService.eliminarEstandar(id);
  }

  // ── OBJETIVOS ESTRATÉGICOS ──────────────────────────
  @Get('objetivos-estrategicos')
  @ApiOperation({ summary: 'Listar objetivos estratégicos' })
  listarObjetivosEstrategicos() { return this.catalogosService.listarObjetivosEstrategicos(); }

  @Post('objetivos-estrategicos')
  @UseGuards(RolesGuard)
  @Roles(RolSistema.SUPERADMIN, RolSistema.ADMIN_CALIDAD)
  @ApiOperation({ summary: 'Crear objetivo estratégico' })
  crearObjetivo(@Body() dto: CrearObjetivoEstrategicoDto) { return this.catalogosService.crearObjetivo(dto); }

  @Patch('objetivos-estrategicos/:id')
  @UseGuards(RolesGuard)
  @Roles(RolSistema.SUPERADMIN, RolSistema.ADMIN_CALIDAD)
  @ApiOperation({ summary: 'Actualizar objetivo estratégico' })
  actualizarObjetivo(@Param('id') id: string, @Body() dto: ActualizarObjetivoEstrategicoDto) {
    return this.catalogosService.actualizarObjetivo(id, dto);
  }

  @Delete('objetivos-estrategicos/:id')
  @UseGuards(RolesGuard)
  @Roles(RolSistema.SUPERADMIN, RolSistema.ADMIN_CALIDAD)
  @ApiOperation({ summary: 'Eliminar objetivo estratégico' })
  eliminarObjetivo(@Param('id') id: string) {
    return this.catalogosService.eliminarObjetivo(id);
  }

  // ── ROLES ───────────────────────────────────────────
  @Get('roles')
  @ApiOperation({ summary: 'Listar roles del sistema' })
  listarRoles() { return this.catalogosService.listarRoles(); }

  @Post('roles')
  @UseGuards(RolesGuard)
  @Roles(RolSistema.SUPERADMIN, RolSistema.ADMIN_CALIDAD)
  @ApiOperation({ summary: 'Crear rol' })
  crearRol(@Body() dto: CrearRolDto) { return this.catalogosService.crearRol(dto); }

  @Patch('roles/:id')
  @UseGuards(RolesGuard)
  @Roles(RolSistema.SUPERADMIN, RolSistema.ADMIN_CALIDAD)
  @ApiOperation({ summary: 'Actualizar rol' })
  actualizarRol(@Param('id', ParseIntPipe) id: number, @Body() dto: ActualizarRolDto) {
    return this.catalogosService.actualizarRol(id, dto);
  }

  @Delete('roles/:id')
  @UseGuards(RolesGuard)
  @Roles(RolSistema.SUPERADMIN, RolSistema.ADMIN_CALIDAD)
  @ApiOperation({ summary: 'Eliminar rol' })
  eliminarRol(@Param('id', ParseIntPipe) id: number) {
    return this.catalogosService.eliminarRol(id);
  }

  // ── PROGRAMAS ACADÉMICOS (read-only) ────────────────
  @Get('programas-academicos')
  @ApiOperation({ summary: 'Listar programas académicos activos' })
  listarProgramasAcademicos() { return this.catalogosService.listarProgramasAcademicos(); }

  // ── FACTORES ESTÁNDAR ──────────────────────────────
  @Get('factores-estandar')
  @ApiOperation({ summary: 'Listar factores de estándar (opcional: filtrar por estandar_id)' })
  listarFactoresEstandar() { return this.catalogosService.listarFactoresEstandar(); }

  @Get('factores-estandar/:estandarId')
  @ApiOperation({ summary: 'Obtener factores de un estándar específico' })
  obtenerFactoresPorEstandar(@Param('estandarId', ParseIntPipe) estandarId: number) {
    return this.catalogosService.obtenerFactoresPorEstandar(estandarId);
  }
}
