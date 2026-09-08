// src/common/services/email.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface OpcionesEmail {
  para: string | string[];
  asunto: string;
  html: string;
  texto?: string;
  cc?: string[];
  adjuntos?: { filename: string; path?: string; content?: Buffer; contentType?: string }[];
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.get<string>('SMTP_HOST'),
      port: config.get<number>('SMTP_PORT', 587),
      secure: config.get<boolean>('SMTP_SECURE', false),
      auth: {
        user: config.get<string>('SMTP_USER'),
        pass: config.get<string>('SMTP_PASS'),
      },
    });
  }

  async enviar(opciones: OpcionesEmail): Promise<void> {
    try {
      const from = this.config.get<string>('SMTP_FROM', 'SIGC-UNT <calidad@unitru.edu.pe>');
      await this.transporter.sendMail({
        from,
        to: Array.isArray(opciones.para) ? opciones.para.join(',') : opciones.para,
        cc: opciones.cc?.join(','),
        subject: opciones.asunto,
        html: opciones.html,
        text: opciones.texto,
        attachments: opciones.adjuntos,
      });
      this.logger.log(`Email enviado a: ${opciones.para} | Asunto: ${opciones.asunto}`);
    } catch (error) {
      this.logger.error(`Error al enviar email a ${opciones.para}:`, error);
    }
  }

  // ─── Plantillas HTML ──────────────────────────────────

  plantillaBase(contenido: string, titulo: string): string {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titulo}</title>
  <style>
    body { font-family: Arial, sans-serif; background:#f4f6f9; margin:0; padding:0; }
    .container { max-width:600px; margin:24px auto; background:#fff;
      border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,.08); }
    .header { background:#1D4ED8; padding:24px 32px; }
    .header h1 { color:#fff; margin:0; font-size:20px; font-weight:600; }
    .header p { color:#BFDBFE; margin:4px 0 0; font-size:13px; }
    .body { padding:32px; color:#374151; line-height:1.6; }
    .body h2 { font-size:18px; color:#111827; margin-top:0; }
    .kpi-box { background:#EFF6FF; border-left:4px solid #1D4ED8;
      padding:12px 16px; border-radius:4px; margin:16px 0; }
    .btn { display:inline-block; background:#1D4ED8; color:#fff; padding:10px 20px;
      border-radius:6px; text-decoration:none; font-weight:600; font-size:14px; margin-top:16px; }
    .alert-red { background:#FEF2F2; border-left:4px solid #DC2626;
      padding:12px 16px; border-radius:4px; margin:16px 0; color:#7F1D1D; }
    .alert-amber { background:#FFFBEB; border-left:4px solid #F59E0B;
      padding:12px 16px; border-radius:4px; margin:16px 0; color:#78350F; }
    .footer { background:#F9FAFB; padding:16px 32px; font-size:12px; color:#6B7280;
      border-top:1px solid #E5E7EB; text-align:center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏛️ SIGC-UNT</h1>
      <p>Sistema Integrado de Gestión de la Calidad · Universidad Nacional de Trujillo</p>
    </div>
    <div class="body">
      ${contenido}
    </div>
    <div class="footer">
      <p>Este es un mensaje automático del SIGC-UNT. No responder a este correo.</p>
      <p>Oficina Central de Calidad Universitaria · <a href="https://unitru.edu.pe">unitru.edu.pe</a></p>
    </div>
  </div>
</body>
</html>`;
  }

  emailAlertaCapaVencida(datos: {
    responsableNombre: string;
    ncCodigo: string;
    descripcionAccion: string;
    fechaCompromiso: string;
    enlace: string;
  }): string {
    const contenido = `
      <h2>⚠️ Acción CAPA Vencida</h2>
      <p>Estimado/a <strong>${datos.responsableNombre}</strong>,</p>
      <p>Se le informa que la siguiente acción CAPA ha <strong>vencido su plazo</strong>:</p>
      <div class="alert-red">
        <strong>NC:</strong> ${datos.ncCodigo}<br>
        <strong>Acción:</strong> ${datos.descripcionAccion}<br>
        <strong>Fecha compromiso:</strong> ${datos.fechaCompromiso}
      </div>
      <p>Ingrese al sistema para actualizar el avance o solicitar una prórroga justificada.</p>
      <a href="${datos.enlace}" class="btn">Ver acción CAPA</a>`;
    return this.plantillaBase(contenido, `Acción CAPA Vencida — ${datos.ncCodigo}`);
  }

  emailIndicadorRojo(datos: {
    responsableNombre: string;
    indicadorNombre: string;
    valorReal: number;
    valorMeta: number;
    unidad: string;
    periodo: string;
    enlace: string;
  }): string {
    const contenido = `
      <h2>🔴 Indicador fuera de meta</h2>
      <p>Estimado/a <strong>${datos.responsableNombre}</strong>,</p>
      <p>El siguiente indicador bajo su responsabilidad se encuentra en estado <strong>ROJO</strong>:</p>
      <div class="alert-red">
        <strong>Indicador:</strong> ${datos.indicadorNombre}<br>
        <strong>Período:</strong> ${datos.periodo}<br>
        <strong>Valor real:</strong> ${datos.valorReal} ${datos.unidad}<br>
        <strong>Meta:</strong> ${datos.valorMeta} ${datos.unidad}
      </div>
      <p>Revise las causas y registre las observaciones correspondientes en el sistema.</p>
      <a href="${datos.enlace}" class="btn">Ver indicador</a>`;
    return this.plantillaBase(contenido, `Indicador en rojo: ${datos.indicadorNombre}`);
  }

  emailBienvenida(datos: {
    nombre: string;
    username: string;
    passwordTemporal: string;
    enlace: string;
  }): string {
    const contenido = `
      <h2>¡Bienvenido/a al SIGC-UNT!</h2>
      <p>Estimado/a <strong>${datos.nombre}</strong>,</p>
      <p>Se ha creado su cuenta en el Sistema Integrado de Gestión de la Calidad de la Universidad Nacional de Trujillo.</p>
      <div class="kpi-box">
        <strong>Usuario:</strong> ${datos.username}<br>
        <strong>Contraseña temporal:</strong> ${datos.passwordTemporal}
      </div>
      <p><strong>Importante:</strong> Por razones de seguridad, deberá cambiar su contraseña en el primer inicio de sesión.</p>
      <a href="${datos.enlace}" class="btn">Ingresar al sistema</a>`;
    return this.plantillaBase(contenido, 'Bienvenido al SIGC-UNT');
  }

  emailDocumentoPendienteAprobacion(datos: {
    aprobadorNombre: string;
    documentoCodigo: string;
    documentoTitulo: string;
    elaboradoPor: string;
    enlace: string;
  }): string {
    const contenido = `
      <h2>📄 Documento pendiente de aprobación</h2>
      <p>Estimado/a <strong>${datos.aprobadorNombre}</strong>,</p>
      <p>El siguiente documento requiere su revisión y aprobación:</p>
      <div class="kpi-box">
        <strong>Código:</strong> ${datos.documentoCodigo}<br>
        <strong>Título:</strong> ${datos.documentoTitulo}<br>
        <strong>Elaborado por:</strong> ${datos.elaboradoPor}
      </div>
      <a href="${datos.enlace}" class="btn">Revisar documento</a>`;
    return this.plantillaBase(contenido, `Aprobación requerida: ${datos.documentoCodigo}`);
  }
}
