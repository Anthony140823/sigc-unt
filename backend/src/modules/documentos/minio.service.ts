// src/modules/documentos/minio.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private client: Minio.Client;
  private buckets: Record<string, string>;

  constructor(private readonly config: ConfigService) {
    this.client = new Minio.Client({
      endPoint: config.get<string>('minio.endpoint', 'localhost'),
      port: config.get<number>('minio.port', 9000),
      useSSL: config.get<boolean>('minio.useSSL', false),
      accessKey: config.get<string>('minio.accessKey', ''),
      secretKey: config.get<string>('minio.secretKey', ''),
    });

    this.buckets = config.get<Record<string, string>>('minio.buckets', {
      documentos: 'sigc-documentos',
      evidencias: 'sigc-evidencias',
      reportes: 'sigc-reportes',
    });
  }

  async onModuleInit() {
    for (const bucket of Object.values(this.buckets)) {
      await this.asegurarBucket(bucket);
    }
  }

  private async asegurarBucket(nombre: string) {
    try {
      const existe = await this.client.bucketExists(nombre);
      if (!existe) {
        await this.client.makeBucket(nombre, 'us-east-1');
        this.logger.log(`Bucket creado: ${nombre}`);
      }
    } catch (error) {
      this.logger.error(`Error al crear bucket ${nombre}:`, error);
    }
  }

  /**
   * Sube un archivo y retorna la URL de acceso
   */
  async subirArchivo(
    bucket: 'documentos' | 'evidencias' | 'reportes',
    nombreArchivo: string,
    buffer: Buffer,
    tipoMime: string,
  ): Promise<string> {
    const nombreBucket = this.buckets[bucket];
    const metadata = { 'Content-Type': tipoMime };

    await this.client.putObject(nombreBucket, nombreArchivo, buffer, buffer.length, metadata);

    return `${bucket}/${nombreArchivo}`;
  }

  /**
   * Genera URL presignada para descarga directa (válida por N segundos)
   */
  async generarUrlDescarga(
    bucket: 'documentos' | 'evidencias' | 'reportes',
    nombreArchivo: string,
    expiracioSegundos = 3600,
  ): Promise<string> {
    const nombreBucket = this.buckets[bucket];
    return this.client.presignedGetObject(
      nombreBucket,
      nombreArchivo,
      expiracioSegundos,
    );
  }

  /**
   * Elimina un archivo del bucket
   */
  async eliminarArchivo(
    bucket: 'documentos' | 'evidencias' | 'reportes',
    nombreArchivo: string,
  ): Promise<void> {
    const nombreBucket = this.buckets[bucket];
    await this.client.removeObject(nombreBucket, nombreArchivo);
  }

  /**
   * Copia un archivo entre rutas (para crear nueva versión del documento)
   */
  async copiarArchivo(
    bucket: 'documentos' | 'evidencias' | 'reportes',
    origenNombre: string,
    destinoNombre: string,
  ): Promise<string> {
    const nombreBucket = this.buckets[bucket];
    const conds = new Minio.CopyConditions();
    await this.client.copyObject(
      nombreBucket,
      destinoNombre,
      `/${nombreBucket}/${origenNombre}`,
      conds,
    );
    return `${bucket}/${destinoNombre}`;
  }

  /**
   * Genera nombre único para un archivo: {prefijo}/{uuid}.{ext}
   */
  generarNombreArchivo(nombreOriginal: string, prefijo: string): string {
    const ext = nombreOriginal.split('.').pop() || 'bin';
    const uuid = require('uuid').v4();
    const timestamp = Date.now();
    return `${prefijo}/${timestamp}-${uuid}.${ext}`;
  }
}
