// src/modules/auditorias/dto/filtrar-auditorias.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsString, IsInt } from 'class-validator';
import { Transform } from 'class-transformer';

export class FiltrarAuditoriasDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional() @Transform(({ value }) => parseInt(value))
  limit?: number = 20;

  @ApiPropertyOptional() @IsOptional()
  sortBy?: string = 'fecha_programada_inicio';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'] }) @IsOptional()
  order?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional() @IsOptional() @IsUUID()
  plan_id?: string;

  @ApiPropertyOptional() @IsOptional()
  @Transform(({ value }) => parseInt(value)) @IsInt()
  tipo_id?: number;

  @ApiPropertyOptional() @IsOptional() @IsUUID()
  area_id?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  estado_codigo?: string;

  @ApiPropertyOptional() @IsOptional()
  @Transform(({ value }) => parseInt(value)) @IsInt()
  anio?: number;

  abiertos?: boolean;
}

// ─────────────────────────────────────────────────────────
