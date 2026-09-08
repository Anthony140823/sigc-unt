// src/modules/usuarios/dto/crear-usuario.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsEmail, IsNotEmpty, IsOptional, IsUUID,
  IsInt, IsEnum, MinLength, Matches, IsPositive,
} from 'class-validator';

export enum TipoUsuario {
  DOCENTE        = 'DOCENTE',
  ADMINISTRATIVO = 'ADMINISTRATIVO',
  AUTORIDAD      = 'AUTORIDAD',
  EXTERNO        = 'EXTERNO',
}

export class CrearUsuarioDto {
  @ApiProperty({ example: 'DOC-12345678', description: 'Código institucional único (DNI, código docente)' })
  @IsString()
  @IsNotEmpty({ message: 'El código de usuario es requerido.' })
  codigo_usuario: string;

  @ApiProperty({ example: 'jperez', description: 'Nombre de usuario para login' })
  @IsString()
  @IsNotEmpty({ message: 'El username es requerido.' })
  @Matches(/^[a-zA-Z0-9._-]{4,30}$/, {
    message: 'El username solo puede contener letras, números, puntos, guiones y guiones bajos (4-30 caracteres).',
  })
  username: string;

  @ApiProperty({ example: 'jperez@unitru.edu.pe' })
  @IsEmail({}, { message: 'El email no tiene formato válido.' })
  email: string;

  @ApiProperty({ example: 'Inicial@2025', description: 'Contraseña inicial (el usuario deberá cambiarla)' })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
    message: 'La contraseña debe incluir mayúscula, número y carácter especial.',
  })
  password: string;

  @ApiProperty({ example: 'Juan Carlos' })
  @IsString()
  @IsNotEmpty({ message: 'Los nombres son requeridos.' })
  nombres: string;

  @ApiProperty({ example: 'Pérez García' })
  @IsString()
  @IsNotEmpty({ message: 'Los apellidos son requeridos.' })
  apellidos: string;

  @ApiProperty({ enum: TipoUsuario, example: TipoUsuario.DOCENTE })
  @IsEnum(TipoUsuario, { message: 'Tipo de usuario inválido.' })
  tipo_usuario: TipoUsuario;

  @ApiPropertyOptional({ example: 'uuid-del-area' })
  @IsOptional()
  @IsUUID('4', { message: 'El area_id debe ser un UUID válido.' })
  area_id?: string;

  @ApiPropertyOptional({ example: 'Jefe de la Oficina de Calidad' })
  @IsOptional()
  @IsString()
  cargo?: string;

  @ApiPropertyOptional({ example: '+51 944 123 456' })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional({ description: 'ID del rol inicial a asignar' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  rol_id?: number;
}

// ─────────────────────────────────────────────────────────
