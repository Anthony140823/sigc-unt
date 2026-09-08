// src/modules/encuestas/dto/crear-seccion.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CrearSeccionDto {
  @ApiProperty({ example: 'Calidad de la Enseñanza' })
  @IsString() @IsNotEmpty()
  titulo: string;

  @ApiPropertyOptional({ example: 'Evalúe los aspectos relacionados con la metodología de enseñanza.' })
  @IsOptional() @IsString()
  descripcion?: string;
}

// ─────────────────────────────────────────────────────────
