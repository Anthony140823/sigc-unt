// src/modules/auth/dto/login.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'jperez', description: 'Username o email institucional' })
  @IsString()
  @IsNotEmpty({ message: 'El usuario es requerido.' })
  username: string;

  @ApiProperty({ example: 'Mi@Pass2025', description: 'Contraseña' })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña es requerida.' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
  password: string;
}
