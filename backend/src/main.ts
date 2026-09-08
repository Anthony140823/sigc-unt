import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const config = app.get(ConfigService);
  const port = config.get<number>('PORT', 4000);
  const frontendUrl = config.get<string>('FRONTEND_URL', 'http://localhost:3000');
  const allowedOrigins = frontendUrl
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const nodeEnv = config.get<string>('NODE_ENV', 'development');

  // Seguridad HTTP headers
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  // Compresión de respuestas
  app.use(compression());

  // CORS configurado
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  });

  // Prefijo global de API
  app.setGlobalPrefix('api');

  // Versionado de API
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // Eliminar propiedades no decoradas
      forbidNonWhitelisted: true, // Rechazar propiedades extra
      transform: true,           // Transformar tipos automáticamente
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Filtros globales de errores
  app.useGlobalFilters(new HttpExceptionFilter());

  // Interceptores globales
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // Swagger / OpenAPI (solo en desarrollo)
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('SIGC-UNT API')
      .setDescription(
        'Sistema Integrado de Gestión de la Calidad — Universidad Nacional de Trujillo.\n\n' +
        'API RESTful para la gestión de calidad institucional, acreditación, auditorías, ' +
        'indicadores, riesgos y satisfacción de partes interesadas.',
      )
      .setVersion('1.0')
      .setContact('Oficina de Calidad UNT', 'https://unitru.edu.pe', 'calidad@unitru.edu.pe')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
        'access-token',
      )
      .addTag('auth', 'Autenticación y sesiones')
      .addTag('usuarios', 'Gestión de usuarios y roles')
      .addTag('areas', 'Estructura organizacional')
      .addTag('documentos', 'Módulo GD — Gestión Documental')
      .addTag('procesos', 'Módulo MP — Mapa de Procesos')
      .addTag('indicadores', 'Módulo IG — Indicadores de Gestión')
      .addTag('acreditacion', 'Módulo AA — Acreditación y Autoevaluación')
      .addTag('auditorias', 'Módulo AI — Auditorías e Inspecciones')
      .addTag('capa', 'Módulo CAPA — Acciones Correctivas y Preventivas')
      .addTag('riesgos', 'Módulo GR — Gestión de Riesgos')
      .addTag('encuestas', 'Módulo GS — Gestión de Satisfacción')
      .addTag('dashboard', 'Dashboards y reportes ejecutivos')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
      },
    });
  }

  await app.listen(port);
  console.log(`\n🚀 SIGC-UNT Backend corriendo en: http://localhost:${port}/api/v1`);
  console.log(`📖 Documentación Swagger: http://localhost:${port}/api/docs`);
  console.log(`🌍 Entorno: ${nodeEnv}\n`);
}

bootstrap();
