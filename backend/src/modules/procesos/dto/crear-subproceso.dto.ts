// src/modules/procesos/dto/crear-subproceso.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CrearSubprocesoDto {
  @ApiProperty({ example: 'SP-ADM-001' })
  @IsString() @IsNotEmpty()
  codigo: string;

  @ApiProperty({ example: 'Recepción de expedientes' })
  @IsString() @IsNotEmpty()
  nombre: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  descripcion?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsUUID('4')
  responsable_id?: string;
}

// ─────────────────────────────────────────────────────────
