import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CrearFacultadDto } from './dto/crear-facultad.dto';
import { ActualizarFacultadDto } from './dto/actualizar-facultad.dto';

@Injectable()
export class FacultadesService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(dto: CrearFacultadDto) {
    const existe = await this.prisma.facultades.findFirst({ where: { codigo: dto.codigo } });
    if (existe) throw new ConflictException(`Ya existe una facultad con código ${dto.codigo}.`);

    return this.prisma.facultades.create({
      data: dto,
    });
  }

  async findAll(soloActivos = true) {
    return this.prisma.facultades.findMany({
      where: soloActivos ? { esta_activo: true } : {},
      include: {
        _count: { select: { programas_academicos: true, areas: true } },
      },
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: string) {
    const facultad = await this.prisma.facultades.findUnique({
      where: { id },
      include: {
        programas_academicos: {
          where: { esta_activo: true },
          orderBy: { nombre: 'asc' },
        },
        areas: {
          where: { esta_activo: true },
          select: { id: true, codigo: true, nombre: true },
          orderBy: { nombre: 'asc' },
        },
      },
    });
    if (!facultad) throw new NotFoundException(`Facultad ${id} no encontrada.`);
    return facultad;
  }

  async actualizar(id: string, dto: ActualizarFacultadDto) {
    await this.findOne(id);
    return this.prisma.facultades.update({
      where: { id },
      data: dto,
    });
  }
}
