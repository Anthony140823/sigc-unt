// src/modules/auditorias/dto/crear-auditoria.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsInt, IsPositive, IsDateString, IsOptional } from 'class-validator';

export class CrearAuditoriaDto {
  @ApiProperty()
  @IsUUID('4')
  plan_id: string;

  @ApiProperty({ example: 1, description: 'ID del tipo de auditoría' })
  @IsInt() @IsPositive()
  tipo_id: number;

  @ApiProperty({ example: 'AI-2025-001' })
  @IsString() @IsNotEmpty()
  codigo: string;

  @ApiProperty({ example: 'Auditoría Interna — Proceso de Admisión' })
  @IsString() @IsNotEmpty()
  nombre: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  objetivo?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  alcance?: string;

  @ApiProperty()
  @IsUUID('4')
  area_auditada_id: string;

  @ApiPropertyOptional()
  @IsOptional() @IsUUID('4')
  proceso_auditado_id?: string;

  @ApiProperty({ example: '2025-06-02' })
  @IsDateString()
  fecha_programada_inicio: string;

  @ApiProperty({ example: '2025-06-06' })
  @IsDateString()
  fecha_programada_fin: string;
}

// ─────────────────────────────────────────────────────────
