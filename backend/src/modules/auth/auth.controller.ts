// src/modules/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  HttpCode,
  HttpStatus,
  Req,
  Ip,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefrescarTokenDto } from './dto/refrescar-token.dto';
import { CambiarPasswordDto } from './dto/cambiar-password.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator';
import { Publico } from '../../common/decorators/roles.decorator';
import { UsuarioJwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Publico()
  @UseGuards(AuthGuard('local'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sesión',
    description: 'Autentica al usuario con username/email y contraseña. Retorna access_token y refresh_token JWT.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login exitoso. Retorna tokens JWT.' })
  @ApiResponse({ status: 401, description: 'Credenciales incorrectas o cuenta bloqueada.' })
  async login(
    @Req() req: Request,
    @Body() _dto: LoginDto,
    @Ip() ip: string,
  ) {
    const userAgent = req.get('user-agent') || '';
    return this.authService.login(req.user, ip, userAgent);
  }

  @Post('refresh')
  @Publico()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refrescar token de acceso',
    description: 'Genera un nuevo access_token usando un refresh_token válido (rotación de tokens).',
  })
  @ApiResponse({ status: 200, description: 'Nuevo access_token generado.' })
  @ApiResponse({ status: 401, description: 'Refresh token inválido o expirado.' })
  async refrescarToken(
    @Body() dto: RefrescarTokenDto,
    @Ip() ip: string,
  ) {
    return this.authService.refrescarToken(dto.refresh_token, ip);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cerrar sesión',
    description: 'Revoca todos los refresh tokens del usuario. El access_token expira según su TTL.',
  })
  @ApiResponse({ status: 200, description: 'Sesión cerrada correctamente.' })
  async logout(
    @UsuarioActual() usuario: UsuarioJwtPayload,
    @Ip() ip: string,
  ) {
    return this.authService.logout(usuario.sub, ip);
  }

  @Get('perfil')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Obtener perfil del usuario autenticado',
    description: 'Retorna los datos del usuario autenticado, sus roles y área.',
  })
  @ApiResponse({ status: 200, description: 'Perfil del usuario.' })
  async perfil(@UsuarioActual() usuario: UsuarioJwtPayload) {
    return { datos: usuario };
  }

  @Post('cambiar-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cambiar contraseña',
    description: 'Cambia la contraseña del usuario autenticado. Requiere la contraseña actual.',
  })
  @ApiResponse({ status: 200, description: 'Contraseña cambiada. Se revocan todos los tokens.' })
  @ApiResponse({ status: 400, description: 'Contraseña actual incorrecta o nueva igual a la actual.' })
  async cambiarPassword(
    @UsuarioActual() usuario: UsuarioJwtPayload,
    @Body() dto: CambiarPasswordDto,
  ) {
    return this.authService.cambiarPassword(usuario.sub, dto);
  }
}
