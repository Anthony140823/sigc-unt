// src/common/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let estado: number;
    let mensaje: string | string[];
    let error: string;

    if (exception instanceof HttpException) {
      estado = exception.getStatus();
      const respuesta = exception.getResponse();

      if (typeof respuesta === 'object' && respuesta !== null) {
        const resp = respuesta as Record<string, any>;
        mensaje = resp.message || resp.mensaje || exception.message;
        error = resp.error || this.obtenerMensajeEstado(estado);
      } else {
        mensaje = respuesta as string;
        error = this.obtenerMensajeEstado(estado);
      }
    } else {
      estado = HttpStatus.INTERNAL_SERVER_ERROR;
      mensaje = 'Error interno del servidor. Contacte al administrador del sistema.';
      error = 'Error Interno del Servidor';

      // Loguear errores no controlados
      this.logger.error(
        `Error no controlado en ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const cuerpoRespuesta = {
      exito: false,
      statusCode: estado,
      error,
      mensaje,
      ruta: request.url,
      metodo: request.method,
      timestamp: new Date().toISOString(),
    };

    // Log de errores 5xx
    if (estado >= 500) {
      this.logger.error(JSON.stringify(cuerpoRespuesta));
    } else if (estado >= 400) {
      this.logger.warn(JSON.stringify(cuerpoRespuesta));
    }

    response.status(estado).json(cuerpoRespuesta);
  }

  private obtenerMensajeEstado(estado: number): string {
    const mensajes: Record<number, string> = {
      400: 'Solicitud Incorrecta',
      401: 'No Autorizado',
      403: 'Acceso Prohibido',
      404: 'Recurso No Encontrado',
      409: 'Conflicto de Datos',
      422: 'Entidad No Procesable',
      429: 'Demasiadas Solicitudes',
      500: 'Error Interno del Servidor',
      503: 'Servicio No Disponible',
    };
    return mensajes[estado] || 'Error Desconocido';
  }
}
