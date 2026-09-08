// src/app/dashboard/page.tsx
'use client';
import {
  FileText, ClipboardCheck, AlertTriangle, Shield,
  BarChart2, Smile, Award, TrendingUp, TrendingDown,
  Circle, RefreshCw, File as FileIcon,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useDashboardEjecutivo, useDashboardTactico, useDashboardOperativo, useAlertasCapa } from '@/lib/hooks';
import { useAuthStore } from '@/lib/store/auth.store';
import { cn } from '@/lib/utils/cn';
import { descargarArchivo } from '@/lib/api/servicios';
import type { DashboardEjecutivo } from '@/lib/types';

// ── Componente KPI ─────────────────────────────────────────────
function KpiCard({
  label, valor, delta, deltaPositivo, icono, colorIcono,
}: {
  label: string;
  valor: string | number;
  delta?: string;
  deltaPositivo?: boolean;
  icono: React.ReactNode;
  colorIcono: string;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{valor}</p>
          {delta && (
            <p className={cn('flex items-center gap-1 text-xs mt-1',
              deltaPositivo ? 'text-green-600' : 'text-red-600')}>
              {deltaPositivo
                ? <TrendingUp className="w-3 h-3" />
                : <TrendingDown className="w-3 h-3" />}
              {delta}
            </p>
          )}
        </div>
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', colorIcono)}>
          {icono}
        </div>
      </div>
    </div>
  );
}

// ── Semáforo ────────────────────────────────────────────────────
function DonutSemaforo({ verde, amarillo, rojo }: { verde: number; amarillo: number; rojo: number }) {
  const total = verde + amarillo + rojo || 1;
  const pct = (n: number) => Math.round((n / total) * 100);

  return (
    <div className="card p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Indicadores — semáforo del mes</h3>
      <div className="flex items-center gap-4">
        {/* Barras */}
        <div className="flex-1 space-y-2">
          {[
            { label: 'En meta', n: verde, color: 'bg-green-500' },
            { label: 'Cerca del límite', n: amarillo, color: 'bg-amber-400' },
            { label: 'Fuera de meta', n: rojo, color: 'bg-red-500' },
          ].map(({ label, n, color }) => (
            <div key={label}>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>{label}</span>
                <span className="font-semibold">{n}</span>
              </div>
              <div className="progress-bar">
                <div
                  className={cn('progress-fill', color)}
                  style={{ width: `${pct(n)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        {/* Total */}
        <div className="text-center">
          <p className="text-3xl font-bold text-gray-800">{total}</p>
          <p className="text-xs text-gray-400">total</p>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ────────────────────────────────────────────
export default function DashboardPage() {
  const { tieneRol } = useAuthStore();
  const esEjecutivo = tieneRol(['SUPERADMIN','ADMIN_CALIDAD','DIRECTOR_CALIDAD']);

  const { data: ejecutivo, isLoading: cargandoEj, refetch } = useDashboardEjecutivo();
  const { data: operativo } = useDashboardOperativo();
  const { data: alertasCapa = [] } = useAlertasCapa();

  const kpis = ejecutivo?.kpis;
  const { data: tactico } = useDashboardTactico();

  const SEMAFORO_COLORS: Record<string, string> = {
    VERDE: '#22c55e', AMARILLO: '#eab308', ROJO: '#ef4444',
  };

  const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#06b6d4'];

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Resumen ejecutivo del SGC</h2>
          {ejecutivo?.fecha_calculo && (
            <p className="text-xs text-gray-400 mt-0.5">
              Actualizado: {new Date(ejecutivo.fecha_calculo).toLocaleString('es-PE')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => descargarArchivo('/dashboard/exportar/pdf', 'dashboard-ejecutivo.pdf')}
            className="btn-secondary gap-1.5 text-xs py-1.5"
            title="Exportar PDF"
          >
            <FileIcon className="w-3.5 h-3.5" /> PDF
          </button>
          <button
            onClick={() => refetch()}
            className="btn-secondary gap-2 text-xs py-1.5"
            disabled={cargandoEj}
            aria-label="Actualizar dashboard"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', cargandoEj && 'animate-spin')} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Pendientes operativos (para todos los usuarios) */}
      {operativo && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Docs. por aprobar', valor: operativo.documentos_pendientes_aprobacion, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Mis acciones CAPA', valor: operativo.mis_acciones_capa?.length ?? 0, color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'Indicadores pendientes', valor: operativo.indicadores_pendientes_registro, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Notificaciones', valor: operativo.notificaciones_sin_leer, color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map(({ label, valor, color, bg }) => (
            <div key={label} className={cn('card p-3 text-center', bg)}>
              <p className={cn('text-2xl font-bold', color)}>{valor}</p>
              <p className="text-xs text-gray-600 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* KPIs institucionales (solo roles ejecutivos) */}
      {esEjecutivo && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {cargandoEj
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="card p-4 h-24 skeleton" />
                ))
              : kpis && [
                  { label: 'Documentos vigentes',    valor: kpis.documentos_vigentes,     delta: `${kpis.documentos_por_aprobar} por aprobar`, deltaPositivo: false, icono: <FileText className="w-4 h-4 text-blue-700" />,  colorIcono: 'bg-blue-100' },
                  { label: 'Auditorías del año',      valor: kpis.auditorias_anio,         icono: <ClipboardCheck className="w-4 h-4 text-teal-700" />, colorIcono: 'bg-teal-100' },
                  { label: 'Hallazgos abiertos',      valor: kpis.hallazgos_abiertos,      icono: <Circle className="w-4 h-4 text-orange-700" />,      colorIcono: 'bg-orange-100' },
                  { label: 'NC abiertas',             valor: kpis.nc_abiertas,             delta: kpis.acciones_vencidas > 0 ? `${kpis.acciones_vencidas} vencidas` : undefined, deltaPositivo: false, icono: <AlertTriangle className="w-4 h-4 text-red-700" />, colorIcono: 'bg-red-100' },
                  { label: 'Riesgos críticos',        valor: kpis.riesgos_criticos,        icono: <Shield className="w-4 h-4 text-rose-700" />,         colorIcono: 'bg-rose-100' },
                  { label: 'Indicadores en rojo',     valor: kpis.indicadores_rojo,        icono: <BarChart2 className="w-4 h-4 text-red-700" />,       colorIcono: 'bg-red-100' },
                  { label: 'Satisfacción promedio',   valor: kpis.satisfaccion_promedio > 0 ? `${kpis.satisfaccion_promedio.toFixed(1)} / 5` : 'N/D', icono: <Smile className="w-4 h-4 text-green-700" />, colorIcono: 'bg-green-100' },
                  { label: 'Procesos acreditación',   valor: kpis.procesos_acreditacion,   icono: <Award className="w-4 h-4 text-purple-700" />,        colorIcono: 'bg-purple-100' },
                ].map((kpi) => <KpiCard key={kpi.label} {...kpi} />)
            }
          </div>

          {/* Semáforo de indicadores */}
          {ejecutivo?.distribucion_semaforo && !cargandoEj && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DonutSemaforo {...ejecutivo.distribucion_semaforo} />

              {/* Alertas CAPA */}
              <div className="card p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Acciones CAPA próximas a vencer
                </h3>
                {alertasCapa.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">
                    ✓ Sin acciones vencidas ni próximas a vencer
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                    {alertasCapa.slice(0, 5).map((a: any) => {
                      const diasVencido = Math.floor(
                        (Date.now() - new Date(a.fecha_compromiso).getTime()) / 86_400_000,
                      );
                      const vencida = diasVencido > 0;
                      return (
                        <div
                          key={a.id}
                          className={cn(
                            'flex items-start gap-3 p-2.5 rounded-lg text-xs',
                            vencida ? 'bg-red-50' : 'bg-amber-50',
                          )}
                        >
                          <AlertTriangle
                            className={cn('w-3.5 h-3.5 mt-0.5 flex-shrink-0',
                              vencida ? 'text-red-500' : 'text-amber-500')}
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-800 truncate">
                              {a.no_conformidades?.codigo}
                            </p>
                            <p className="text-gray-600 truncate">{a.descripcion}</p>
                            <p className={cn('font-medium mt-0.5',
                              vencida ? 'text-red-600' : 'text-amber-600')}>
                              {vencida
                                ? `Venció hace ${diasVencido} días`
                                : `Vence: ${new Date(a.fecha_compromiso).toLocaleDateString('es-PE')}`}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Gráficos tácticos: NC por estado y riesgos por nivel */}
          {tactico && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* NC por estado */}
              <div className="card p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">NC por estado</h3>
                {tactico.nc_por_estado?.length ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={tactico.nc_por_estado}>
                      <XAxis dataKey="estado_id" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="_count.id" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-8">Sin datos</p>
                )}
              </div>

              {/* Riesgos por nivel */}
              <div className="card p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Riesgos por nivel</h3>
                {tactico.riesgos_por_nivel?.length ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={tactico.riesgos_por_nivel}
                        dataKey="_count.id"
                        nameKey="nivel_riesgo_id"
                        cx="50%" cy="50%"
                        innerRadius={40} outerRadius={70}
                      >
                        {tactico.riesgos_por_nivel.map((_: any, i: number) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-8">Sin datos</p>
                )}
              </div>

              {/* Hallazgos por tipo */}
              <div className="card p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Hallazgos por tipo</h3>
                {tactico.hallazgos_por_tipo?.length ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={tactico.hallazgos_por_tipo}>
                      <XAxis dataKey="tipo_id" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="_count.id" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-8">Sin datos</p>
                )}
              </div>

              {/* Indicadores por semáforo */}
              <div className="card p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Indicadores por semáforo</h3>
                {tactico.indicadores_semaforo?.length ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={tactico.indicadores_semaforo}
                        dataKey="_count.id"
                        nameKey="estado_semaforo"
                        cx="50%" cy="50%"
                        innerRadius={40} outerRadius={70}
                      >
                        {tactico.indicadores_semaforo.map((entry: any, i: number) => (
                          <Cell key={i} fill={SEMAFORO_COLORS[entry.estado_semaforo] || '#94a3b8'} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-8">Sin datos</p>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Mis acciones CAPA activas (nivel operativo) */}
      {(operativo?.mis_acciones_capa?.length ?? 0) > 0 && (
        <div className="card">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800">Mis acciones CAPA activas</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {(operativo?.mis_acciones_capa ?? []).map((accion: any) => (
              <div key={accion.id} className="px-4 py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {accion.no_conformidades?.codigo ?? accion.nc_id}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{accion.descripcion}</p>
                </div>
                {/* Barra de avance */}
                <div className="w-24">
                  <div className="progress-bar">
                    <div
                      className="progress-fill bg-blue-500"
                      style={{ width: `${accion.porcentaje_avance ?? 0}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 text-right mt-0.5">
                    {accion.porcentaje_avance ?? 0}%
                  </p>
                </div>
                {/* Estado */}
                <span className={cn(
                  'text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap',
                  accion.estados_flujo?.color_hex
                    ? `bg-[${accion.estados_flujo.color_hex}20] text-[${accion.estados_flujo.color_hex}]`
                    : 'badge-azul',
                )}>
                  {accion.estados_flujo?.nombre ?? accion.estado_id}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
