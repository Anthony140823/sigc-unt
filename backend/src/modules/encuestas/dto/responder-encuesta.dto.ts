// src/modules/encuestas/dto/responder-encuesta.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray, ValidateNested, IsUUID, IsOptional,
  IsString, IsNumber, IsBoolean,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class RespuestaItemDto {
  @ApiProperty()
  @IsUUID('4')
  pregunta_id: string;

  @ApiPropertyOptional({ description: 'Texto para preguntas abiertas' })
  @IsOptional() @IsString()
  valor_texto?: string;

  @ApiPropertyOptional({ description: 'Valor numérico para Likert/Escala' })
  @IsOptional()
  @Transform(({ value }) => value !== undefined ? parseFloat(value) : undefined)
  @IsNumber()
  valor_numerico?: number;

  @ApiPropertyOptional({
    description: 'Array de IDs de opciones seleccionadas para múltiple selección',
    example: ['opcion-uuid-1', 'opcion-uuid-2'],
  })
  @IsOptional()
  opciones_seleccionadas?: any;
}

export class ResponderEncuestaDto {
  @ApiProperty({ type: [RespuestaItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RespuestaItemDto)
  respuestas: RespuestaItemDto[];

  @ApiPropertyOptional({
    default: false,
    description: 'Si es true, marca la participación como completada. Si false, guarda parcialmente.',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  es_envio_final?: boolean;
}

// ─────────────────────────────────────────────────────────
