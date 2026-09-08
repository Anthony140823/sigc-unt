// src/modules/acreditacion/dto/iniciar-proceso.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID, IsInt, IsPositive, IsIn, IsOptional,
  IsDateString, IsNumber, Min, Max,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class IniciarProcesoDto {
  @ApiProperty()
  @IsUUID('4')
  programa_id: string;

  @ApiProperty({ example: 1, description: 'ID del estándar de acreditación' })
  @IsInt() @IsPositive()
  estandar_id: number;

  @ApiProperty({ enum: ['AUTOEVALUACION','EVALUACION_EXTERNA','ACREDITACION','REACREDITACION'] })
  @IsIn(['AUTOEVALUACION','EVALUACION_EXTERNA','ACREDITACION','REACREDITACION'])
  tipo_proceso: string;

  @ApiPropertyOptional({ example: 2025 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt() @Min(2020) @Max(2040)
  anio_inicio?: number;

  @ApiPropertyOptional({ example: '2025-03-01' })
  @IsOptional() @IsDateString()
  fecha_inicio?: string;

  @ApiPropertyOptional({ example: '2025-11-15', description: 'Fecha de visita del comité externo' })
  @IsOptional() @IsDateString()
  fecha_visita_externa?: string;

  @ApiPropertyOptional({ example: '2028-11-15', description: 'Fecha de vencimiento de la acreditación' })
  @IsOptional() @IsDateString()
  fecha_vencimiento?: string;
}

// ─────────────────────────────────────────────────────────
