import { PartialType } from '@nestjs/swagger';
import { CrearProgramaAcademicoDto } from './crear-programa-academico.dto';
export class ActualizarProgramaAcademicoDto extends PartialType(CrearProgramaAcademicoDto) {}
