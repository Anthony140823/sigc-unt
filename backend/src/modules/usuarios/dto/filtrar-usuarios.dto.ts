export enum TipoUsuario { ADMIN = 'ADMIN', EVALUADOR = 'EVALUADOR', CONSULTA = 'CONSULTA', AUDITOR = 'AUDITOR' }
// src/modules/usuarios/dto/filtrar-usuarios.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsString, IsUUID, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

export class FiltrarUsuariosDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sortBy?: string = 'creado_en';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  order?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional({ description: 'Buscar por nombre, username, email o código' })
  @IsOptional()
  @IsString()
  busqueda?: string;

  @ApiPropertyOptional({ enum: TipoUsuario })
  @IsOptional()
  @IsEnum(TipoUsuario)
  tipo_usuario?: TipoUsuario;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  area_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  esta_activo?: boolean;
}

// ─────────────────────────────────────────────────────────
