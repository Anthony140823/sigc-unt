// src/modules/auditorias/dto/asignar-auditor.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsIn } from 'class-validator';

export class AsignarAuditorDto {
  @ApiProperty()
  @IsUUID('4')
  usuario_id: string;

  @ApiProperty({ enum: ['LIDER','AUDITOR','OBSERVADOR','EXPERTO_TECNICO'] })
  @IsIn(['LIDER','AUDITOR','OBSERVADOR','EXPERTO_TECNICO'])
  rol_auditoria: string;
}

// ─────────────────────────────────────────────────────────
