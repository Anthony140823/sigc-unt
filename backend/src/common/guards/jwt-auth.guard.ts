// src/common/guards/jwt-auth.guard.ts
import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { PUBLICO_KEY } from '../decorators/roles.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Permite rutas marcadas como públicas (ej: login, health)
    const esPublica = this.reflector.getAllAndOverride<boolean>(PUBLICO_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (esPublica) return true;

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('El token de acceso ha expirado. Use el token de refresco para obtener uno nuevo.');
      }
      if (info?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Token de acceso inválido.');
      }
      throw err || new UnauthorizedException('Debe autenticarse para acceder a este recurso.');
    }
    return user;
  }
}
