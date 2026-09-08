import { IsString, IsOptional, IsBoolean, IsInt } from 'class-validator';

export class CrearChecklistDto {
  @IsInt()
  tipo_auditoria_id: number;

  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  version?: string;
}

export class ActualizarChecklistDto {
  @IsOptional()
  @IsInt()
  tipo_auditoria_id?: number;

  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsBoolean()
  esta_activo?: boolean;
}

export class CrearItemChecklistDto {
  @IsOptional()
  @IsString()
  criterio_referencia?: string;

  @IsString()
  pregunta: string;

  @IsOptional()
  @IsString()
  descripcion_ayuda?: string;

  @IsOptional()
  @IsString()
  tipo_respuesta?: string;

  @IsOptional()
  @IsBoolean()
  obligatorio?: boolean;

  @IsOptional()
  @IsInt()
  orden?: number;
}

export class ActualizarItemChecklistDto {
  @IsOptional()
  @IsString()
  criterio_referencia?: string;

  @IsOptional()
  @IsString()
  pregunta?: string;

  @IsOptional()
  @IsString()
  descripcion_ayuda?: string;

  @IsOptional()
  @IsString()
  tipo_respuesta?: string;

  @IsOptional()
  @IsBoolean()
  obligatorio?: boolean;

  @IsOptional()
  @IsInt()
  orden?: number;
}
