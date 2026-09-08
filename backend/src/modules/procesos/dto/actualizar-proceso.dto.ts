import { CrearProcesoDto } from './crear-proceso.dto';
// src/modules/procesos/dto/actualizar-proceso.dto.ts
import { PartialType, OmitType } from '@nestjs/swagger';
export class ActualizarProcesoDto extends PartialType(
  OmitType(CrearProcesoDto, ['macroproceso_id', 'codigo'] as const),
) {}

// ─────────────────────────────────────────────────────────
