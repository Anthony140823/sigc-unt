import { Controller, Get, UseGuards, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BscService } from './bsc.service';
import { ExportacionService, ColumnaExportacion } from '../../common/services/exportacion.service';

@ApiTags('bsc')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'bsc', version: '1' })
export class BscController {
  constructor(
    private readonly bscService: BscService,
    private readonly exportacionService: ExportacionService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obtener tablero BSC agrupado por perspectiva' })
  obtenerTablero() {
    return this.bscService.obtenerTablero();
  }

  @Get('exportar/pdf')
  @ApiOperation({ summary: 'Exportar tablero BSC a PDF' })
  async exportarPDF(@Res() res: Response) {
    const tablero = await this.bscService.obtenerTablero();
    const datos: any[] = [];
    for (const p of tablero.perspectivas) {
      for (const obj of p.objetivos) {
        for (const ind of obj.indicadores) {
          datos.push({
            perspectiva: p.nombre,
            objetivo: `${obj.codigo} — ${obj.nombre}`,
            indicador: `${ind.codigo} — ${ind.nombre}`,
            frecuencia: ind.frecuencia ?? '-',
            ultimo_valor: ind.ultima_medicion ? `${ind.ultima_medicion.valor_real}${ind.unidad_medida ? ` ${ind.unidad_medida}` : ''}` : 'Sin datos',
            semaforo: ind.ultima_medicion?.estado_semaforo ?? '-',
          });
        }
      }
    }

    const columnas: ColumnaExportacion[] = [
      { titulo: 'Perspectiva', campo: 'perspectiva' },
      { titulo: 'Objetivo', campo: 'objetivo' },
      { titulo: 'Indicador', campo: 'indicador' },
      { titulo: 'Frecuencia', campo: 'frecuencia' },
      { titulo: 'Último valor', campo: 'ultimo_valor' },
      { titulo: 'Semáforo', campo: 'semaforo' },
    ];

    const stream = await this.exportacionService.generarPDF(
      'Balanced Scorecard — SIGC-UNT',
      [
        { etiqueta: 'Fecha de exportación', valor: new Date().toLocaleDateString('es-PE') },
        { etiqueta: 'Total de indicadores', valor: String(datos.length) },
      ],
      columnas, datos, 'bsc',
    );
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="bsc.pdf"',
    });
    stream.getStream().pipe(res);
  }
}
