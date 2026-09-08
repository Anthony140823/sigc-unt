// src/modules/documentos/dto/filtrar-documentos.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsString, IsInt } from 'class-validator';
import { Transform } from 'class-transformer';

export class FiltrarDocumentosDto {
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
  sortBy?: string = 'modificado_en';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'] })
  @IsOptional()
  order?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional({ description: 'Buscar en título, código y palabras clave' })
  @IsOptional()
  @IsString()
  busqueda?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  tipo_documento_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  area_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  proceso_id?: string;

  @ApiPropertyOptional({ description: 'Código del estado: BORRADOR, EN_REVISION, APROBADO, PUBLICADO, OBSOLETO' })
  @IsOptional()
  @IsString()
  estado_codigo?: string;
}

// ─────────────────────────────────────────────────────────
