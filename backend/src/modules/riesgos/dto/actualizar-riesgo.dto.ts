import { CrearRiesgoDto } from './crear-riesgo.dto';
// src/modules/riesgos/dto/actualizar-riesgo.dto.ts
import { PartialType, OmitType } from '@nestjs/swagger';
export class ActualizarRiesgoDto extends PartialType(CrearRiesgoDto) {}

// ─────────────────────────────────────────────────────────
