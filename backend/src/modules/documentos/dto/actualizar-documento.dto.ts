import { CrearDocumentoDto } from './crear-documento.dto';
// src/modules/documentos/dto/actualizar-documento.dto.ts
import { PartialType, OmitType } from '@nestjs/swagger';

export class ActualizarDocumentoDto extends PartialType(
  OmitType(CrearDocumentoDto, ['codigo', 'tipo_documento_id'] as const),
) {}

// ─────────────────────────────────────────────────────────
