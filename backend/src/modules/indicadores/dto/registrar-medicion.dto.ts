import { Transform } from 'class-transformer';
// src/modules/indicadores/dto/registrar-medicion.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class RegistrarMedicionDto {
  @ApiProperty({ example: '2025-01-01', description: 'Inicio del período de medición' })
  @IsDateString()
  periodo_inicio: string;

  @ApiProperty({ example: '2025-03-31', description: 'Fin del período de medición' })
  @IsDateString()
  periodo_fin: string;

  @ApiProperty({ example: 78.5, description: 'Valor real medido en el período' })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  valor_real: number;

  @ApiPropertyOptional({ example: 80, description: 'Meta vigente (si difiere de la meta del indicador)' })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  valor_meta?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  observaciones?: string;

  @ApiPropertyOptional({ description: 'URL de la evidencia de la medición en MinIO' })
  @IsOptional() @IsString()
  evidencia_url?: string;
}
