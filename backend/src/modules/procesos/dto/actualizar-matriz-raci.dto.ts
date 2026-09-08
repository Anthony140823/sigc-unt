// src/modules/procesos/dto/actualizar-matriz-raci.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsIn, IsOptional, IsString } from 'class-validator';

export class ActualizarMatrizRaciDto {
  @ApiPropertyOptional()
  @IsOptional() @IsUUID('4')
  subproceso_id?: string;

  @ApiProperty()
  @IsUUID('4')
  area_id: string;

  @ApiPropertyOptional()
  @IsOptional() @IsUUID('4')
  usuario_id?: string;

  @ApiProperty({ enum: ['R','A','C','I'], description: 'R=Responsable, A=Aprobador, C=Consultado, I=Informado' })
  @IsIn(['R','A','C','I'])
  rol_raci: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  descripcion?: string;
}
