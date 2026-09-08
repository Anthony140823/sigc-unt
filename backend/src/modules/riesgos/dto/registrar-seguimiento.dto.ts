// src/modules/riesgos/dto/registrar-seguimiento.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, Min, Max, IsIn, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class RegistrarSeguimientoDto {
  @ApiProperty({ example: 2 })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber() @Min(1) @Max(5)
  probabilidad_actual: number;

  @ApiProperty({ example: 3 })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber() @Min(1) @Max(5)
  impacto_actual: number;

  @ApiProperty({ enum: ['EFECTIVO','PARCIALMENTE_EFECTIVO','INEFECTIVO'] })
  @IsIn(['EFECTIVO','PARCIALMENTE_EFECTIVO','INEFECTIVO'])
  estado_control: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  observaciones?: string;
}
