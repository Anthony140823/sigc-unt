import { PartialType } from '@nestjs/swagger';
import { CrearFacultadDto } from './crear-facultad.dto';
export class ActualizarFacultadDto extends PartialType(CrearFacultadDto) {}
