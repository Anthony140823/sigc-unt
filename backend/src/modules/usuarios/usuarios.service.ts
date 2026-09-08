// src/modules/usuarios/usuarios.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { FiltrarUsuariosDto } from './dto/filtrar-usuarios.dto';
import { AsignarRolDto } from './dto/asignar-rol.dto';
import {
  construirPaginacion,
  construirRespuestaPaginada,
} from '../../common/utils/paginacion.util';

// Proyección segura: nunca exponer password_hash
const SELECCION_SEGURA = {
  id: true,
  codigo_usuario: true,
  username: true,
  email: true,
  nombres: true,
  apellidos: true,
  tipo_usuario: true,
  cargo: true,
  telefono: true,
  avatar_url: true,
  esta_activo: true,
  ultimo_login: true,
  creado_en: true,
  modificado_en: true,
  areas: { select: { id: true, nombre: true, codigo: true } },
  usuarios_roles: {
    where: { fecha_fin: null },
    include: {
      roles: { select: { id: true, codigo: true, nombre: true } },
      areas: { select: { id: true, nombre: true } },
    },
  },
};

@Injectable()
export class UsuariosService {
  private readonly logger = new Logger(UsuariosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async crear(dto: CrearUsuarioDto, creadoPor: string) {
    // Verificar unicidad
    const existe = await this.prisma.usuarios.findFirst({
      where: {
        OR: [
          { username: dto.username },
          { email: dto.email },
          { codigo_usuario: dto.codigo_usuario },
        ],
      },
    });

    if (existe) {
      const campo =
        existe.username === dto.username
          ? 'username'
          : existe.email === dto.email
          ? 'email'
          : 'código de usuario';
      throw new ConflictException(`Ya existe un usuario con ese ${campo}.`);
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const usuario = await this.prisma.usuarios.create({
      data: {
        codigo_usuario: dto.codigo_usuario,
        username: dto.username,
        email: dto.email,
        password_hash: passwordHash,
        nombres: dto.nombres,
        apellidos: dto.apellidos,
        tipo_usuario: dto.tipo_usuario,
        area_id: dto.area_id,
        cargo: dto.cargo,
        telefono: dto.telefono,
        creado_por: creadoPor,
      },
      select: SELECCION_SEGURA,
    });

    // Asignar rol inicial si se especificó
    if (dto.rol_id) {
      await this.asignarRol(usuario.id, { rol_id: dto.rol_id, area_id: dto.area_id }, creadoPor);
    }

    this.eventEmitter.emit('usuario.creado', { usuarioId: usuario.id, creadoPor });
    this.logger.log(`Usuario creado: ${usuario.username} por ${creadoPor}`);

    return usuario;
  }

  async findAll(filtros: FiltrarUsuariosDto) {
    const { pagina, limite, skip, order, sortBy } = construirPaginacion(filtros);

    const where: any = { eliminado_en: null };

    if (filtros.esta_activo !== undefined) where.esta_activo = filtros.esta_activo;
    if (filtros.tipo_usuario) where.tipo_usuario = filtros.tipo_usuario;
    if (filtros.area_id) where.area_id = filtros.area_id;
    if (filtros.busqueda) {
      where.OR = [
        { nombres: { contains: filtros.busqueda, mode: 'insensitive' } },
        { apellidos: { contains: filtros.busqueda, mode: 'insensitive' } },
        { username: { contains: filtros.busqueda, mode: 'insensitive' } },
        { email: { contains: filtros.busqueda, mode: 'insensitive' } },
        { codigo_usuario: { contains: filtros.busqueda, mode: 'insensitive' } },
      ];
    }

    // #region debug-point C:usuarios-findall-input
    fetch('http://127.0.0.1:7777/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'maintainers-failure',
        runId: 'pre-fix',
        hypothesisId: 'C',
        location: 'backend/src/modules/usuarios/usuarios.service.ts:findAll',
        msg: '[DEBUG] usuarios findAll input captured',
        data: { pagina, limite, skip, order, sortBy, where },
        ts: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    let datos;
    let total;
    try {
      [datos, total] = await Promise.all([
        this.prisma.usuarios.findMany({
          where,
          select: SELECCION_SEGURA,
          skip,
          take: limite,
          orderBy: { [sortBy]: order },
        }),
        this.prisma.usuarios.count({ where }),
      ]);
    } catch (error: any) {
      // #region debug-point D:usuarios-findall-error
      fetch('http://127.0.0.1:7777/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'maintainers-failure',
          runId: 'pre-fix',
          hypothesisId: 'D',
          location: 'backend/src/modules/usuarios/usuarios.service.ts:findAll',
          msg: '[DEBUG] usuarios findAll failed',
          data: {
            name: error?.name ?? null,
            message: error?.message ?? null,
            code: error?.code ?? null,
          },
          ts: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      throw error;
    }

    return construirRespuestaPaginada(datos, total, pagina, limite);
  }

  async listarTodos() {
    return this.prisma.usuarios.findMany({
      where: { eliminado_en: null },
      select: SELECCION_SEGURA,
      orderBy: { creado_en: 'desc' },
    });
  }

  async findOne(id: string) {
    const usuario = await this.prisma.usuarios.findUnique({
      where: { id },
      select: SELECCION_SEGURA,
    });

    if (!usuario) throw new NotFoundException(`Usuario con ID ${id} no encontrado.`);
    return usuario;
  }

  async actualizar(id: string, dto: ActualizarUsuarioDto, modificadoPor: string) {
    await this.findOne(id); // Verifica existencia

    // Verificar unicidad si cambia email
    if (dto.email) {
      const existe = await this.prisma.usuarios.findFirst({
        where: { email: dto.email, id: { not: id } },
      });
      if (existe) throw new ConflictException('El email ya está en uso por otro usuario.');
    }

    const usuario = await this.prisma.usuarios.update({
      where: { id },
      data: { ...dto, modificado_por: modificadoPor },
      select: SELECCION_SEGURA,
    });

    this.eventEmitter.emit('usuario.actualizado', { usuarioId: id, modificadoPor });
    return usuario;
  }

  async eliminar(id: string, eliminadoPor: string) {
    await this.findOne(id);

    await this.prisma.usuarios.update({
      where: { id },
      data: {
        esta_activo: false,
        eliminado_en: new Date(),
        eliminado_por: eliminadoPor,
      },
    });

    // Revocar todos los tokens del usuario eliminado
    await this.prisma.tokens_refresco.updateMany({
      where: { usuario_id: id, revocado: false },
      data: { revocado: true, revocado_en: new Date() },
    });

    this.eventEmitter.emit('usuario.eliminado', { usuarioId: id, eliminadoPor });
    return { mensaje: `Usuario eliminado correctamente.` };
  }

  async toggleActivo(id: string, modificadoPor: string) {
    const usuario = await this.findOne(id) as any;
    const nuevoEstado = !usuario.esta_activo;

    await this.prisma.usuarios.update({
      where: { id },
      data: { esta_activo: nuevoEstado, modificado_por: modificadoPor },
    });

    return {
      mensaje: `Usuario ${nuevoEstado ? 'activado' : 'desactivado'} correctamente.`,
      esta_activo: nuevoEstado,
    };
  }

  async asignarRol(usuarioId: string, dto: AsignarRolDto, asignadoPor: string) {
    await this.findOne(usuarioId);

    // Verificar que el rol existe
    const rol = await this.prisma.roles.findUnique({ where: { id: dto.rol_id } });
    if (!rol) throw new NotFoundException(`Rol con ID ${dto.rol_id} no encontrado.`);

    // Verificar si ya tiene ese rol activo
    const existente = await this.prisma.usuarios_roles.findFirst({
      where: {
        usuario_id: usuarioId,
        rol_id: dto.rol_id,
        area_id: dto.area_id || null,
        fecha_fin: null,
      },
    });

    if (existente) {
      throw new ConflictException('El usuario ya tiene este rol asignado.');
    }

    const asignacion = await this.prisma.usuarios_roles.create({
      data: {
        usuario_id: usuarioId,
        rol_id: dto.rol_id,
        area_id: dto.area_id,
        asignado_por: asignadoPor,
        fecha_inicio: new Date(),
      },
      include: {
        roles: { select: { codigo: true, nombre: true } },
      },
    });

    return asignacion;
  }

  async revocarRol(usuarioId: string, usuarioRolId: number, revopadoPor: string) {
    const asignacion = await this.prisma.usuarios_roles.findFirst({
      where: { id: usuarioRolId, usuario_id: usuarioId },
    });

    if (!asignacion) throw new NotFoundException('Asignación de rol no encontrada.');

    await this.prisma.usuarios_roles.update({
      where: { id: usuarioRolId },
      data: { fecha_fin: new Date() },
    });

    return { mensaje: 'Rol revocado correctamente.' };
  }

  async obtenerRoles(usuarioId: string) {
    return this.prisma.usuarios_roles.findMany({
      where: { usuario_id: usuarioId, fecha_fin: null },
      include: {
        roles: true,
        areas: { select: { id: true, nombre: true, codigo: true } },
      },
    });
  }
}
