// src/modules/capa/dto/crear-no-conformidad.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsNotEmpty, IsOptional, IsUUID, IsIn, IsDateString,
} from 'class-validator';

export class CrearNoConformidadDto {
  @ApiProperty({
    enum: ['AUDITORIA','INSPECCION','QUEJA','INDICADOR','REVISION_DIRECCION','AUTOEVALUACION','OTRO'],
    description: 'Origen de la no conformidad',
  })
  @IsIn(['AUDITORIA','INSPECCION','QUEJA','INDICADOR','REVISION_DIRECCION','AUTOEVALUACION','OTRO'])
  origen: string;

  @ApiPropertyOptional({ description: 'UUID del hallazgo de auditoría que la origina (si aplica)' })
  @IsOptional() @IsUUID('4')
  hallazgo_id?: string;

  @ApiProperty({ example: 'Los expedientes de egresados no están digitalizados según el POE-ADM-003.' })
  @IsString() @IsNotEmpty({ message: 'La descripción es requerida.' })
  descripcion: string;

  @ApiPropertyOptional({ example: 'Requisito 7.5.3 ISO 21001:2018 - Control de la información documentada' })
  @IsOptional() @IsString()
  requisito_afectado?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsUUID('4')
  proceso_id?: string;

  @ApiProperty({ description: 'UUID del área donde se detectó la NC' })
  @IsUUID('4')
  area_id: string;

  @ApiPropertyOptional({ description: 'UUID del usuario que detectó la NC (por defecto: usuario autenticado)' })
  @IsOptional() @IsUUID('4')
  detectado_por?: string;

  @ApiPropertyOptional({ example: '2025-04-10' })
  @IsOptional() @IsDateString()
  fecha_deteccion?: string;
}

// ─────────────────────────────────────────────────────────
