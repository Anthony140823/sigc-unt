// src/modules/riesgos/dto/filtrar-riesgos.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsString, IsInt } from 'class-validator';
import { Transform } from 'class-transformer';

export class FiltrarRiesgosDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional() @Transform(({ value }) => parseInt(value))
  limit?: number = 20;

  @ApiPropertyOptional({ default: 'puntuacion' })
  @IsOptional() sortBy?: string = 'puntuacion';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional() order?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional() @IsOptional() @IsUUID()
  area_id?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  tipo_riesgo?: string;

  @ApiPropertyOptional({ description: 'ID del nivel de riesgo' })
  @IsOptional() @Transform(({ value }) => parseInt(value)) @IsInt()
  nivel_id?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  estado_codigo?: string;
}

// ─────────────────────────────────────────────────────────
