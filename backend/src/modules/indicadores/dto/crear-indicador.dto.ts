// src/modules/indicadores/dto/crear-indicador.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsNotEmpty, IsOptional, IsUUID, IsInt,
  IsPositive, IsEnum, IsNumber, IsDecimal,
} from 'class-validator';
import { Transform } from 'class-transformer';

export enum TipoTendencia {
  MAYOR   = 'MAYOR',
  MENOR   = 'MENOR',
  NOMINAL = 'NOMINAL',
}

export class CrearIndicadorDto {
  @ApiProperty({ example: 'IND-ACA-001' })
  @IsString() @IsNotEmpty()
  codigo: string;

  @ApiProperty({ example: 'Tasa de titulación oportuna' })
  @IsString() @IsNotEmpty()
  nombre: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  descripcion?: string;

  @ApiProperty({ example: '(Egresados titulados en el año / Total egresados del año) * 100' })
  @IsString() @IsNotEmpty()
  formula: string;

  @ApiPropertyOptional({ example: '%' })
  @IsOptional() @IsString()
  unidad_medida?: string;

  @ApiProperty({ enum: TipoTendencia, default: TipoTendencia.MAYOR })
  @IsEnum(TipoTendencia)
  tipo_tendencia: TipoTendencia;

  @ApiPropertyOptional({ example: 80, description: 'Meta numérica del indicador' })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  meta_valor?: number;

  @ApiPropertyOptional({ example: 'Tasa de titulación ≥ 80% de los egresados del año' })
  @IsOptional() @IsString()
  meta_descripcion?: string;

  @ApiProperty({ example: 5, description: 'ID de frecuencia de medición' })
  @IsInt() @IsPositive()
  frecuencia_id: number;

  @ApiPropertyOptional()
  @IsOptional() @IsUUID('4')
  proceso_id?: string;

  @ApiProperty()
  @IsUUID('4')
  area_responsable_id: string;

  @ApiPropertyOptional()
  @IsOptional() @IsUUID('4')
  responsable_id?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsUUID('4')
  objetivo_estrategico_id?: string;

  @ApiPropertyOptional({ example: 'Sistema de Registros Académicos (SIA)' })
  @IsOptional() @IsString()
  fuente_datos?: string;
}

// ─────────────────────────────────────────────────────────
