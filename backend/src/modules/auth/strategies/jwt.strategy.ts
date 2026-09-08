// src/modules/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';
import { UsuarioJwtPayload } from '../../../common/interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret'),
    });
  }

  async validate(payload: UsuarioJwtPayload): Promise<UsuarioJwtPayload> {
    // Verificar que el usuario siga activo en cada request
    const usuario = await this.prisma.usuarios.findUnique({
      where: { id: payload.sub },
      select: { esta_activo: true, eliminado_en: true },
    });

    if (!usuario || !usuario.esta_activo || usuario.eliminado_en) {
      throw new UnauthorizedException('Usuario inactivo o eliminado del sistema.');
    }

    return payload;
  }
}
