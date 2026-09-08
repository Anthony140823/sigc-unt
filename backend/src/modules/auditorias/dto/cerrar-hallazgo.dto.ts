// src/modules/auditorias/dto/cerrar-hallazgo.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CerrarHallazgoDto {
  @ApiProperty({ description: '¿Se cierra con observación?' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  con_observacion: boolean;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  observacion_cierre?: string;
}
