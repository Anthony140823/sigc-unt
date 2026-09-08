import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class BscService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerTablero() {
    const objetivos = await this.prisma.objetivos_estrategicos.findMany({
      where: { esta_activo: true },
      include: {
        indicadores: {
          where: { esta_activo: true },
          select: {
            id: true,
            codigo: true,
            nombre: true,
            unidad_medida: true,
            tipo_tendencia: true,
            meta_valor: true,
            frecuencias_medicion: { select: { nombre: true } },
            mediciones_indicador: {
              orderBy: { periodo_inicio: 'desc' },
              take: 1,
              select: { valor_real: true, valor_meta: true, estado_semaforo: true, periodo_inicio: true },
            },
          },
        },
      },
      orderBy: [{ perspectiva: 'asc' }, { codigo: 'asc' }],
    });

    const mapa: Record<string, typeof objetivos> = {};
    for (const obj of objetivos) {
      const p = obj.perspectiva || 'Sin perspectiva';
      if (!mapa[p]) mapa[p] = [];
      mapa[p].push(obj);
    }

    const perspectivas = Object.entries(mapa).map(([nombre, items]) => ({
      nombre,
      objetivos: items.map((o) => ({
        id: o.id,
        codigo: o.codigo,
        nombre: o.nombre,
        descripcion: o.descripcion,
        anio_pei: o.anio_pei,
        total_indicadores: o.indicadores.length,
        indicadores: o.indicadores.map((ind) => {
          const ultimaMedicion = ind.mediciones_indicador[0];
          return {
            id: ind.id,
            codigo: ind.codigo,
            nombre: ind.nombre,
            unidad_medida: ind.unidad_medida,
            tipo_tendencia: ind.tipo_tendencia,
            meta_valor: ind.meta_valor,
            frecuencia: ind.frecuencias_medicion?.nombre ?? null,
            ultima_medicion: ultimaMedicion
              ? {
                  valor_real: ultimaMedicion.valor_real,
                  valor_meta: ultimaMedicion.valor_meta,
                  estado_semaforo: ultimaMedicion.estado_semaforo,
                  periodo: ultimaMedicion.periodo_inicio,
                }
              : null,
          };
        }),
      })),
    }));

    return { perspectivas };
  }
}
