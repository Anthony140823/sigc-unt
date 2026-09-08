// src/modules/dashboard/dashboard.controller.ts
import {
  Controller, Get, Patch, Param, Query, Res,
  UseGuards, ParseIntPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiBearerAuth,
  ApiQuery, ApiResponse,
} from '@nestjs/swagger';
import { Response } from 'express';
import { DashboardService } from './dashboard.service';
import { ExportacionService, ColumnaExportacion } from '../../common/services/exportacion.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, RolSistema } from '../../common/decorators/roles.decorator';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator';
import { UsuarioJwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('dashboard')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'dashboard', version: '1' })
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly exportacionService: ExportacionService,
  ) {}

  @Get('ejecutivo')
  @Roles(
    RolSistema.SUPERADMIN,
    RolSistema.ADMIN_CALIDAD,
    RolSistema.DIRECTOR_CALIDAD,
    RolSistema.AUDITOR_LIDER,
  )
  @ApiOperation({
    summary: 'Dashboard nivel estratégico',
    description:
      'KPIs globales del SGC: documentos, auditorías, hallazgos, CAPA, riesgos, indicadores y acreditación. Dirigido al Rector y Vicerrectores.',
  })
  @ApiResponse({ status: 200, description: 'Métricas estratégicas del SGC.' })
  ejecutivo() {
    return this.dashboardService.dashboardEjecutivo();
  }

  @Get('tactico')
  @Roles(
    RolSistema.SUPERADMIN,
    RolSistema.ADMIN_CALIDAD,
    RolSistema.DIRECTOR_CALIDAD,
    RolSistema.JEFE_AREA,
    RolSistema.AUDITOR_LIDER,
  )
  @ApiOperation({
    summary: 'Dashboard nivel táctico',
    description:
      'NC por estado, hallazgos por tipo, indicadores por semáforo y riesgos por nivel. Filtrable por área. Dirigido a Directores y Decanos.',
  })
  @ApiQuery({
    name: 'area_id',
    required: false,
    description: 'UUID del área (omitir para vista institucional)',
  })
  tactico(@Query('area_id') areaId?: string) {
    return this.dashboardService.dashboardTactico(areaId);
  }

  @Get('operativo')
  @ApiOperation({
    summary: 'Dashboard nivel operativo (del usuario autenticado)',
    description:
      'Documentos pendientes de aprobación, mis acciones CAPA, indicadores pendientes de registro y notificaciones. Personalizado para cada usuario.',
  })
  operativo(@UsuarioActual() usuario: UsuarioJwtPayload) {
    return this.dashboardService.dashboardOperativo(usuario.sub, usuario.area_id);
  }

  @Get('acreditacion')
  @Roles(
    RolSistema.SUPERADMIN,
    RolSistema.ADMIN_CALIDAD,
    RolSistema.DIRECTOR_CALIDAD,
  )
  @ApiOperation({ summary: 'Estado de acreditación por programa con cronograma' })
  acreditacion() {
    return this.dashboardService.estadoAcreditacion();
  }

  @Get('exportar/pdf')
  @Roles(
    RolSistema.SUPERADMIN,
    RolSistema.ADMIN_CALIDAD,
    RolSistema.DIRECTOR_CALIDAD,
  )
  @ApiOperation({ summary: 'Exportar dashboard ejecutivo a PDF' })
  async exportarPDF(@Res() res: Response) {
    const ejecutivo = await this.dashboardService.dashboardEjecutivo();
    const kpis = ejecutivo.kpis;

    const datos = [
      { indicador: 'Documentos vigentes', valor: String(kpis.documentos_vigentes) },
      { indicador: 'Documentos por aprobar', valor: String(kpis.documentos_por_aprobar) },
      { indicador: 'Auditorías del año', valor: String(kpis.auditorias_anio) },
      { indicador: 'Hallazgos abiertos', valor: String(kpis.hallazgos_abiertos) },
      { indicador: 'NC abiertas', valor: String(kpis.nc_abiertas) },
      { indicador: 'Acciones CAPA vencidas', valor: String(kpis.acciones_vencidas) },
      { indicador: 'Riesgos críticos', valor: String(kpis.riesgos_criticos) },
      { indicador: 'Indicadores en rojo', valor: String(kpis.indicadores_rojo) },
      { indicador: 'Encuestas activas', valor: String(kpis.encuestas_activas) },
      { indicador: 'Satisfacción promedio', valor: kpis.satisfaccion_promedio > 0 ? `${kpis.satisfaccion_promedio.toFixed(1)} / 5` : 'N/D' },
      { indicador: 'Procesos acreditación', valor: String(kpis.procesos_acreditacion) },
    ];

    const semaforo = ejecutivo.distribucion_semaforo;
    datos.push(
      { indicador: 'Indicadores en verde', valor: String(semaforo.verde) },
      { indicador: 'Indicadores en amarillo', valor: String(semaforo.amarillo) },
      { indicador: 'Indicadores en rojo', valor: String(semaforo.rojo) },
    );

    const columnas: ColumnaExportacion[] = [
      { titulo: 'Indicador', campo: 'indicador' },
      { titulo: 'Valor', campo: 'valor' },
    ];

    const stream = await this.exportacionService.generarPDF(
      'Dashboard Ejecutivo — SIGC-UNT',
      [
        { etiqueta: 'Fecha de exportación', valor: new Date().toLocaleDateString('es-PE') },
        { etiqueta: 'Total KPIs', valor: String(datos.length) },
      ],
      columnas, datos, 'dashboard-ejecutivo',
    );
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="dashboard-ejecutivo.pdf"',
    });
    stream.getStream().pipe(res);
  }

  // ─── Notificaciones ────────────────────────────────────

  @Get('notificaciones')
  @ApiOperation({ summary: 'Mis notificaciones (últimas 30)' })
  @ApiQuery({
    name: 'soloNoLeidas',
    required: false,
    type: Boolean,
    description: 'Si true, retorna solo las no leídas',
  })
  misNotificaciones(
    @UsuarioActual() usuario: UsuarioJwtPayload,
    @Query('soloNoLeidas') soloNoLeidas?: string,
  ) {
    return this.dashboardService.misNotificaciones(
      usuario.sub,
      soloNoLeidas === 'true',
    );
  }

  @Patch('notificaciones/:id/leer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar notificación como leída' })
  marcarLeida(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioActual() usuario: UsuarioJwtPayload,
  ) {
    return this.dashboardService.marcarNotificacionLeida(id, usuario.sub);
  }

  @Patch('notificaciones/leer-todas')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar todas mis notificaciones como leídas' })
  marcarTodasLeidas(@UsuarioActual() usuario: UsuarioJwtPayload) {
    return this.dashboardService.marcarTodasLeidas(usuario.sub);
  }
}
