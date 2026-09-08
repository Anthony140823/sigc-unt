import { Transform } from 'class-transformer';
// src/modules/indicadores/dto/filtrar-indicadores.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsString } from 'class-validator';

export class FiltrarIndicadoresDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  sortBy?: string = 'creado_en';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'] })
  @IsOptional()
  order?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  busqueda?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsUUID()
  area_id?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsUUID()
  proceso_id?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsUUID()
  objetivo_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  frecuencia_id?: number;
}

// ─────────────────────────────────────────────────────────
