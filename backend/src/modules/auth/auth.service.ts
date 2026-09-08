// src/modules/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { LoginDto } from './dto/login.dto';
import { CambiarPasswordDto } from './dto/cambiar-password.dto';
import { UsuarioJwtPayload } from '../../common/interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly MAX_INTENTOS = 5;
  private readonly BLOQUEO_MINUTOS = 30;

  constructor(
    private readonly prisma: PrismaService,
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /** Valida credenciales para LocalStrategy */
  async validarCredenciales(username: string, password: string) {
    const usuario = await this.prisma.usuarios.findFirst({
      where: {
        OR: [{ username }, { email: username }],
        esta_activo: true,
        eliminado_en: null,
      },
      include: {
        usuarios_roles: {
          where: { fecha_fin: null },
          include: { roles: true },
        },
        areas: { select: { id: true, nombre: true, codigo: true } },
      },
    });

    if (!usuario) return null;

    // Verificar si está bloqueado
    if (usuario.bloqueado_hasta && usuario.bloqueado_hasta > new Date()) {
      throw new UnauthorizedException(
        `Cuenta bloqueada temporalmente. Intente nuevamente después de ${usuario.bloqueado_hasta.toLocaleTimeString('es-PE')}.`,
      );
    }

    const passwordValida = await bcrypt.compare(password, usuario.password_hash);

    if (!passwordValida) {
      await this.registrarIntentoFallido(usuario.id, usuario.intentos_login);
      return null;
    }

    // Reset intentos fallidos al login exitoso
    await this.prisma.usuarios.update({
      where: { id: usuario.id },
      data: { intentos_login: 0, bloqueado_hasta: null, ultimo_login: new Date() },
    });

    return usuario;
  }

  /** Login completo: retorna access_token + refresh_token */
  async login(usuario: any, ip: string, userAgent: string) {
    const roles = usuario.usuarios_roles.map(
      (ur: any) => ur.roles.codigo,
    );

    const payload: UsuarioJwtPayload = {
      sub: usuario.id,
      username: usuario.username,
      email: usuario.email,
      roles,
      area_id: usuario.area_id,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('jwt.refreshSecret'),
      expiresIn: this.config.get<string>('jwt.refreshExpiresIn'),
    });

    // Guardar refresh token hasheado en BD
    const refreshHash = await bcrypt.hash(refreshToken, 10);
    const expira = new Date();
    expira.setDate(expira.getDate() + 7);

    await this.prisma.tokens_refresco.create({
      data: {
        usuario_id: usuario.id,
        token_hash: refreshHash,
        expira_en: expira,
        ip_origen: ip,
        user_agent: userAgent,
      },
    });

    // Log de sesión
    await this.prisma.log_sesiones.create({
      data: {
        usuario_id: usuario.id,
        tipo_evento: 'LOGIN',
        ip_origen: ip,
        user_agent: userAgent,
      },
    });

    this.eventEmitter.emit('auth.login', { usuarioId: usuario.id, ip });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expira_en: 900, // 15 minutos en segundos
      usuario: {
        id: usuario.id,
        username: usuario.username,
        email: usuario.email,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        roles,
        area: usuario.areas,
      },
    };
  }

  /** Refresca el access_token usando un refresh_token válido */
  async refrescarToken(refreshToken: string, ip: string) {
    try {
      const payload = this.jwtService.verify<UsuarioJwtPayload>(refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });

      // Buscar tokens no revocados del usuario
      const tokensGuardados = await this.prisma.tokens_refresco.findMany({
        where: {
          usuario_id: payload.sub,
          revocado: false,
          expira_en: { gt: new Date() },
        },
      });

      // Verificar que alguno coincida con el hash
      let tokenValido = false;
      for (const t of tokensGuardados) {
        if (await bcrypt.compare(refreshToken, t.token_hash)) {
          tokenValido = true;
          // Revocar el token usado (rotación de tokens)
          await this.prisma.tokens_refresco.update({
            where: { id: t.id },
            data: { revocado: true, revocado_en: new Date() },
          });
          break;
        }
      }

      if (!tokenValido) {
        throw new UnauthorizedException('Token de refresco inválido o ya utilizado.');
      }

      const usuario = await this.usuariosService.findOne(payload.sub);
      return this.login(usuario, ip, '');
    } catch {
      throw new UnauthorizedException('Token de refresco inválido o expirado.');
    }
  }

  /** Logout: revoca todos los refresh tokens del usuario */
  async logout(usuarioId: string, ip: string) {
    await this.prisma.tokens_refresco.updateMany({
      where: { usuario_id: usuarioId, revocado: false },
      data: { revocado: true, revocado_en: new Date() },
    });

    await this.prisma.log_sesiones.create({
      data: {
        usuario_id: usuarioId,
        tipo_evento: 'LOGOUT',
        ip_origen: ip,
      },
    });

    return { mensaje: 'Sesión cerrada correctamente.' };
  }

  /** Cambia contraseña del usuario autenticado */
  async cambiarPassword(
    usuarioId: string,
    dto: CambiarPasswordDto,
  ) {
    const usuario = await this.prisma.usuarios.findUnique({
      where: { id: usuarioId },
    });

    if (!usuario) throw new NotFoundException('Usuario no encontrado.');

    const passwordActualValida = await bcrypt.compare(
      dto.password_actual,
      usuario.password_hash,
    );

    if (!passwordActualValida) {
      throw new BadRequestException('La contraseña actual es incorrecta.');
    }

    if (dto.password_actual === dto.password_nuevo) {
      throw new BadRequestException(
        'La nueva contraseña no puede ser igual a la actual.',
      );
    }

    const nuevoHash = await bcrypt.hash(dto.password_nuevo, 12);

    await this.prisma.usuarios.update({
      where: { id: usuarioId },
      data: { password_hash: nuevoHash },
    });

    // Revocar todos los tokens al cambiar contraseña
    await this.prisma.tokens_refresco.updateMany({
      where: { usuario_id: usuarioId, revocado: false },
      data: { revocado: true, revocado_en: new Date() },
    });

    this.eventEmitter.emit('auth.password-changed', { usuarioId });

    return { mensaje: 'Contraseña actualizada correctamente. Inicie sesión nuevamente.' };
  }

  private async registrarIntentoFallido(usuarioId: string, intentosActuales: number) {
    const nuevosIntentos = intentosActuales + 1;
    const data: any = { intentos_login: nuevosIntentos };

    if (nuevosIntentos >= this.MAX_INTENTOS) {
      const bloqueadoHasta = new Date();
      bloqueadoHasta.setMinutes(
        bloqueadoHasta.getMinutes() + this.BLOQUEO_MINUTOS,
      );
      data.bloqueado_hasta = bloqueadoHasta;
      this.logger.warn(`Usuario ${usuarioId} bloqueado por ${this.BLOQUEO_MINUTOS} min.`);
    }

    await this.prisma.usuarios.update({ where: { id: usuarioId }, data });
  }
}
