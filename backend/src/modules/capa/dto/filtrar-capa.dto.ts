// src/modules/capa/dto/filtrar-capa.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

export class FiltrarCapaDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional() @Transform(({ value }) => parseInt(value))
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional() sortBy?: string = 'fecha_deteccion';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'] })
  @IsOptional() order?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional()
  @IsOptional() @IsString() busqueda?: string;

  @ApiPropertyOptional({ description: 'Origen: AUDITORIA, INSPECCION, QUEJA, INDICADOR, etc.' })
  @IsOptional() @IsString() origen?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsUUID() area_id?: string;

  @ApiPropertyOptional({ description: 'Código del estado: IDENTIFICADA, ANALISIS, PLAN_ACCION, etc.' })
  @IsOptional() @IsString() estado_codigo?: string;

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsOptional() @IsDateString() desde?: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional() @IsDateString() hasta?: string;
}

// ─────────────────────────────────────────────────────────
