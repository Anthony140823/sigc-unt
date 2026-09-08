// src/modules/capa/dto/crear-accion-capa.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsIn, IsDateString, IsOptional } from 'class-validator';

export class CrearAccionCapaDto {
  @ApiProperty({ enum: ['CORRECTIVA','PREVENTIVA','MEJORA','CONTENCION'] })
  @IsIn(['CORRECTIVA','PREVENTIVA','MEJORA','CONTENCION'])
  tipo_accion: string;

  @ApiProperty({ example: 'Capacitar al personal de admisión en el POE-ADM-003 de digitalización' })
  @IsString() @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ description: 'UUID del responsable de ejecutar la acción' })
  @IsUUID('4')
  responsable_id: string;

  @ApiProperty()
  @IsUUID('4')
  area_id: string;

  @ApiProperty({ example: '2025-07-31' })
  @IsDateString()
  fecha_compromiso: string;

  @ApiPropertyOptional({ example: 'Personal capacitado y evaluado en el procedimiento de digitalización' })
  @IsOptional() @IsString()
  resultado_esperado?: string;

  @ApiPropertyOptional({ example: 'Horas de capacitación, materiales de formación' })
  @IsOptional() @IsString()
  recursos_requeridos?: string;
}

// ─────────────────────────────────────────────────────────
