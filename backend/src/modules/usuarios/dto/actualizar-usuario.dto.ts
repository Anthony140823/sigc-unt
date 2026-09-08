import { CrearUsuarioDto } from './crear-usuario.dto';
// src/modules/usuarios/dto/actualizar-usuario.dto.ts
import { PartialType, OmitType } from '@nestjs/swagger';

export class ActualizarUsuarioDto extends PartialType(
  OmitType(CrearUsuarioDto, ['password', 'username', 'codigo_usuario', 'rol_id'] as const),
) {}

// ─────────────────────────────────────────────────────────
