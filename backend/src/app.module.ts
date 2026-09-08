import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { AreasModule } from './modules/areas/areas.module';
import { DocumentosModule } from './modules/documentos/documentos.module';
import { ProcesosModule } from './modules/procesos/procesos.module';
import { IndicadoresModule } from './modules/indicadores/indicadores.module';
import { AcreditacionModule } from './modules/acreditacion/acreditacion.module';
import { AuditoriasModule } from './modules/auditorias/auditorias.module';
import { CapaModule } from './modules/capa/capa.module';
import { RiesgosModule } from './modules/riesgos/riesgos.module';
import { EncuestasModule } from './modules/encuestas/encuestas.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { HealthModule } from './modules/health/health.module';
import { CommonModule } from './common/common.module';
import { CatalogosModule } from './modules/catalogos/catalogos.module';
import { FacultadesModule } from './modules/facultades/facultades.module';
import { ProgramasAcademicosModule } from './modules/programas-academicos/programas-academicos.module';
import { BscModule } from './modules/bsc/bsc.module';
import { ChatbotModule } from './modules/chatbot/chatbot.module';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import minioConfig from './config/minio.config';
import redisConfig from './config/redis.config';

@Module({
  imports: [
    // Configuración global con validación
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, minioConfig, redisConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting global
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ([{
        ttl: config.get<number>('THROTTLE_TTL', 60) * 1000,
        limit: config.get<number>('THROTTLE_LIMIT', 100),
      }]),
    }),

    // Tareas programadas (alertas de vencimiento, reportes automáticos)
    ScheduleModule.forRoot(),

    // Sistema de eventos internos (notificaciones, logs de auditoría)
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 20,
    }),

    // Módulo de base de datos (Prisma)
    DatabaseModule,

    // Módulo común global (Email, Exportacion, etc.)
    CommonModule,

    // Módulos funcionales del SIGC
    AuthModule,
    UsuariosModule,
    AreasModule,
    DocumentosModule,
    ProcesosModule,
    IndicadoresModule,
    AcreditacionModule,
    AuditoriasModule,
    CapaModule,
    RiesgosModule,
    EncuestasModule,
    DashboardModule,
    HealthModule,
    CatalogosModule,
    FacultadesModule,
    ProgramasAcademicosModule,
    BscModule,
    ChatbotModule,
  ],
})
export class AppModule {}
