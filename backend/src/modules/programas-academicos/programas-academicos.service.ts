import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CrearProgramaAcademicoDto } from './dto/crear-programa-academico.dto';
import { ActualizarProgramaAcademicoDto } from './dto/actualizar-programa-academico.dto';

@Injectable()
export class ProgramasAcademicosService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(dto: CrearProgramaAcademicoDto) {
    const existe = await this.prisma.programas_academicos.findFirst({ where: { codigo: dto.codigo } });
    if (existe) throw new ConflictException(`Ya existe un programa con código ${dto.codigo}.`);

    const facultad = await this.prisma.facultades.findUnique({ where: { id: dto.facultad_id } });
    if (!facultad) throw new NotFoundException(`Facultad ${dto.facultad_id} no encontrada.`);

    return this.prisma.programas_academicos.create({
      data: dto,
      include: { facultades: { select: { nombre: true, nombre_corto: true } } },
    });
  }

  async findAll(soloActivos = true) {
    return this.prisma.programas_academicos.findMany({
      where: soloActivos ? { esta_activo: true } : {},
      include: {
        facultades: { select: { id: true, nombre: true, nombre_corto: true } },
      },
      orderBy: [{ facultades: { nombre: 'asc' } }, { nombre: 'asc' }],
    });
  }

  async findOne(id: string) {
    const programa = await this.prisma.programas_academicos.findUnique({
      where: { id },
      include: {
        facultades: true,
        _count: { select: { procesos_acreditacion: true, encuestas: true } },
      },
    });
    if (!programa) throw new NotFoundException(`Programa académico ${id} no encontrado.`);
    return programa;
  }

  async actualizar(id: string, dto: ActualizarProgramaAcademicoDto) {
    await this.findOne(id);
    return this.prisma.programas_academicos.update({
      where: { id },
      data: dto,
      include: { facultades: { select: { nombre: true, nombre_corto: true } } },
    });
  }

  async toggleActivo(id: string) {
    const programa = await this.findOne(id);
    return this.prisma.programas_academicos.update({
      where: { id },
      data: { esta_activo: !programa.esta_activo },
    });
  }
}
