import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CrearRolDto, ActualizarRolDto,
  CrearTipoDocumentoDto, ActualizarTipoDocumentoDto,
  CrearFrecuenciaDto, ActualizarFrecuenciaDto,
  CrearTipoAuditoriaDto, ActualizarTipoAuditoriaDto,
  CrearEstandarDto, ActualizarEstandarDto,
  CrearObjetivoEstrategicoDto, ActualizarObjetivoEstrategicoDto,
} from './dto/crear-catalogo.dto';

@Injectable()
export class CatalogosService {
  constructor(private readonly prisma: PrismaService) {}

  // ── TIPOS DOCUMENTO ──────────────────────────────────
  listarTiposDocumento() {
    return this.prisma.tipos_documento.findMany({ orderBy: { id: 'asc' } });
  }

  async crearTipoDocumento(dto: CrearTipoDocumentoDto) {
    const existe = await this.prisma.tipos_documento.findUnique({ where: { codigo: dto.codigo } });
    if (existe) throw new ConflictException(`Código ${dto.codigo} ya existe.`);
    return this.prisma.tipos_documento.create({ data: dto });
  }

  async actualizarTipoDocumento(id: number, dto: ActualizarTipoDocumentoDto) {
    await this.prisma.tipos_documento.findUniqueOrThrow({ where: { id } }).catch(() => { throw new NotFoundException(); });
    return this.prisma.tipos_documento.update({ where: { id }, data: dto });
  }

  async eliminarTipoDocumento(id: number) {
    await this.prisma.tipos_documento.findUniqueOrThrow({ where: { id } }).catch(() => { throw new NotFoundException(); });
    return this.prisma.tipos_documento.delete({ where: { id } });
  }

  // ── FRECUENCIAS MEDICIÓN ────────────────────────────
  listarFrecuenciasMedicion() {
    return this.prisma.frecuencias_medicion.findMany({ orderBy: { id: 'asc' } });
  }

  async crearFrecuencia(dto: CrearFrecuenciaDto) {
    const existe = await this.prisma.frecuencias_medicion.findUnique({ where: { codigo: dto.codigo } });
    if (existe) throw new ConflictException(`Código ${dto.codigo} ya existe.`);
    return this.prisma.frecuencias_medicion.create({ data: dto });
  }

  async actualizarFrecuencia(id: number, dto: ActualizarFrecuenciaDto) {
    await this.prisma.frecuencias_medicion.findUniqueOrThrow({ where: { id } }).catch(() => { throw new NotFoundException(); });
    return this.prisma.frecuencias_medicion.update({ where: { id }, data: dto });
  }

  async eliminarFrecuencia(id: number) {
    await this.prisma.frecuencias_medicion.findUniqueOrThrow({ where: { id } }).catch(() => { throw new NotFoundException(); });
    return this.prisma.frecuencias_medicion.delete({ where: { id } });
  }

  // ── TIPOS AUDITORÍA ────────────────────────────────
  listarTiposAuditoria() {
    return this.prisma.tipos_auditoria.findMany({ orderBy: { id: 'asc' } });
  }

  async crearTipoAuditoria(dto: CrearTipoAuditoriaDto) {
    const existe = await this.prisma.tipos_auditoria.findUnique({ where: { codigo: dto.codigo } });
    if (existe) throw new ConflictException(`Código ${dto.codigo} ya existe.`);
    return this.prisma.tipos_auditoria.create({ data: dto });
  }

  async actualizarTipoAuditoria(id: number, dto: ActualizarTipoAuditoriaDto) {
    await this.prisma.tipos_auditoria.findUniqueOrThrow({ where: { id } }).catch(() => { throw new NotFoundException(); });
    return this.prisma.tipos_auditoria.update({ where: { id }, data: dto });
  }

  async eliminarTipoAuditoria(id: number) {
    await this.prisma.tipos_auditoria.findUniqueOrThrow({ where: { id } }).catch(() => { throw new NotFoundException(); });
    return this.prisma.tipos_auditoria.delete({ where: { id } });
  }

  // ── ESTÁNDARES ACREDITACIÓN ─────────────────────────
  listarEstandaresAcreditacion() {
    return this.prisma.estandares_acreditacion.findMany({ orderBy: { id: 'asc' } });
  }

  async crearEstandar(dto: CrearEstandarDto) {
    const existe = await this.prisma.estandares_acreditacion.findUnique({ where: { codigo: dto.codigo } });
    if (existe) throw new ConflictException(`Código ${dto.codigo} ya existe.`);
    return this.prisma.estandares_acreditacion.create({ data: dto });
  }

  async actualizarEstandar(id: number, dto: ActualizarEstandarDto) {
    await this.prisma.estandares_acreditacion.findUniqueOrThrow({ where: { id } }).catch(() => { throw new NotFoundException(); });
    return this.prisma.estandares_acreditacion.update({ where: { id }, data: dto });
  }

  async eliminarEstandar(id: number) {
    await this.prisma.estandares_acreditacion.findUniqueOrThrow({ where: { id } }).catch(() => { throw new NotFoundException(); });
    return this.prisma.estandares_acreditacion.delete({ where: { id } });
  }

  // ── OBJETIVOS ESTRATÉGICOS ──────────────────────────
  listarObjetivosEstrategicos() {
    return this.prisma.objetivos_estrategicos.findMany({ orderBy: [{ perspectiva: 'asc' }, { codigo: 'asc' }] });
  }

  async crearObjetivo(dto: CrearObjetivoEstrategicoDto) {
    const existe = await this.prisma.objetivos_estrategicos.findUnique({ where: { codigo: dto.codigo } });
    if (existe) throw new ConflictException(`Código ${dto.codigo} ya existe.`);
    return this.prisma.objetivos_estrategicos.create({ data: dto });
  }

  async actualizarObjetivo(id: string, dto: ActualizarObjetivoEstrategicoDto) {
    await this.prisma.objetivos_estrategicos.findUniqueOrThrow({ where: { id } }).catch(() => { throw new NotFoundException(); });
    return this.prisma.objetivos_estrategicos.update({ where: { id }, data: dto });
  }

  async eliminarObjetivo(id: string) {
    await this.prisma.objetivos_estrategicos.findUniqueOrThrow({ where: { id } }).catch(() => { throw new NotFoundException(); });
    return this.prisma.objetivos_estrategicos.delete({ where: { id } });
  }

  // ── ROLES ──────────────────────────────────────────
  listarRoles() {
    return this.prisma.roles.findMany({ orderBy: [{ nivel_jerarquia: 'asc' }, { nombre: 'asc' }] });
  }

  async crearRol(dto: CrearRolDto) {
    const existe = await this.prisma.roles.findUnique({ where: { codigo: dto.codigo } });
    if (existe) throw new ConflictException(`Código ${dto.codigo} ya existe.`);
    return this.prisma.roles.create({ data: dto });
  }

  async actualizarRol(id: number, dto: ActualizarRolDto) {
    await this.prisma.roles.findUniqueOrThrow({ where: { id } }).catch(() => { throw new NotFoundException(); });
    return this.prisma.roles.update({ where: { id }, data: dto });
  }

  async eliminarRol(id: number) {
    const usuariosConRol = await this.prisma.usuarios_roles.count({ where: { rol_id: id } });
    if (usuariosConRol > 0) throw new ConflictException('No se puede eliminar un rol asignado a usuarios.');
    return this.prisma.roles.delete({ where: { id } });
  }

  // ── PROGRAMAS ACADÉMICOS ────────────────────────────
  listarProgramasAcademicos() {
    return this.prisma.programas_academicos.findMany({
      where: { esta_activo: true },
      orderBy: { nombre: 'asc' },
      select: { id: true, codigo: true, nombre: true, nivel: true, modalidad: true },
    });
  }

  // ── FACTORES ESTÁNDAR ────────────────────────────────
  listarFactoresEstandar() {
    return this.prisma.factores_estandar.findMany({
      include: { estandares_acreditacion: { select: { codigo: true, nombre: true } } },
      orderBy: [{ estandar_id: 'asc' }, { orden: 'asc' }],
    });
  }

  obtenerFactoresPorEstandar(estandarId: number) {
    return this.prisma.factores_estandar.findMany({
      where: { estandar_id: estandarId },
      include: { criterios_factor: { orderBy: { orden: 'asc' } } },
      orderBy: { orden: 'asc' },
    });
  }
}
