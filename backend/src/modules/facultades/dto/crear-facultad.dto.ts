import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEmail, IsBoolean } from 'class-validator';

export class CrearFacultadDto {
  @ApiProperty({ example: 'FAC-ING' })
  @IsString() @IsNotEmpty()
  codigo: string;

  @ApiProperty({ example: 'Facultad de Ingeniería' })
  @IsString() @IsNotEmpty()
  nombre: string;

  @ApiPropertyOptional({ example: 'Fac. Ingeniería' })
  @IsOptional() @IsString()
  nombre_corto?: string;

  @ApiPropertyOptional({ example: 'Dr. Juan Pérez' })
  @IsOptional() @IsString()
  decano_nombre?: string;

  @ApiPropertyOptional({ example: 'decano@unitru.edu.pe' })
  @IsOptional() @IsEmail()
  email?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional() @IsBoolean()
  esta_activo?: boolean;
}
