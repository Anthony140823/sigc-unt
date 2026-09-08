// src/modules/usuarios/usuarios.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ExportacionService, ColumnaExportacion } from '../../common/services/exportacion.service';
import { UsuariosService } from './usuarios.service';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { FiltrarUsuariosDto } from './dto/filtrar-usuarios.dto';
import { AsignarRolDto } from './dto/asignar-rol.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, RolSistema } from '../../common/decorators/roles.decorator';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator';
import { UsuarioJwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('usuarios')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'usuarios', version: '1' })
export class UsuariosController {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly exportacionService: ExportacionService,
  ) {}

  @Post()
  @Roles(RolSistema.SUPERADMIN, RolSistema.ADMIN_CALIDAD)
  @ApiOperation({ summary: 'Crear nuevo usuario del SIGC' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente.' })
  @ApiResponse({ status: 409, description: 'Username o email ya en uso.' })
  crear(
    @Body() dto: CrearUsuarioDto,
    @UsuarioActual() usuario: UsuarioJwtPayload,
  ) {
    return this.usuariosService.crear(dto, usuario.sub);
  }

  @Get()
  @Roles(RolSistema.SUPERADMIN, RolSistema.ADMIN_CALIDAD, RolSistema.DIRECTOR_CALIDAD)
  @ApiOperation({ summary: 'Listar usuarios con filtros y paginación' })
  findAll(@Query() filtros: FiltrarUsuariosDto) {
    return this.usuariosService.findAll(filtros);
  }

  @Get('exportar/csv')
  @Roles(RolSistema.SUPERADMIN, RolSistema.ADMIN_CALIDAD)
  @ApiOperation({ summary: 'Exportar usuarios a CSV' })
  async exportarCSV(@Res() res: Response) {
    const datos = await this.usuariosService.listarTodos();
    const columnas: ColumnaExportacion[] = [
      { titulo: 'Código', campo: 'codigo_usuario' },
      { titulo: 'Nombres', campo: 'nombres' },
      { titulo: 'Apellidos', campo: 'apellidos' },
      { titulo: 'Email', campo: 'email' },
      { titulo: 'Username', campo: 'username' },
      { titulo: 'Tipo', campo: 'tipo_usuario' },
      { titulo: 'Cargo', campo: 'cargo' },
      { titulo: 'Área', campo: 'areas.nombre' },
      { titulo: 'Activo', campo: 'esta_activo' },
    ];
    const stream = this.exportacionService.generarCSV(datos, columnas, 'usuarios');
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="usuarios.csv"',
    });
    stream.getStream().pipe(res);
  }

  @Get('exportar/xlsx')
  @Roles(RolSistema.SUPERADMIN, RolSistema.ADMIN_CALIDAD)
  @ApiOperation({ summary: 'Exportar usuarios a Excel' })
  async exportarXLSX(@Res() res: Response) {
    const datos = await this.usuariosService.listarTodos();
    const columnas: ColumnaExportacion[] = [
      { titulo: 'Código', campo: 'codigo_usuario' },
      { titulo: 'Nombres', campo: 'nombres' },
      { titulo: 'Apellidos', campo: 'apellidos' },
      { titulo: 'Email', campo: 'email' },
      { titulo: 'Username', campo: 'username' },
      { titulo: 'Tipo', campo: 'tipo_usuario' },
      { titulo: 'Cargo', campo: 'cargo' },
      { titulo: 'Área', campo: 'areas.nombre' },
      { titulo: 'Activo', campo: 'esta_activo' },
    ];
    const stream = await this.exportacionService.generarXLSX(datos, columnas, 'usuarios', 'Usuarios');
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="usuarios.xlsx"',
    });
    stream.getStream().pipe(res);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  @ApiParam({ name: 'id', description: 'UUID del usuario' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usuariosService.findOne(id);
  }

  @Put(':id')
  @Roles(RolSistema.SUPERADMIN, RolSistema.ADMIN_CALIDAD)
  @ApiOperation({ summary: 'Actualizar datos del usuario' })
  actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarUsuarioDto,
    @UsuarioActual() usuario: UsuarioJwtPayload,
  ) {
    return this.usuariosService.actualizar(id, dto, usuario.sub);
  }

  @Patch(':id/toggle-activo')
  @Roles(RolSistema.SUPERADMIN, RolSistema.ADMIN_CALIDAD)
  @ApiOperation({ summary: 'Activar/desactivar usuario' })
  toggleActivo(
    @Param('id', ParseUUIDPipe) id: string,
    @UsuarioActual() usuario: UsuarioJwtPayload,
  ) {
    return this.usuariosService.toggleActivo(id, usuario.sub);
  }

  @Delete(':id')
  @Roles(RolSistema.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar usuario (soft delete)' })
  eliminar(
    @Param('id', ParseUUIDPipe) id: string,
    @UsuarioActual() usuario: UsuarioJwtPayload,
  ) {
    return this.usuariosService.eliminar(id, usuario.sub);
  }

  @Get(':id/roles')
  @ApiOperation({ summary: 'Obtener roles activos del usuario' })
  obtenerRoles(@Param('id', ParseUUIDPipe) id: string) {
    return this.usuariosService.obtenerRoles(id);
  }

  @Post(':id/roles')
  @Roles(RolSistema.SUPERADMIN, RolSistema.ADMIN_CALIDAD)
  @ApiOperation({ summary: 'Asignar rol al usuario' })
  asignarRol(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AsignarRolDto,
    @UsuarioActual() usuario: UsuarioJwtPayload,
  ) {
    return this.usuariosService.asignarRol(id, dto, usuario.sub);
  }

  @Delete(':id/roles/:rolAsignacionId')
  @Roles(RolSistema.SUPERADMIN, RolSistema.ADMIN_CALIDAD)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revocar rol del usuario' })
  revocarRol(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('rolAsignacionId') rolAsignacionId: string,
    @UsuarioActual() usuario: UsuarioJwtPayload,
  ) {
    return this.usuariosService.revocarRol(id, parseInt(rolAsignacionId), usuario.sub);
  }
}
