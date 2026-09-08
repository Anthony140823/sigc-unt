// src/modules/capa/dto/actualizar-accion-capa.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

export class ActualizarAccionCapaDto {
  @ApiPropertyOptional({ example: 'Se completó la primera sesión de capacitación' })
  @IsOptional() @IsString()
  descripcion?: string;

  @ApiPropertyOptional({ example: 65, description: 'Porcentaje de avance (0-100)' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt() @Min(0) @Max(100)
  porcentaje_avance?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  resultado_real?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsDateString()
  fecha_real_cierre?: string;
}

// ─────────────────────────────────────────────────────────
