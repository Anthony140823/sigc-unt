import { IsString, IsNotEmpty, IsOptional, IsInt, IsBoolean, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CrearRolDto {
  @ApiProperty({ example: 'AUDITOR_LIDER' }) @IsString() @IsNotEmpty() codigo: string;
  @ApiProperty({ example: 'Auditor Líder' }) @IsString() @IsNotEmpty() nombre: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descripcion?: string;
  @ApiPropertyOptional({ example: 4 }) @IsOptional() @IsInt() @Min(1) nivel_jerarquia?: number;
}

export class ActualizarRolDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() nombre?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descripcion?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) nivel_jerarquia?: number;
}

export class CrearTipoDocumentoDto {
  @ApiProperty({ example: 'CER' }) @IsString() @IsNotEmpty() codigo: string;
  @ApiProperty({ example: 'Certificado' }) @IsString() @IsNotEmpty() nombre: string;
  @ApiPropertyOptional({ example: 'CER' }) @IsOptional() @IsString() prefijo?: string;
  @ApiPropertyOptional({ default: false }) @IsOptional() @IsBoolean() requiere_aprobacion?: boolean;
}

export class ActualizarTipoDocumentoDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() nombre?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() prefijo?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() requiere_aprobacion?: boolean;
}

export class CrearFrecuenciaDto {
  @ApiProperty({ example: 'BIMESTRAL' }) @IsString() @IsNotEmpty() codigo: string;
  @ApiProperty({ example: 'Bimestral' }) @IsString() @IsNotEmpty() nombre: string;
  @ApiProperty({ example: 60 }) @IsInt() @Min(1) dias_periodo: number;
}

export class ActualizarFrecuenciaDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() nombre?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) dias_periodo?: number;
}

export class CrearTipoAuditoriaDto {
  @ApiProperty({ example: 'SEG' }) @IsString() @IsNotEmpty() codigo: string;
  @ApiProperty({ example: 'Seguimiento' }) @IsString() @IsNotEmpty() nombre: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descripcion?: string;
}

export class ActualizarTipoAuditoriaDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() nombre?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descripcion?: string;
}

export class CrearEstandarDto {
  @ApiProperty({ example: 'ISO_14001' }) @IsString() @IsNotEmpty() codigo: string;
  @ApiProperty({ example: 'ISO 14001:2015 - SGA' }) @IsString() @IsNotEmpty() nombre: string;
  @ApiProperty({ example: 'ISO' }) @IsString() @IsNotEmpty() organismo: string;
  @ApiPropertyOptional({ example: '2015' }) @IsOptional() @IsString() version?: string;
}

export class ActualizarEstandarDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() nombre?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() organismo?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() version?: string;
}

export class CrearObjetivoEstrategicoDto {
  @ApiProperty({ example: 'OE-05' }) @IsString() @IsNotEmpty() codigo: string;
  @ApiProperty({ example: 'Fortalecer la investigación...' }) @IsString() @IsNotEmpty() nombre: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descripcion?: string;
  @ApiProperty({ example: 'Clientes' }) @IsString() @IsNotEmpty() perspectiva: string;
  @ApiProperty({ example: 2025 }) @IsInt() @Min(2020) anio_pei: number;
}

export class ActualizarObjetivoEstrategicoDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() nombre?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descripcion?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() perspectiva?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(2020) anio_pei?: number;
}
