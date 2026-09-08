// src/common/guards/roles.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, RolSistema } from '../decorators/roles.decorator';
import { UsuarioJwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rolesRequeridos = this.reflector.getAllAndOverride<RolSistema[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Sin restricción de rol → solo requiere autenticación (JwtAuthGuard)
    if (!rolesRequeridos || rolesRequeridos.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const usuario: UsuarioJwtPayload = request.user;

    if (!usuario?.roles?.length) {
      throw new ForbiddenException('No tiene roles asignados en el sistema.');
    }

    // SUPERADMIN tiene acceso total
    if (usuario.roles.includes(RolSistema.SUPERADMIN)) return true;

    const tieneRol = rolesRequeridos.some((rol) =>
      usuario.roles.includes(rol),
    );

    if (!tieneRol) {
      throw new ForbiddenException(
        `Acceso denegado. Se requiere uno de los roles: ${rolesRequeridos.join(', ')}.`,
      );
    }

    return true;
  }
}
