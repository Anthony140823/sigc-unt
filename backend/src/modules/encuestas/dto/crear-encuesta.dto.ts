// src/modules/encuestas/dto/crear-encuesta.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsNotEmpty, IsOptional, IsUUID, IsBoolean,
  IsIn, IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CrearEncuestaDto {
  @ApiProperty({ example: 'Encuesta de Satisfacción Estudiantil 2025-I' })
  @IsString() @IsNotEmpty()
  titulo: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  descripcion?: string;

  @ApiProperty({
    enum: ['ESTUDIANTE','DOCENTE','EGRESADO','ADMINISTRATIVO','EXTERNO','TODOS'],
  })
  @IsIn(['ESTUDIANTE','DOCENTE','EGRESADO','ADMINISTRATIVO','EXTERNO','TODOS'])
  poblacion_objetivo: string;

  @ApiPropertyOptional({ description: 'UUID del programa académico (null = institucional)' })
  @IsOptional() @IsUUID('4')
  programa_id?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsUUID('4')
  area_id?: string;

  @ApiPropertyOptional({ example: '2025-I' })
  @IsOptional() @IsString()
  ciclo_academico?: string;

  @ApiPropertyOptional({ example: '2025-04-01T00:00:00Z' })
  @IsOptional() @IsDateString()
  fecha_inicio?: string;

  @ApiPropertyOptional({ example: '2025-04-30T23:59:59Z' })
  @IsOptional() @IsDateString()
  fecha_fin?: string;

  @ApiPropertyOptional({ default: true, description: '¿La encuesta es anónima?' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  es_anonima?: boolean;
}

// ─────────────────────────────────────────────────────────
