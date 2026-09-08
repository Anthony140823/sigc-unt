// src/modules/usuarios/dto/asignar-rol.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsPositive, IsOptional, IsUUID } from 'class-validator';

export class AsignarRolDto {
  @ApiProperty({ example: 1, description: 'ID del rol a asignar' })
  @IsInt()
  @IsPositive({ message: 'El rol_id debe ser un entero positivo.' })
  rol_id: number;

  @ApiPropertyOptional({ description: 'UUID del área donde aplica el rol (null = global)' })
  @IsOptional()
  @IsUUID('4')
  area_id?: string;
}
