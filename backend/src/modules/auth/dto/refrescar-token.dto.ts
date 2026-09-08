// src/modules/auth/dto/refrescar-token.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RefrescarTokenDto {
  @ApiProperty({ description: 'Refresh token JWT obtenido en el login.' })
  @IsString()
  @IsNotEmpty({ message: 'El refresh_token es requerido.' })
  refresh_token: string;
}
