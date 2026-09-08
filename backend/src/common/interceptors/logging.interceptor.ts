// src/common/interceptors/logging.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, ip } = req;
    const userAgent = req.get('user-agent') || '';
    const userId = req.user?.sub || 'anónimo';
    const inicio = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse();
          const duracion = Date.now() - inicio;
          const { statusCode } = res;

          this.logger.log(
            `${method} ${url} ${statusCode} ${duracion}ms | Usuario: ${userId} | IP: ${ip} | ${userAgent}`,
          );
        },
        error: (err) => {
          const duracion = Date.now() - inicio;
          this.logger.error(
            `${method} ${url} ${err.status || 500} ${duracion}ms | Usuario: ${userId} | IP: ${ip}`,
          );
        },
      }),
    );
  }
}
