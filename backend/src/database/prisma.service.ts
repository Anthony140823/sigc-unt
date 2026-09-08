// src/database/prisma.service.ts
import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'warn' },
      ],
    });

    // Middleware de soft-delete: filtra automáticamente registros eliminados
    // en tablas que tengan el campo eliminado_en
    this.$use(async (params: any, next: any) => {
      const softDeleteModels = [
        'usuarios',
        'documentos',
      ];

      if (softDeleteModels.includes(params.model?.toLowerCase() ?? '')) {
        // Filtrar en findMany, findFirst, findUnique
        if (params.action === 'findMany' || params.action === 'findFirst') {
          params.args = params.args ?? {};
          params.args.where = params.args.where ?? {};
          if (params.args.where.eliminado_en === undefined) {
            params.args.where.eliminado_en = null;
          }
        }
        // Convertir delete en soft-delete
        if (params.action === 'delete') {
          params.action = 'update';
          params.args.data = { eliminado_en: new Date() };
        }
        if (params.action === 'deleteMany') {
          params.action = 'updateMany';
          params.args.data = { eliminado_en: new Date() };
        }
      }

      return next(params);
    });

    // Log de queries en desarrollo
    if (process.env.NODE_ENV === 'development') {
      (this as any).$on('query', (e: any) => {
        if (e.duration > 500) {
          this.logger.warn(`Query lenta (${e.duration}ms): ${e.query}`);
        }
      });
    }
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('✅ Conexión a PostgreSQL establecida (Prisma)');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('🔌 Conexión a PostgreSQL cerrada');
  }

  /**
   * Limpia todas las tablas para tests (solo entorno test)
   */
  async cleanDatabase() {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('cleanDatabase solo puede usarse en entorno test');
    }
    const tables = await this.$queryRaw<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'sigc_unt'
      ORDER BY tablename
    `;
    for (const { tablename } of tables) {
      await this.$executeRawUnsafe(
        `TRUNCATE sigc_unt.${tablename} CASCADE`,
      );
    }
  }
}
