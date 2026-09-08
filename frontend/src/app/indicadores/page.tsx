// src/app/indicadores/page.tsx
'use client';
import { useState } from 'react';
import { Plus, BarChart2, TrendingUp, TrendingDown, Minus, RefreshCw, ChevronLeft, ChevronRight, AlertTriangle, FileDown, FileSpreadsheet } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import {
  useIndicadores, useResumenSemaforos,
  useHistorialIndicador, useRegistrarMedicion,
} from '@/lib/hooks';
import { useAuthStore } from '@/lib/store/auth.store';
import { cn } from '@/lib/utils/cn';
import { descargarArchivo } from '@/lib/api/servicios';
import type { Indicador, Medicion } from '@/lib/types';

// ── Badge semáforo ─────────────────────────────────────────────
function SemaforoBadge({ estado }: { estado?: 'VERDE' | 'AMARILLO' | 'ROJO' }) {
  const cfg = {
    VERDE:    { cls: 'badge-verde',    label: 'En meta'    },
    AMARILLO: { cls: 'badge-amarillo', label: 'Alerta'     },
    ROJO:     { cls: 'badge-rojo',     label: 'Fuera meta' },
  };
  if (!estado) return <span className="badge-gris">Sin datos</span>;
  const { cls, label } = cfg[estado];
  return <span className={cls}>{label}</span>;
}

// ── Modal de medición ─────────────────────────────────────────
function ModalMedicion({
  indicador,
  onClose,
}: {
  indicador: Indicador;
  onClose: () => void;
}) {
  const { mutate, isPending } = useRegistrarMedicion(indicador.id);
  const [form, setForm] = useState({
    periodo_inicio: '',
    periodo_fin: '',
    valor_real: '',
    observaciones: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate(
      { ...form, valor_real: parseFloat(form.valor_real) },
      { onSuccess: onClose },
    );
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 id="modal-title" className="text-sm font-semibold text-gray-900">
            Registrar medición — {indicador.codigo}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{indicador.nombre}</p>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label text-xs">Período inicio *</label>
              <input type="date" className="input text-xs" required
                value={form.periodo_inicio}
                onChange={(e) => setForm({ ...form, periodo_inicio: e.target.value })} />
            </div>
            <div>
              <label className="label text-xs">Período fin *</label>
              <input type="date" className="input text-xs" required
                value={form.periodo_fin}
                onChange={(e) => setForm({ ...form, periodo_fin: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label text-xs">
              Valor real * {indicador.unidad_medida && `(${indicador.unidad_medida})`}
            </label>
            <div className="relative">
              <input type="number" step="0.01" className="input text-xs" required
                placeholder="Ej: 78.5"
                value={form.valor_real}
                onChange={(e) => setForm({ ...form, valor_real: e.target.value })} />
              {indicador.meta_valor && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  Meta: {indicador.meta_valor}
                </span>
              )}
            </div>
          </div>
          <div>
            <label className="label text-xs">Observaciones</label>
            <textarea className="input text-xs h-20 resize-none"
              placeholder="Comentarios sobre la medición..."
              value={form.observaciones}
              onChange={(e) => setForm({ ...form, observaciones: e.target.value })} />
          </div>
          <p className="text-xs text-gray-400">
            El semáforo se calcula automáticamente al guardar.
          </p>
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" className="btn-secondary text-xs py-1.5" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary text-xs py-1.5" disabled={isPending}>
              {isPending ? 'Guardando...' : 'Guardar medición'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Gráfico tendencia ─────────────────────────────────────────
function GraficoTendencia({ indicadorId, meta }: { indicadorId: string; meta?: number }) {
  const { data: historial = [] } = useHistorialIndicador(indicadorId, 12);

  const datos = (historial as Medicion[]).map((m) => ({
    periodo: new Date(m.periodo_fin).toLocaleDateString('es-PE', { month: 'short', year: '2-digit' }),
    valor:   Number(m.valor_real),
    meta:    Number(m.valor_meta ?? meta ?? 0),
  }));

  if (datos.length < 2) {
    return (
      <p className="text-xs text-gray-400 text-center py-6">
        Se necesitan al menos 2 mediciones para mostrar la tendencia.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={datos} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
        <XAxis dataKey="periodo" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip
          contentStyle={{ fontSize: 11, borderRadius: 8 }}
          formatter={(val: number) => [val.toFixed(2)]}
        />
        {meta && (
          <ReferenceLine y={meta} stroke="#10B981" strokeDasharray="4 4"
            label={{ value: 'Meta', position: 'right', fontSize: 10, fill: '#10B981' }} />
        )}
        <Line type="monotone" dataKey="valor" stroke="#2563EB" strokeWidth={2}
          dot={{ fill: '#2563EB', r: 3 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Página principal ──────────────────────────────────────────
export default function IndicadoresPage() {
  const { tieneRol } = useAuthStore();
  const puedeRegistrar = tieneRol(['ADMIN_CALIDAD','JEFE_AREA','DIGITADOR','RESPONSABLE_PROCESO']);
  const puedeCrear     = tieneRol(['ADMIN_CALIDAD','DIRECTOR_CALIDAD']);

  const [pagina, setPagina]            = useState(1);
  const [busqueda, setBusqueda]        = useState('');
  const [indicadorSelec, setIndicadorSelec] = useState<Indicador | null>(null);
  const [modalMedicion, setModalMedicion]   = useState<Indicador | null>(null);

  const { data, isLoading, refetch } = useIndicadores({
    page: pagina, limit: 15,
    busqueda: busqueda || undefined,
  });
  const { data: semaforos } = useResumenSemaforos();

  const indicadores = data?.datos ?? [];
  const meta        = data?.meta;

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Indicadores de Gestión</h2>
        <div className="flex gap-2">
          <button onClick={() => refetch()} className="btn-secondary gap-1.5 text-xs py-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => descargarArchivo('/indicadores/exportar/csv', 'indicadores.csv')} className="btn-secondary gap-1.5 text-xs py-1.5" title="Exportar CSV">
            <FileDown className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => descargarArchivo('/indicadores/exportar/xlsx', 'indicadores.xlsx')} className="btn-secondary gap-1.5 text-xs py-1.5" title="Exportar Excel">
            <FileSpreadsheet className="w-3.5 h-3.5" />
          </button>
          {puedeCrear && (
            <a href="/indicadores/nuevo" className="btn-primary gap-2 text-xs">
              <Plus className="w-3.5 h-3.5" /> Nuevo indicador
            </a>
          )}
        </div>
      </div>

      {/* Resumen semáforos */}
      {semaforos && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: 'verde',    label: 'En meta',      color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', icon: <TrendingUp className="w-4 h-4" /> },
            { key: 'amarillo', label: 'En alerta',    color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: <Minus className="w-4 h-4" /> },
            { key: 'rojo',     label: 'Fuera de meta',color: 'text-red-700',   bg: 'bg-red-50',   border: 'border-red-200',   icon: <TrendingDown className="w-4 h-4" /> },
          ].map(({ key, label, color, bg, border, icon }) => (
            <div key={key} className={cn('card p-4 border', border, bg)}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">{label}</p>
                  <p className={cn('text-3xl font-bold mt-0.5', color)}>
                    {(semaforos as any)[key] ?? 0}
                  </p>
                </div>
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', bg, color)}>
                  {icon}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Tabla */}
        <div className="xl:col-span-2 space-y-3">
          {/* Filtro */}
          <div className="card p-3">
            <div className="relative">
              <BarChart2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="search" placeholder="Buscar indicador..."
                className="input pl-8 text-xs py-1.5"
                value={busqueda}
                onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
              />
            </div>
          </div>

          <div className="card overflow-hidden">
            <table className="tabla" aria-label="Lista de indicadores">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Meta</th>
                  <th>Último valor</th>
                  <th>Semáforo</th>
                  <th><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 6 }).map((__, j) => (
                          <td key={j}><div className="skeleton h-4 rounded w-full" /></td>
                        ))}
                      </tr>
                    ))
                  : indicadores.length === 0
                  ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-sm text-gray-400">
                          No hay indicadores definidos.
                        </td>
                      </tr>
                    )
                  : indicadores.map((ind) => {
                      const ultima = ind.mediciones_indicador?.[0];
                      return (
                        <tr
                          key={ind.id}
                          className={cn('cursor-pointer', indicadorSelec?.id === ind.id && 'bg-blue-50')}
                          onClick={() => setIndicadorSelec(ind)}
                        >
                          <td>
                            <span className="font-mono text-xs text-blue-700 font-semibold">
                              {ind.codigo}
                            </span>
                          </td>
                          <td>
                            <p className="text-sm font-medium text-gray-800 truncate max-w-40">
                              {ind.nombre}
                            </p>
                            <p className="text-xs text-gray-400">{ind.frecuencias_medicion?.nombre}</p>
                          </td>
                          <td>
                            <span className="text-xs font-medium text-gray-700">
                              {ind.meta_valor != null
                                ? `${ind.meta_valor} ${ind.unidad_medida ?? ''}`
                                : '—'}
                            </span>
                          </td>
                          <td>
                            <span className="text-sm font-bold text-gray-800">
                              {ultima
                                ? `${Number(ultima.valor_real).toFixed(2)} ${ind.unidad_medida ?? ''}`
                                : <span className="text-gray-400 text-xs">Sin datos</span>
                              }
                            </span>
                          </td>
                          <td>
                            <SemaforoBadge estado={ultima?.estado_semaforo} />
                          </td>
                          <td>
                            {puedeRegistrar && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setModalMedicion(ind); }}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
                                aria-label={`Registrar medición para ${ind.codigo}`}
                              >
                                + Medición
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                }
              </tbody>
            </table>

            {/* Paginación */}
            {meta && meta.totalPaginas > 1 && (
              <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>{meta.total} indicadores</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPagina((p) => p - 1)} disabled={!meta.tieneAnterior}
                    className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                    aria-label="Anterior">
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span>{pagina}/{meta.totalPaginas}</span>
                  <button onClick={() => setPagina((p) => p + 1)} disabled={!meta.tieneSiguiente}
                    className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                    aria-label="Siguiente">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Panel detalle */}
        <div className="card p-4">
          {indicadorSelec ? (
            <div className="space-y-4">
              <div>
                <span className="font-mono text-xs text-blue-700 font-semibold">
                  {indicadorSelec.codigo}
                </span>
                <h3 className="text-sm font-semibold text-gray-900 mt-1 leading-tight">
                  {indicadorSelec.nombre}
                </h3>
                {indicadorSelec.descripcion && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {indicadorSelec.descripcion}
                  </p>
                )}
              </div>
              <div className="space-y-1.5 text-xs">
                {[
                  { l: 'Fórmula', v: indicadorSelec.formula },
                  { l: 'Meta', v: indicadorSelec.meta_valor != null ? `${indicadorSelec.meta_valor} ${indicadorSelec.unidad_medida ?? ''}` : 'No definida' },
                  { l: 'Tendencia', v: indicadorSelec.tipo_tendencia === 'MAYOR' ? '↑ Mayor es mejor' : indicadorSelec.tipo_tendencia === 'MENOR' ? '↓ Menor es mejor' : '= Nominal' },
                  { l: 'Frecuencia', v: indicadorSelec.frecuencias_medicion?.nombre },
                  { l: 'Área', v: indicadorSelec.areas?.nombre },
                  { l: 'Fuente', v: indicadorSelec.fuente_datos ?? 'No especificada' },
                ].map(({ l, v }) => (
                  <div key={l} className="flex gap-2">
                    <span className="text-gray-400 w-20 flex-shrink-0">{l}</span>
                    <span className="text-gray-700 font-medium">{v ?? '—'}</span>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">Tendencia (12 meses)</p>
                <GraficoTendencia
                  indicadorId={indicadorSelec.id}
                  meta={indicadorSelec.meta_valor ? Number(indicadorSelec.meta_valor) : undefined}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <BarChart2 className="w-8 h-8 mb-2 text-gray-300" />
              <p className="text-sm">Selecciona un indicador para ver el detalle</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de medición */}
      {modalMedicion && (
        <ModalMedicion
          indicador={modalMedicion}
          onClose={() => setModalMedicion(null)}
        />
      )}
    </div>
  );
}
