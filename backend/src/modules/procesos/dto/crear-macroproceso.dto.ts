// src/modules/procesos/dto/crear-macroproceso.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsIn, IsOptional, IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CrearMacroProcesoDto {
  @ApiProperty({ example: 'MP-MIS-01' })
  @IsString() @IsNotEmpty()
  codigo: string;

  @ApiProperty({ example: 'Formación Académica de Pregrado' })
  @IsString() @IsNotEmpty()
  nombre: string;

  @ApiProperty({ enum: ['ESTRATEGICO', 'MISIONAL', 'SOPORTE'] })
  @IsIn(['ESTRATEGICO', 'MISIONAL', 'SOPORTE'])
  tipo: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  descripcion?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt() @Min(0)
  orden?: number;
}

// ─────────────────────────────────────────────────────────
