// src/modules/documentos/documentos.module.ts
import { Module } from '@nestjs/common';
import { DocumentosController } from './documentos.controller';
import { DocumentosService } from './documentos.service';
import { MinioService } from './minio.service';

@Module({
  controllers: [DocumentosController],
  providers: [DocumentosService, MinioService],
  exports: [DocumentosService],
})
export class DocumentosModule {}
