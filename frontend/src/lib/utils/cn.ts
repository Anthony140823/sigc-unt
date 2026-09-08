// src/lib/utils/cn.ts
// Utilidad para combinar clases Tailwind condicionalmente
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// src/lib/utils/fecha.ts
import { format, formatDistance, differenceInDays, isAfter, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

export const formatFecha = (fecha: string | Date, patron = 'dd/MM/yyyy') =>
  format(new Date(fecha), patron, { locale: es });

export const formatFechaHora = (fecha: string | Date) =>
  format(new Date(fecha), 'dd/MM/yyyy HH:mm', { locale: es });

export const formatRelativo = (fecha: string | Date) =>
  formatDistance(new Date(fecha), new Date(), { addSuffix: true, locale: es });

export const diasHasta = (fecha: string | Date): number =>
  differenceInDays(new Date(fecha), new Date());

export const estaVencido = (fecha: string | Date): boolean =>
  isAfter(new Date(), new Date(fecha));

export const estaProximoAVencer = (fecha: string | Date, dias = 15): boolean => {
  const f = new Date(fecha);
  return isAfter(f, new Date()) && !isAfter(f, addDays(new Date(), dias));
};

// src/lib/utils/formato.ts
/** Formatea número con separadores peruanos */
export const formatNumero = (n: number, decimales = 2) =>
  n.toLocaleString('es-PE', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });

/** Formatea bytes en tamaño legible */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = 2;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

/** Obtiene las iniciales de un nombre */
export const obtenerIniciales = (nombres: string, apellidos: string): string =>
  `${nombres.charAt(0)}${apellidos.charAt(0)}`.toUpperCase();

/** Trunca texto con elipsis */
export const truncar = (texto: string, maxCaracteres: number): string =>
  texto.length > maxCaracteres ? `${texto.substring(0, maxCaracteres)}...` : texto;

/** Convierte código de semáforo a clase CSS */
export const claseSemaforo = (estado: 'VERDE' | 'AMARILLO' | 'ROJO' | string): string => {
  const mapa: Record<string, string> = {
    VERDE:    'text-green-600',
    AMARILLO: 'text-amber-500',
    ROJO:     'text-red-600',
  };
  return mapa[estado] ?? 'text-gray-500';
};

/** Convierte color hexadecimal a clase Tailwind de fondo */
export const colorHexABg = (hex?: string): string => {
  if (!hex) return 'bg-gray-100';
  // Retorna estilo inline para colores dinámicos
  return '';
};

/** Genera el estilo de color dinámico para estados con color_hex */
export const estiloEstado = (colorHex?: string) => ({
  backgroundColor: colorHex ? `${colorHex}20` : undefined,
  color:           colorHex ?? undefined,
});
