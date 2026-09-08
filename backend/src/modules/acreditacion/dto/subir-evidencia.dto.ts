// src/modules/acreditacion/dto/subir-evidencia.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsNotEmpty, IsIn, IsUUID, IsOptional,
  IsNumber, IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class SubirEvidenciaDto {
  @ApiProperty({
    enum: ['AUTOEVALUACION','HALLAZGO','CAPA_ACCION','INSPECCION','MEDICION','RIESGO','DOCUMENTO'],
  })
  @IsIn(['AUTOEVALUACION','HALLAZGO','CAPA_ACCION','INSPECCION','MEDICION','RIESGO','DOCUMENTO'])
  entidad_tipo: string;

  @ApiProperty({ description: 'UUID de la entidad a la que pertenece la evidencia' })
  @IsUUID('4')
  entidad_id: string;

  @ApiProperty({ example: 'Resolución de aprobación del plan de estudios 2024' })
  @IsString() @IsNotEmpty()
  nombre: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  descripcion?: string;

  @ApiPropertyOptional({ description: 'Ruta del archivo en MinIO (bucket/carpeta/archivo.ext)' })
  @IsOptional() @IsString()
  archivo_url?: string;

  @ApiPropertyOptional({ example: 'application/pdf' })
  @IsOptional() @IsString()
  tipo_mime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  tamano_bytes?: number;

  @ApiPropertyOptional({ example: 'EV-AA-2025-001' })
  @IsOptional() @IsString()
  codigo_evidencia?: string;

  @ApiPropertyOptional({ example: '2025-01-15' })
  @IsOptional() @IsDateString()
  fecha_documento?: string;
}

// ─────────────────────────────────────────────────────────
