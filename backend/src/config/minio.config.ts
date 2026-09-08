// src/config/minio.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('minio', () => ({
  endpoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000', 10),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || '',
  secretKey: process.env.MINIO_SECRET_KEY || '',
  buckets: {
    documentos: process.env.MINIO_BUCKET_DOCUMENTOS || 'sigc-documentos',
    evidencias: process.env.MINIO_BUCKET_EVIDENCIAS || 'sigc-evidencias',
    reportes: process.env.MINIO_BUCKET_REPORTES || 'sigc-reportes',
  },
}));
