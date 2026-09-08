// src/modules/capa/dto/verificar-efectividad.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class VerificarEfectividadDto {
  @ApiProperty({ example: true, description: '¿La acción fue efectiva para eliminar la causa raíz?' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  es_efectiva: boolean;

  @ApiProperty({ example: 'Se verificó que el 100% del personal fue capacitado y aprobó la evaluación.' })
  @IsString() @IsNotEmpty()
  descripcion_verificacion: string;

  @ApiPropertyOptional({ example: 'Personal capacitado al 100%, tasa de digitalización subió al 95%' })
  @IsOptional() @IsString()
  resultado_obtenido?: string;
}
