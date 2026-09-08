// src/modules/documentos/dto/crear-version.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';

export class CrearVersionDto {
  @ApiProperty({ example: '2.0', description: 'Número de versión (ej: 1.0, 1.1, 2.0)' })
  @IsString()
  @Matches(/^\d+\.\d+$/, { message: 'El número de versión debe tener formato X.Y (ej: 2.0)' })
  numero_version: string;

  @ApiProperty({ example: 'Se actualizaron los criterios de aprobación según ISO 21001:2018' })
  @IsString()
  @IsNotEmpty({ message: 'El resumen de cambios es obligatorio.' })
  resumen_cambios: string;

  @ApiPropertyOptional({ type: 'string', format: 'binary', description: 'Archivo adjunto (PDF, Word, Excel)' })
  @IsOptional()
  archivo?: any;
}

// ─────────────────────────────────────────────────────────
