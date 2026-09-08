import { CrearIndicadorDto } from './crear-indicador.dto';
// src/modules/indicadores/dto/actualizar-indicador.dto.ts
import { PartialType, OmitType } from '@nestjs/swagger';
export class ActualizarIndicadorDto extends PartialType(
  OmitType(CrearIndicadorDto, ['codigo'] as const),
) {}

// ─────────────────────────────────────────────────────────
