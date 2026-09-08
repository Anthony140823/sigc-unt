// src/modules/health/health.service.ts
// ================================================================
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as os from 'os';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async checkHealth() {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkMemory(),
    ]);

    const [dbCheck, memCheck] = checks;

    const database = dbCheck.status === 'fulfilled' ? dbCheck.value : {
      status: 'down',
      error: dbCheck.reason?.message ?? 'Unknown error',
    };

    const memory = memCheck.status === 'fulfilled' ? memCheck.value : {
      status: 'down',
    };

    const allHealthy = database.status === 'up';

    return {
      status:  allHealthy ? 'healthy' : 'degraded',
      version: process.env.npm_package_version ?? '1.0.0',
      entorno: this.config.get('app.nodeEnv'),
      uptime:  this.formatUptime(Date.now() - this.startTime),
      timestamp: new Date().toISOString(),
      checks: {
        database,
        memory,
        sistema: {
          status:       'up',
          plataforma:   process.platform,
          node_version: process.version,
          cpu_cores:    os.cpus().length,
        },
      },
    };
  }

  private async checkDatabase(): Promise<{ status: string; latencia_ms?: number }> {
    const inicio = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'up', latencia_ms: Date.now() - inicio };
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      return { status: 'down', latencia_ms: Date.now() - inicio };
    }
  }

  private checkMemory(): { status: string; uso_mb: number; total_mb: number; porcentaje: number } {
    const usado  = process.memoryUsage().rss / 1024 / 1024;
    const total  = os.totalmem() / 1024 / 1024;
    const porcentaje = Math.round((usado / total) * 100);

    return {
      status:     porcentaje < 90 ? 'up' : 'warning',
      uso_mb:     Math.round(usado),
      total_mb:   Math.round(total),
      porcentaje,
    };
  }

  private formatUptime(ms: number): string {
    const segundos = Math.floor(ms / 1000);
    const horas    = Math.floor(segundos / 3600);
    const minutos  = Math.floor((segundos % 3600) / 60);
    const segs     = segundos % 60;
    return `${horas}h ${minutos}m ${segs}s`;
  }
}

// ================================================================
