// src/modules/riesgos/dto/crear-plan-mitigacion.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsString, IsNotEmpty, IsUUID, IsOptional, IsDateString, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class CrearPlanMitigacionDto {
  @ApiProperty({ enum: ['MITIGAR','ACEPTAR','TRANSFERIR','EVITAR'] })
  @IsIn(['MITIGAR','ACEPTAR','TRANSFERIR','EVITAR'])
  tipo_respuesta: string;

  @ApiProperty()
  @IsString() @IsNotEmpty()
  descripcion: string;

  @ApiPropertyOptional()
  @IsOptional() @IsUUID('4')
  responsable_id?: string;

  @ApiPropertyOptional() @IsOptional() @IsDateString()
  fecha_inicio?: string;

  @ApiPropertyOptional() @IsOptional() @IsDateString()
  fecha_fin?: string;

  @ApiPropertyOptional({ example: 1.5, description: 'Probabilidad residual esperada tras mitigación (1-5)' })
  @IsOptional() @Transform(({ value }) => parseFloat(value))
  @IsNumber() @Min(1) @Max(5)
  probabilidad_residual?: number;

  @ApiPropertyOptional({ example: 2, description: 'Impacto residual esperado (1-5)' })
  @IsOptional() @Transform(({ value }) => parseFloat(value))
  @IsNumber() @Min(1) @Max(5)
  impacto_residual?: number;
}

// ─────────────────────────────────────────────────────────
