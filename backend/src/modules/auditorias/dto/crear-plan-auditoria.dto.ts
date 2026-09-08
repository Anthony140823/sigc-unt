// src/modules/auditorias/dto/crear-plan-auditoria.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, IsUUID, IsOptional, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class CrearPlanAuditoriaDto {
  @ApiProperty({ example: 2025 })
  @Transform(({ value }) => parseInt(value))
  @IsInt() @Min(2020) @Max(2040)
  anio: number;

  @ApiProperty({ example: 'Plan Anual de Auditorías Internas 2025' })
  @IsString() @IsNotEmpty()
  nombre: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  descripcion?: string;

  @ApiProperty({ description: 'UUID del área responsable del plan (Oficina de Calidad)' })
  @IsUUID('4')
  area_responsable_id: string;
}

// ─────────────────────────────────────────────────────────
