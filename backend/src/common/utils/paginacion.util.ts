// src/common/utils/paginacion.util.ts
import { OpcionesPaginacion, RespuestaPaginada } from '../interfaces/jwt-payload.interface';

export function construirPaginacion(opciones: OpcionesPaginacion) {
  const pagina = Math.max(1, opciones.page || 1);
  const limite = Math.min(100, Math.max(1, opciones.limit || 20));
  const skip = (pagina - 1) * limite;
  const order = opciones.order === 'ASC' ? 'asc' : 'desc';
  const sortBy = opciones.sortBy || 'creado_en';

  return { pagina, limite, skip, order, sortBy };
}

export function construirRespuestaPaginada<T>(
  datos: T[],
  total: number,
  pagina: number,
  limite: number,
): RespuestaPaginada<T> {
  const totalPaginas = Math.ceil(total / limite);
  return {
    datos,
    meta: {
      total,
      pagina,
      limite,
      totalPaginas,
      tieneSiguiente: pagina < totalPaginas,
      tieneAnterior: pagina > 1,
    },
  };
}

// src/common/utils/codigo.util.ts
/**
 * Genera un código secuencial con prefijo y año
 * Ej: NC-2025-0042, RIES-2025-0015
 */
export function generarCodigo(prefijo: string, secuencia: number, anio?: number): string {
  const año = anio || new Date().getFullYear();
  const seq = String(secuencia).padStart(4, '0');
  return `${prefijo}-${año}-${seq}`;
}

// src/common/utils/fecha.util.ts
import { addDays, format, differenceInDays, isAfter, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';

export const formatearFecha = (fecha: Date): string =>
  format(fecha, 'dd/MM/yyyy', { locale: es });

export const formatearFechaHora = (fecha: Date): string =>
  format(fecha, 'dd/MM/yyyy HH:mm', { locale: es });

export const diasHastaFecha = (fecha: Date): number =>
  differenceInDays(fecha, new Date());

export const estaVencido = (fecha: Date): boolean =>
  isBefore(fecha, new Date());

export const estaProximoAVencer = (fecha: Date, diasAntelacion = 15): boolean => {
  const limite = addDays(new Date(), diasAntelacion);
  return isAfter(fecha, new Date()) && isBefore(fecha, limite);
};

// src/common/utils/semaforo.util.ts
export type ColorSemaforo = 'VERDE' | 'AMARILLO' | 'ROJO';

export function calcularSemaforo(
  valorReal: number,
  valorMeta: number,
  tendencia: 'MAYOR' | 'MENOR' | 'NOMINAL',
): ColorSemaforo {
  if (valorMeta === 0) return 'VERDE';
  const porcentaje = (valorReal / valorMeta) * 100;

  if (tendencia === 'MAYOR') {
    if (porcentaje >= 95) return 'VERDE';
    if (porcentaje >= 80) return 'AMARILLO';
    return 'ROJO';
  }

  if (tendencia === 'MENOR') {
    if (porcentaje <= 105) return 'VERDE';
    if (porcentaje <= 120) return 'AMARILLO';
    return 'ROJO';
  }

  // NOMINAL: ±5% verde, ±10% amarillo, resto rojo
  const desviacion = Math.abs(porcentaje - 100);
  if (desviacion <= 5) return 'VERDE';
  if (desviacion <= 10) return 'AMARILLO';
  return 'ROJO';
}
