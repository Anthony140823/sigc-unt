// src/modules/capa/dto/crear-analisis-causa-raiz.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsPositive, IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CrearAnalisisCausaRaizDto {
  @ApiProperty({ example: 1, description: 'ID del método de análisis' })
  @IsInt() @IsPositive()
  metodo_id: number;

  @ApiProperty({ example: 'El personal de admisión no conoce el procedimiento de digitalización' })
  @IsString() @IsNotEmpty()
  descripcion_causa: string;

  @ApiProperty({ example: 'Falta de capacitación en el procedimiento POE-ADM-003' })
  @IsString() @IsNotEmpty()
  causa_raiz: string;

  @ApiPropertyOptional({ example: ['Falta de tiempo', 'Equipos insuficientes'] })
  @IsOptional() @IsArray() @IsString({ each: true })
  factores_contribuyentes?: string[];

  @ApiPropertyOptional({
    description: 'Datos estructurados del método (5 Porqués, ramas Ishikawa, etc.) en formato JSON',
    example: { preguntas: ['¿Por qué?', '¿Por qué?', '...'] },
  })
  @IsOptional()
  datos_metodo?: Record<string, any>;
}

// ─────────────────────────────────────────────────────────
