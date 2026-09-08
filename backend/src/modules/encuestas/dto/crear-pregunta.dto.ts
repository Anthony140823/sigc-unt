// src/modules/encuestas/dto/crear-pregunta.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsNotEmpty, IsOptional, IsInt, IsPositive,
  IsBoolean, IsArray, ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class OpcionPreguntaDto {
  @ApiProperty({ example: 'Muy satisfecho' })
  @IsString() @IsNotEmpty()
  texto: string;

  @ApiPropertyOptional({ example: '5' })
  @IsOptional() @IsString()
  valor?: string;
}

export class CrearPreguntaDto {
  @ApiProperty({ example: 1, description: 'ID del tipo de pregunta' })
  @IsInt() @IsPositive()
  tipo_id: number;

  @ApiProperty({ example: '¿Cómo califica la claridad en la exposición de los temas por parte del docente?' })
  @IsString() @IsNotEmpty()
  texto: string;

  @ApiPropertyOptional({ example: 'Considere la claridad, organización y dominio del tema.' })
  @IsOptional() @IsString()
  texto_ayuda?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  obligatoria?: boolean;

  @ApiPropertyOptional({
    description: 'Configuración según tipo: { min_escala: 1, max_escala: 5, etiqueta_min: "Muy malo", etiqueta_max: "Excelente" }',
    example: { min_escala: 1, max_escala: 5 },
  })
  @IsOptional()
  configuracion?: Record<string, any>;

  @ApiPropertyOptional({
    type: [OpcionPreguntaDto],
    description: 'Opciones para preguntas de selección múltiple',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OpcionPreguntaDto)
  opciones?: OpcionPreguntaDto[];
}

// ─────────────────────────────────────────────────────────
