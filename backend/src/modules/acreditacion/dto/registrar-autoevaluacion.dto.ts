// src/modules/acreditacion/dto/registrar-autoevaluacion.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, Min, Max, IsIn, IsString, IsOptional, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class RegistrarAutoevaluacionDto {
  @ApiPropertyOptional({ example: 3.5, description: 'Puntuación del criterio (escala del estándar)' })
  @IsOptional()
  @Transform(({ value }) => value !== undefined ? parseFloat(value) : undefined)
  @IsNumber() @Min(0) @Max(100)
  puntuacion?: number;

  @ApiProperty({ enum: ['LOGRADO', 'PARCIALMENTE_LOGRADO', 'NO_LOGRADO'] })
  @IsIn(['LOGRADO', 'PARCIALMENTE_LOGRADO', 'NO_LOGRADO'])
  nivel_logro: string;

  @ApiPropertyOptional({ example: 'El programa cuenta con un plan de estudios actualizado y alineado a las tendencias internacionales.' })
  @IsOptional() @IsString()
  fortalezas?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  debilidades?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  oportunidades?: string;

  @ApiPropertyOptional({ example: 'Actualizar el plan de estudios incluyendo competencias digitales antes de Jun 2025.' })
  @IsOptional() @IsString()
  plan_mejora?: string;

  @ApiPropertyOptional({ description: 'UUID del responsable de la autoevaluación de este criterio' })
  @IsOptional() @IsUUID('4')
  responsable_id?: string;
}

// ─────────────────────────────────────────────────────────
