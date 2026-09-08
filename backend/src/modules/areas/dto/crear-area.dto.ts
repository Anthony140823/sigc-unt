// src/modules/areas/dto/crear-area.dto.ts
// ================================================================
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsIn, IsEmail } from 'class-validator';

export class CrearAreaDto {
  @ApiProperty({ example: 'OCAL' })
  @IsString() @IsNotEmpty()
  codigo: string;

  @ApiProperty({ example: 'Oficina Central de Calidad Universitaria' })
  @IsString() @IsNotEmpty()
  nombre: string;

  @ApiPropertyOptional({ example: 'Of.Calidad' })
  @IsOptional() @IsString()
  nombre_corto?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsUUID('4')
  facultad_id?: string;

  @ApiPropertyOptional({ description: 'UUID del área padre en la jerarquía' })
  @IsOptional() @IsUUID('4')
  area_padre_id?: string;

  @ApiProperty({ enum: ['RECTORADO','VICERRECTORADO','DECANATO','DIRECCION','OFICINA','DPTO_ACADEMICO'] })
  @IsIn(['RECTORADO','VICERRECTORADO','DECANATO','DIRECCION','OFICINA','DPTO_ACADEMICO'])
  tipo_area: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  responsable_nombre?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsEmail()
  email?: string;
}

import { PartialType } from '@nestjs/swagger';
export class ActualizarAreaDto extends PartialType(CrearAreaDto) {}
