// src/modules/auth/dto/cambiar-password.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, Matches } from 'class-validator';

export class CambiarPasswordDto {
  @ApiProperty({ example: 'MiPasswordActual@1' })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña actual es requerida.' })
  password_actual: string;

  @ApiProperty({
    example: 'NuevoPassword@2025',
    description: 'Mínimo 8 caracteres, al menos 1 mayúscula, 1 número y 1 carácter especial.',
  })
  @IsString()
  @MinLength(8, { message: 'La nueva contraseña debe tener al menos 8 caracteres.' })
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'La contraseña debe incluir mayúscula, número y carácter especial.',
  })
  password_nuevo: string;
}
