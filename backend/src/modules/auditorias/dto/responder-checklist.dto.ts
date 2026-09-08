// src/modules/auditorias/dto/responder-checklist.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, ValidateNested, IsUUID, IsString, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class ItemRespuestaDto {
  @ApiProperty() @IsUUID('4')
  item_id: string;

  @ApiProperty({ example: 'SI', description: 'SI | NO | N/A | valor numérico' })
  @IsString()
  respuesta: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  observacion?: string;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  genera_hallazgo?: boolean;
}

export class ResponderChecklistDto {
  @ApiProperty({ type: [ItemRespuestaDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemRespuestaDto)
  items: ItemRespuestaDto[];
}

// ─────────────────────────────────────────────────────────
