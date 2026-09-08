// src/modules/documentos/dto/crear-documento.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsNotEmpty, IsOptional, IsUUID, IsInt,
  IsPositive, IsArray, Matches,
} from 'class-validator';

export class CrearDocumentoDto {
  @ApiProperty({ example: 'POL-GD-003', description: 'Código único del documento' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{2,5}-[A-Z]{2,5}-\d{3,4}$/, {
    message: 'El código debe seguir el formato: PREFIJO-AREA-NNN (ej: POL-GD-001)',
  })
  codigo: string;

  @ApiProperty({ example: 2, description: 'ID del tipo de documento' })
  @IsInt()
  @IsPositive()
  tipo_documento_id: number;

  @ApiProperty({ example: 'Política de Control Documental' })
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @ApiPropertyOptional({ example: 'Define los lineamientos para la gestión documental del SGC' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({ example: 'uuid-del-area', description: 'Área propietaria del documento' })
  @IsUUID('4')
  area_id: string;

  @ApiPropertyOptional({ description: 'UUID del proceso al que pertenece' })
  @IsOptional()
  @IsUUID('4')
  proceso_id?: string;

  @ApiPropertyOptional({ example: ['calidad', 'documentos', 'procedimiento'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  palabras_clave?: string[];

  @ApiPropertyOptional({ example: ['Todas las áreas', 'FAC-IND'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  aplica_a?: string[];
}

// ─────────────────────────────────────────────────────────
