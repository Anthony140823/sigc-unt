// ================================================================
// src/common/decorators/usuario-actual.decorator.ts
// Extrae el usuario autenticado del request
// ================================================================
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UsuarioJwtPayload } from '../interfaces/jwt-payload.interface';

export const UsuarioActual = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UsuarioJwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
