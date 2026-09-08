// src/modules/riesgos/dto/crear-riesgo.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsIn, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class CrearRiesgoDto {
  @ApiProperty({ example: 'Falla del Sistema de Información Académica durante matrícula' })
  @IsString() @IsNotEmpty()
  nombre: string;

  @ApiProperty()
  @IsString() @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ enum: ['ESTRATEGICO','OPERACIONAL','FINANCIERO','LEGAL','REPUTACIONAL','TI','ACADEMICO'] })
  @IsIn(['ESTRATEGICO','OPERACIONAL','FINANCIERO','LEGAL','REPUTACIONAL','TI','ACADEMICO'])
  tipo_riesgo: string;

  @ApiProperty()
  @IsUUID('4')
  area_id: string;

  @ApiPropertyOptional()
  @IsOptional() @IsUUID('4')
  proceso_id?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsUUID('4')
  objetivo_estrategico_id?: string;

  @ApiPropertyOptional({ example: 'Servidores obsoletos, falta de redundancia' })
  @IsOptional() @IsString()
  causa?: string;

  @ApiPropertyOptional({ example: 'Imposibilidad de completar matrícula, pérdida de ingresos' })
  @IsOptional() @IsString()
  consecuencia?: string;

  @ApiProperty({ example: 3, description: 'Probabilidad 1-5 (1=raro, 5=casi certero)' })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber() @Min(1) @Max(5)
  probabilidad: number;

  @ApiProperty({ example: 4, description: 'Impacto 1-5 (1=insignificante, 5=catastrófico)' })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber() @Min(1) @Max(5)
  impacto: number;

  @ApiPropertyOptional()
  @IsOptional() @IsUUID('4')
  responsable_id?: string;
}

// ─────────────────────────────────────────────────────────
