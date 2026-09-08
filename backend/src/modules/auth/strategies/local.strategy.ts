// src/modules/auth/strategies/local.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'username',  // Acepta username o email
      passwordField: 'password',
    });
  }

  async validate(username: string, password: string): Promise<any> {
    const usuario = await this.authService.validarCredenciales(username, password);
    if (!usuario) {
      throw new UnauthorizedException(
        'Credenciales incorrectas. Verifique su usuario y contraseña.',
      );
    }
    return usuario;
  }
}
