// src/app/acreditacion/page.tsx
'use client';
import { useState } from 'react';
import { Award, Plus, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { useProcesosAcreditacion, useCronogramaAcreditacion } from '@/lib/hooks';
import { useAuthStore } from '@/lib/store/auth.store';
import { cn } from '@/lib/utils/cn';
import type { ProcesoAcreditacion } from '@/lib/types';

const COLORES_ACRED: Record<string, string> = {
  PLANIFICACION:  'badge-gris',
  AUTOEVALUACION: 'badge-amarillo',
  INFORME_PREVIO: 'badge-azul',
  VISITA_EXTERNA: 'bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full',
  ACREDITADO:     'badge-verde',
  NO_ACREDITADO:  'badge-rojo',
};

export default function AcreditacionPage() {
  const { tieneRol } = useAuthStore();
  const puedeCrear  = tieneRol(['ADMIN_CALIDAD','DIRECTOR_CALIDAD']);
  const [pestana, setPestana] = useState<'procesos' | 'cronograma'>('procesos');

  const { data, isLoading, refetch } = useProcesosAcreditacion({ page: 1, limit: 50 });
  const { data: cronograma = [] }     = useCronogramaAcreditacion();

  const procesos = data?.datos ?? [];
  const meta     = data?.meta;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Acreditación y Autoevaluación</h2>
        <div className="flex gap-2">
          <button onClick={() => refetch()} className="btn-secondary gap-1.5 text-xs py-1.5"><RefreshCw className="w-3.5 h-3.5" /></button>
          {puedeCrear && <a href="/acreditacion/nuevo" className="btn-primary gap-2 text-xs"><Plus className="w-3.5 h-3.5" />Iniciar proceso</a>}
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: 'Procesos activos',    v: procesos.filter((p: ProcesoAcreditacion) => !['ACREDITADO','NO_ACREDITADO'].includes(p.estados_flujo?.codigo ?? '')).length },
          { l: 'Acreditados',         v: procesos.filter((p: ProcesoAcreditacion) => p.estados_flujo?.codigo === 'ACREDITADO').length },
          { l: 'En autoevaluación',   v: procesos.filter((p: ProcesoAcreditacion) => p.estados_flujo?.codigo === 'AUTOEVALUACION').length },
          { l: 'Con alerta próxima',  v: (cronograma as any[]).filter((p: any) => p.alerta_visita || p.alerta_vencimiento).length },
        ].map(({ l, v }) => (
          <div key={l} className="card p-3 text-center">
            <p className="text-2xl font-bold text-gray-800">{v}</p>
            <p className="text-xs text-gray-500 mt-0.5">{l}</p>
          </div>
        ))}
      </div>

      {/* Pestañas */}
      <div className="flex gap-1 border-b border-gray-200">
        {[{ id:'procesos', label:`Procesos (${meta?.total ?? 0})` }, { id:'cronograma', label:'Cronograma' }].map(({ id, label }) => (
          <button key={id} onClick={() => setPestana(id as any)}
            className={cn('px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              pestana === id ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700')}>
            {label}
          </button>
        ))}
      </div>

      {pestana === 'procesos' && (
        <div className="card overflow-hidden">
          <table className="tabla" aria-label="Procesos de acreditación">
            <thead><tr><th>Programa</th><th>Nivel</th><th>Estándar</th><th>Tipo</th><th>Año</th><th>Puntuación</th><th>Vencimiento</th><th>Estado</th><th><span className="sr-only">Ver</span></th></tr></thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => <tr key={i}>{Array.from({ length: 9 }).map((__, j) => <td key={j}><div className="skeleton h-4 rounded w-full" /></td>)}</tr>)
                : procesos.length === 0
                ? <tr><td colSpan={9} className="py-10 text-center text-sm text-gray-400"><Award className="w-7 h-7 mx-auto mb-2 text-gray-300" />No hay procesos de acreditación.</td></tr>
                : procesos.map((p: ProcesoAcreditacion) => (
                    <tr key={p.id}>
                      <td><p className="text-sm font-medium text-gray-800 truncate max-w-40">{p.programas_academicos?.nombre}</p></td>
                      <td><span className="badge-gris text-xs">{p.programas_academicos?.nivel}</span></td>
                      <td><span className="text-xs text-gray-600">{p.estandares_acreditacion?.organismo} — {p.estandares_acreditacion?.codigo}</span></td>
                      <td><span className="text-xs text-gray-600">{p.tipo_proceso.replace('_', ' ')}</span></td>
                      <td><span className="text-xs text-gray-700">{p.anio_inicio}</span></td>
                      <td>
                        {p.puntuacion_total != null
                          ? <div><div className="progress-bar w-16"><div className="progress-fill bg-blue-500" style={{ width: `${Math.min(100, Number(p.puntuacion_total))}%` }} /></div><span className="text-xs text-gray-600">{Number(p.puntuacion_total).toFixed(1)}%</span></div>
                          : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td><span className="text-xs text-gray-500">{p.fecha_vencimiento ? new Date(p.fecha_vencimiento).toLocaleDateString('es-PE') : '—'}</span></td>
                      <td><span className={cn(COLORES_ACRED[p.estados_flujo?.codigo ?? ''] ?? 'badge-gris')}>{p.estados_flujo?.nombre}</span></td>
                      <td><a href={`/acreditacion/${p.id}`} className="text-xs text-blue-600 hover:text-blue-800 font-medium" aria-label={`Ver proceso ${p.id}`}>Ver →</a></td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      )}

      {pestana === 'cronograma' && (
        <div className="space-y-2">
          {(cronograma as any[]).map((p: any) => (
            <div key={p.id} className={cn('card p-4 flex items-center gap-4', (p.alerta_visita || p.alerta_vencimiento) && 'border-amber-200')}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">{p.programas_academicos?.nombre}</p>
                <p className="text-xs text-gray-500">{p.estandares_acreditacion?.organismo} · {p.tipo_proceso?.replace('_',' ')}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Visita externa</p>
                <p className="text-sm font-medium text-gray-700">{p.fecha_visita_externa ? new Date(p.fecha_visita_externa).toLocaleDateString('es-PE') : 'No programada'}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Vencimiento</p>
                <p className="text-sm font-medium text-gray-700">{p.fecha_vencimiento ? new Date(p.fecha_vencimiento).toLocaleDateString('es-PE') : '—'}</p>
              </div>
              <div className="flex items-center gap-2">
                {(p.alerta_visita || p.alerta_vencimiento) && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                <span className={cn(COLORES_ACRED[p.estados_flujo?.codigo ?? ''] ?? 'badge-gris')}>{p.estados_flujo?.nombre}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


