// src/modules/documentos/dto/aprobar-documento.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsIn } from 'class-validator';

export class AprobarDocumentoDto {
  @ApiProperty({
    example: 'EN_REVISION',
    description: 'Nuevo estado: EN_REVISION | APROBADO | PUBLICADO | BORRADOR | OBSOLETO | ARCHIVADO',
  })
  @IsString()
  @IsIn(['BORRADOR', 'EN_REVISION', 'APROBADO', 'PUBLICADO', 'OBSOLETO', 'ARCHIVADO'], {
    message: 'Estado no válido para el módulo GD.',
  })
  nuevo_estado: string;

  @ApiPropertyOptional({ description: 'UUID de la versión a publicar (requerido para estado PUBLICADO)' })
  @IsOptional()
  @IsUUID('4')
  version_id?: string;

  @ApiPropertyOptional({ example: 'Aprobado conforme a los estándares ISO 21001:2018' })
  @IsOptional()
  @IsString()
  comentarios?: string;
}
