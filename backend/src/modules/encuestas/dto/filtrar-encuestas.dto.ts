// src/modules/encuestas/dto/filtrar-encuestas.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class FiltrarEncuestasDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional() @Transform(({ value }) => parseInt(value))
  limit?: number = 20;

  @ApiPropertyOptional() @IsOptional()
  sortBy?: string = 'creado_en';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'] }) @IsOptional()
  order?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional({ description: 'ESTUDIANTE | DOCENTE | EGRESADO | ADMINISTRATIVO | EXTERNO' })
  @IsOptional() @IsString()
  poblacion?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsUUID()
  programa_id?: string;

  @ApiPropertyOptional({ description: 'DISENO | ACTIVA | CERRADA | ANULADA' })
  @IsOptional() @IsString()
  estado_codigo?: string;
}
