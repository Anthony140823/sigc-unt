import { Injectable, StreamableFile } from '@nestjs/common';
import { Workbook } from 'exceljs';
import * as PDFDocument from 'pdfkit';

export interface ColumnaExportacion {
  titulo: string;
  campo: string;
  ancho?: number;
}

const formatearFecha = (v: any): string => {
  if (!v) return '';
  const d = new Date(v);
  return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString('es-PE', { timeZone: 'UTC' });
};

const obtenerValor = (obj: any, campo: string): any => {
  const val = campo.split('.').reduce((o, k) => (o != null ? o[k] : undefined), obj);
  if (Array.isArray(val)) return val.map((x: any) => (typeof x === 'object' ? x?.codigo ?? x?.nombre ?? '' : x)).join('; ');
  return val ?? '';
};

const escaparCSV = (v: any): string => {
  const s = String(v ?? '');
  return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
};

@Injectable()
export class ExportacionService {
  generarCSV(datos: any[], columnas: ColumnaExportacion[], nombreArchivo: string): StreamableFile {
    const cabeceras = columnas.map((c) => c.titulo).join(',');
    const filas = datos.map((d) => columnas.map((c) => escaparCSV(obtenerValor(d, c.campo))).join(','));
    const contenido = '\uFEFF' + [cabeceras, ...filas].join('\r\n');
    return new StreamableFile(Buffer.from(contenido, 'utf-8'), {
      type: 'text/csv; charset=utf-8',
      disposition: `attachment; filename="${nombreArchivo}.csv"`,
    });
  }

  async generarXLSX(datos: any[], columnas: ColumnaExportacion[], nombreArchivo: string, hoja = 'Datos'): Promise<StreamableFile> {
    const wb = new Workbook();
    const ws = wb.addWorksheet(hoja);

    ws.columns = columnas.map((c) => ({
      header: c.titulo,
      key: c.campo,
      width: c.ancho ?? 20,
    }));

    const filas = datos.map((d) => {
      const row: Record<string, any> = {};
      for (const c of columnas) {
        row[c.campo] = obtenerValor(d, c.campo);
      }
      return row;
    });

    ws.addRows(filas);

    ws.getRow(1).font = { bold: true };
    ws.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8F0FE' },
    };

    const buffer = await wb.xlsx.writeBuffer() as unknown as Buffer;
    return new StreamableFile(buffer, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: `attachment; filename="${nombreArchivo}.xlsx"`,
    });
  }

  async generarXLSXConEncabezado(
    titulo: string,
    metadatos: { etiqueta: string; valor: string }[],
    columnas: ColumnaExportacion[],
    datos: any[],
    nombreArchivo: string,
  ): Promise<StreamableFile> {
    const wb = new Workbook();
    const ws = wb.addWorksheet('Checklist');

    // Fila de título
    const titleRow = ws.addRow([titulo]);
    titleRow.font = { bold: true, size: 14, color: { argb: 'FF1F2937' } };
    ws.mergeCells(`A1:${String.fromCharCode(64 + columnas.length)}1`);

    // Filas de metadatos
    for (const m of metadatos) {
      const row = ws.addRow([`${m.etiqueta}:`, m.valor]);
      row.getCell(1).font = { bold: true, size: 10, color: { argb: 'FF4B5563' } };
      row.getCell(2).font = { size: 10, color: { argb: 'FF6B7280' } };
    }

    // Fila vacía
    ws.addRow([]);

    // Cabeceras de la tabla
    const headerRowIndex = ws.rowCount + 1;
    const headerRow = ws.addRow(columnas.map(c => c.titulo));
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' },
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

    // Ancho de columnas
    ws.columns = columnas.map((c, i) => ({
      header: c.titulo,
      key: `col${i}`,
      width: c.ancho ?? 25,
    }));

    // Datos
    for (const d of datos) {
      const values = columnas.map(c => obtenerValor(d, c.campo));
      ws.addRow(values);
    }

    // Bordes en la tabla
    const borde = { style: 'thin' as const, color: { argb: 'FFD1D5DB' } };
    for (let r = headerRowIndex; r <= ws.rowCount; r++) {
      for (let c = 1; c <= columnas.length; c++) {
        const cell = ws.getRow(r).getCell(c);
        cell.border = { top: borde, bottom: borde, left: borde, right: borde };
      }
    }

    const buffer = await wb.xlsx.writeBuffer() as unknown as Buffer;
    return new StreamableFile(buffer, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: `attachment; filename="${nombreArchivo}.xlsx"`,
    });
  }

  async generarPDF(
    titulo: string,
    metadatos: { etiqueta: string; valor: string }[],
    columnas: ColumnaExportacion[],
    datos: any[],
    nombreArchivo: string,
  ): Promise<StreamableFile> {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const buffers: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => buffers.push(chunk));

    return new Promise((resolve) => {
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(new StreamableFile(pdfBuffer, {
          type: 'application/pdf',
          disposition: `attachment; filename="${nombreArchivo}.pdf"`,
        }));
      });

      // Título
      doc.fontSize(16).font('Helvetica-Bold').text(titulo, { align: 'center' });
      doc.moveDown(0.5);

      // Línea separadora
      doc.moveTo(40, doc.y).lineTo(552, doc.y).strokeColor('#CBD5E1').stroke();
      doc.moveDown(0.5);

      // Metadatos
      for (const m of metadatos) {
        doc.fontSize(9).font('Helvetica-Bold').text(`${m.etiqueta}: `, { continued: true });
        doc.font('Helvetica').text(m.valor);
      }
      doc.moveDown(0.5);

      // Cabeceras de tabla
      const pageWidth = 512;
      const colWidth = pageWidth / columnas.length;
      const startX = 40;

      doc.fontSize(8).font('Helvetica-Bold');
      doc.rect(startX, doc.y, pageWidth, 18).fill('#2563EB');
      doc.fill('#FFFFFF');
      let cx = startX;
      for (const c of columnas) {
        doc.text(c.titulo, cx + 3, doc.y + 3, { width: colWidth - 6, align: 'left' });
        cx += colWidth;
      }
      doc.fill('#000000');

      // Filas de datos
      doc.font('Helvetica').fontSize(7);
      for (const d of datos) {
        const yBefore = doc.y;
        cx = startX;
        // Fondo alternado
        if (datos.indexOf(d) % 2 === 0) {
          doc.rect(startX, doc.y, pageWidth, 16).fill('#F8FAFC');
          doc.fill('#000000');
        }
        for (const c of columnas) {
          const val = obtenerValor(d, c.campo);
          doc.text(String(val ?? ''), cx + 3, yBefore + 2, { width: colWidth - 6, align: 'left' });
          cx += colWidth;
        }
        doc.y = yBefore + 16;

        // Salto de página si es necesario
        if (doc.y > 720) {
          doc.addPage();
          doc.y = 40;
        }
      }

      doc.end();
    });
  }
}
