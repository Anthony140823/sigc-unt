import { PartialType } from '@nestjs/swagger';
import { CrearNoConformidadDto } from './crear-no-conformidad.dto';
export class ActualizarNoConformidadDto extends PartialType(CrearNoConformidadDto) {}
