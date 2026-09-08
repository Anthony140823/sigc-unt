// src/common/interceptors/transform.interceptor.ts
// Envuelve todas las respuestas exitosas en formato estándar {exito, mensaje, datos}
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RespuestaApi } from '../interfaces/jwt-payload.interface';

function serializarBigInt(value: unknown): unknown {
  if (typeof value === 'bigint') {
    return value <= BigInt(Number.MAX_SAFE_INTEGER)
      ? Number(value)
      : value.toString();
  }
  if (value !== null && value !== undefined && typeof value === 'object' && 's' in value && 'e' in value && 'd' in value) {
    return Number(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => serializarBigInt(item));
  }
  if (value instanceof Date || value === null || value === undefined) {
    return value;
  }
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [
        key,
        serializarBigInt(nestedValue),
      ]),
    );
  }
  return value;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, RespuestaApi<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<RespuestaApi<T>> {
    return next.handle().pipe(
      map((data) => {
        const dataSerializada = serializarBigInt(data) as T;
        // Si el handler ya devuelve el formato estándar, lo respeta
        if (dataSerializada && typeof dataSerializada === 'object' && 'exito' in dataSerializada) {
          return dataSerializada as unknown as RespuestaApi<T>;
        }
        return {
          exito: true,
          mensaje: 'Operación realizada exitosamente',
          datos: dataSerializada,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
