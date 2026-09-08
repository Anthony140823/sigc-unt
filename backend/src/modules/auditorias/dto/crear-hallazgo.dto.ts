// src/modules/auditorias/dto/crear-hallazgo.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsPositive, IsString, IsNotEmpty, IsUUID, IsOptional, IsDateString } from 'class-validator';

export class CrearHallazgoDto {
  @ApiProperty({ example: 1, description: 'ID del tipo de hallazgo (OM, OBS, NC_MEN, NC_MAY)' })
  @IsInt() @IsPositive()
  tipo_id: number;

  @ApiProperty({ example: 'Los registros de asistencia del semestre 2024-II no están firmados por el coordinador.' })
  @IsString() @IsNotEmpty()
  descripcion: string;

  @ApiPropertyOptional({ example: 'Requisito 7.5.3.2 - Integridad de la información documentada' })
  @IsOptional() @IsString()
  requisito_incumplido?: string;

  @ApiPropertyOptional() @IsOptional() @IsUUID('4')
  proceso_id?: string;

  @ApiProperty()
  @IsUUID('4')
  area_id: string;

  @ApiPropertyOptional({ example: '2025-08-31', description: 'Fecha límite para el cierre del hallazgo' })
  @IsOptional() @IsDateString()
  fecha_limite_cierre?: string;
}

// ─────────────────────────────────────────────────────────
