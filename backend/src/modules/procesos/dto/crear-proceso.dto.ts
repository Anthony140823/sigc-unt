// src/modules/procesos/dto/crear-proceso.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsNotEmpty, IsUUID, IsOptional, IsArray,
} from 'class-validator';

export class CrearProcesoDto {
  @ApiProperty()
  @IsUUID('4')
  macroproceso_id: string;

  @ApiProperty({ example: 'PRO-MIS-001' })
  @IsString() @IsNotEmpty()
  codigo: string;

  @ApiProperty({ example: 'Proceso de Admisión y Matrícula' })
  @IsString() @IsNotEmpty()
  nombre: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  objetivo?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  alcance?: string;

  @ApiPropertyOptional({ example: ['Expediente del postulante', 'Resultados de examen'] })
  @IsOptional() @IsArray() @IsString({ each: true })
  entradas?: string[];

  @ApiPropertyOptional({ example: ['Matrícula registrada', 'Carné universitario emitido'] })
  @IsOptional() @IsArray() @IsString({ each: true })
  salidas?: string[];

  @ApiProperty()
  @IsUUID('4')
  area_responsable_id: string;

  @ApiPropertyOptional({ description: 'URL al archivo BPMN 2.0 en MinIO' })
  @IsOptional() @IsString()
  diagrama_bpmn_url?: string;

  @ApiPropertyOptional({ description: 'Representación JSON del diagrama BPMN para renderizado web' })
  @IsOptional()
  diagrama_bpmn_json?: Record<string, any>;
}

// ─────────────────────────────────────────────────────────
