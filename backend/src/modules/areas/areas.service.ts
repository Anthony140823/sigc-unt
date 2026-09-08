// src/modules/areas/areas.service.ts
// ================================================================
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CrearAreaDto } from './dto/crear-area.dto';
import { ActualizarAreaDto } from './dto/actualizar-area.dto';

@Injectable()
export class AreasService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(dto: CrearAreaDto, creadoPor: string) {
    const existe = await this.prisma.areas.findFirst({ where: { codigo: dto.codigo } });
    if (existe) throw new ConflictException(`Ya existe un área con código ${dto.codigo}.`);

    return this.prisma.areas.create({
      data: {
        codigo: dto.codigo,
        nombre: dto.nombre,
        nombre_corto: dto.nombre_corto,
        facultad_id: dto.facultad_id,
        area_padre_id: dto.area_padre_id,
        tipo_area: dto.tipo_area,
        responsable_nombre: dto.responsable_nombre,
        email: dto.email,
        creado_por: creadoPor,
      },
      include: {
        facultades: { select: { nombre_corto: true } },
        areas: { select: { nombre: true } },   // área padre
      },
    });
  }

  async findAll(soloActivos = true) {
    return this.prisma.areas.findMany({
      where: soloActivos ? { esta_activo: true } : {},
      include: {
        facultades: { select: { nombre: true, nombre_corto: true } },
        other_areas: { // sub-áreas
          where: { esta_activo: true },
          select: { id: true, codigo: true, nombre: true, tipo_area: true },
        },
      },
      orderBy: [{ tipo_area: 'asc' }, { nombre: 'asc' }],
    });
  }

  async findOne(id: string) {
    const area = await this.prisma.areas.findUnique({
      where: { id },
      include: {
        facultades: true,
        areas: { select: { id: true, nombre: true, codigo: true } },  // padre
        other_areas: {
          where: { esta_activo: true },
          select: { id: true, codigo: true, nombre: true },
        },
        usuarios: {
          where: { esta_activo: true, eliminado_en: null },
          select: { id: true, nombres: true, apellidos: true, cargo: true },
        },
        _count: { select: { procesos: true, documentos: true } },
      },
    });
    if (!area) throw new NotFoundException(`Área ${id} no encontrada.`);
    return area;
  }

  async actualizar(id: string, dto: ActualizarAreaDto, modificadoPor: string) {
    await this.findOne(id);
    return this.prisma.areas.update({
      where: { id },
      data: { ...dto, modificado_por: modificadoPor },
    });
  }

  async arbolJerarquico() {
    // Retorna todas las áreas para construir el árbol en el frontend
    return this.prisma.areas.findMany({
      where: { esta_activo: true },
      select: {
        id: true, codigo: true, nombre: true, nombre_corto: true,
        tipo_area: true, area_padre_id: true,
        facultades: { select: { codigo: true, nombre_corto: true } },
        _count: { select: { usuarios: true } },
      },
      orderBy: { nombre: 'asc' },
    });
  }
}

// ================================================================
