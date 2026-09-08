import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsBoolean, IsIn, IsInt } from 'class-validator';
import { Transform } from 'class-transformer';

export class CrearProgramaAcademicoDto {
  @ApiProperty({ example: 'ING-CIV' })
  @IsString() @IsNotEmpty()
  codigo: string;

  @ApiProperty({ example: 'Ingeniería Civil' })
  @IsString() @IsNotEmpty()
  nombre: string;

  @ApiProperty({ enum: ['PREGRADO', 'MAESTRIA', 'DOCTORADO', 'DIPLOMADO', 'SEGUNDA_ESPECIALIDAD'] })
  @IsIn(['PREGRADO', 'MAESTRIA', 'DOCTORADO', 'DIPLOMADO', 'SEGUNDA_ESPECIALIDAD'])
  nivel: string;

  @ApiPropertyOptional({ default: 'PRESENCIAL' })
  @IsOptional() @IsString()
  modalidad?: string;

  @ApiProperty()
  @IsUUID('4')
  facultad_id: string;

  @ApiPropertyOptional()
  @IsOptional() @IsInt() @Transform(({ value }) => parseInt(value))
  duracion_ciclos?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  resolucion_creacion?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional() @IsBoolean()
  esta_activo?: boolean;
}
