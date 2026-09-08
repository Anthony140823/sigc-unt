// src/modules/acreditacion/dto/filtrar-acreditacion.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsInt, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class FiltrarAcreditacionDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional() @Transform(({ value }) => parseInt(value))
  limit?: number = 20;

  @ApiPropertyOptional() @IsOptional()
  sortBy?: string = 'anio_inicio';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'] }) @IsOptional()
  order?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional()
  @IsOptional() @IsUUID()
  programa_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => parseInt(value)) @IsInt()
  estandar_id?: number;

  @ApiPropertyOptional({ description: 'PLANIFICACION | AUTOEVALUACION | VISITA_EXTERNA | ACREDITADO' })
  @IsOptional() @IsString()
  estado_codigo?: string;
}
