// src/app/auditorias/page.tsx
'use client';
import { useState } from 'react';
import { ClipboardCheck, Plus, RefreshCw, ChevronLeft, ChevronRight, FileDown, FileSpreadsheet } from 'lucide-react';
import { useAuditorias, usePlanesAuditoria, useHallazgosAbiertos } from '@/lib/hooks';
import { useAuthStore } from '@/lib/store/auth.store';
import { cn } from '@/lib/utils/cn';
import { descargarArchivo } from '@/lib/api/servicios';
import type { Auditoria } from '@/lib/types';

const COLORES_ESTADO: Record<string, string> = {
  PROGRAMADA:     'badge-gris',
  EN_EJECUCION:   'badge-amarillo',
  FINALIZADA:     'badge-azul',
  INFORME_EMITIDO:'badge-verde',
  CERRADA:        'bg-gray-100 text-gray-500 text-xs font-medium px-2.5 py-0.5 rounded-full',
  CANCELADA:      'badge-rojo',
};

export default function AuditoriasPage() {
  const { tieneRol } = useAuthStore();
  const puedeCrear  = tieneRol(['ADMIN_CALIDAD','AUDITOR_LIDER']);
  const [pagina, setPagina] = useState(1);
  const [anio, setAnio]     = useState(new Date().getFullYear());
  const [pestana, setPestana] = useState<'auditorias' | 'hallazgos'>('auditorias');

  const { data, isLoading, refetch } = useAuditorias({ page: pagina, limit: 15, anio });
  const { data: planes = [] }         = usePlanesAuditoria(anio);
  const { data: hallazgos = [] }      = useHallazgosAbiertos();

  const auditorias = data?.datos ?? [];
  const meta       = data?.meta;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Auditorías e Inspecciones</h2>
        <div className="flex gap-2 items-center">
          <select className="input text-xs py-1.5 w-28" value={anio} onChange={(e) => setAnio(parseInt(e.target.value))}>
            {[2023,2024,2025,2026].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <button onClick={() => refetch()} className="btn-secondary gap-1.5 text-xs py-1.5"><RefreshCw className="w-3.5 h-3.5" /></button>
          <button onClick={() => descargarArchivo('/auditorias/exportar/csv', 'auditorias.csv')} className="btn-secondary gap-1.5 text-xs py-1.5" title="Exportar CSV">
            <FileDown className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => descargarArchivo('/auditorias/exportar/xlsx', 'auditorias.xlsx')} className="btn-secondary gap-1.5 text-xs py-1.5" title="Exportar Excel">
            <FileSpreadsheet className="w-3.5 h-3.5" />
          </button>
          {puedeCrear && (
            <a
              href="/auditorias/nueva"
              className="btn-primary gap-2 text-xs"
              onClick={() => {
                // #region debug-point A:auditorias-nueva-click
                fetch('http://127.0.0.1:7777/event', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    sessionId: 'auditorias-new-route',
                    runId: 'pre-fix',
                    hypothesisId: 'A',
                    location: 'frontend/src/app/auditorias/page.tsx:new-link',
                    msg: '[DEBUG] clicked nueva auditoria link',
                    data: { href: '/auditorias/nueva' },
                    ts: Date.now(),
                  }),
                }).catch(() => {});
                // #endregion
              }}
            >
              <Plus className="w-3.5 h-3.5" />Nueva auditoría
            </a>
          )}
        </div>
      </div>

      {/* Resumen plan */}
      {planes.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { l: 'Planes del año',    v: planes.length },
            { l: 'Total programadas', v: meta?.total ?? '—' },
            { l: 'Hallazgos abiertos',v: hallazgos.length },
            { l: 'En ejecución',      v: auditorias.filter((a: Auditoria) => a.estados_flujo?.codigo === 'EN_EJECUCION').length },
          ].map(({ l, v }) => (
            <div key={l} className="card p-3 text-center">
              <p className="text-2xl font-bold text-gray-800">{v}</p>
              <p className="text-xs text-gray-500 mt-0.5">{l}</p>
            </div>
          ))}
        </div>
      )}

      {/* Pestañas */}
      <div className="flex gap-1 border-b border-gray-200">
        {[
          { id: 'auditorias', label: `Auditorías ${meta ? `(${meta.total})` : ''}` },
          { id: 'hallazgos',  label: `Hallazgos abiertos (${hallazgos.length})` },
        ].map(({ id, label }) => (
          <button key={id} onClick={() => setPestana(id as any)}
            className={cn('px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              pestana === id ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700')}>
            {label}
          </button>
        ))}
      </div>

      {pestana === 'auditorias' && (
        <div className="card overflow-hidden">
          <table className="tabla" aria-label="Lista de auditorías">
            <thead>
              <tr>
                <th>Código</th><th>Nombre</th><th>Tipo</th><th>Área auditada</th>
                <th>Fecha inicio</th><th>Fecha fin</th><th>Hallazgos</th><th>Estado</th>
                <th><span className="sr-only">Ver</span></th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => <tr key={i}>{Array.from({ length: 9 }).map((__, j) => <td key={j}><div className="skeleton h-4 rounded w-full" /></td>)}</tr>)
                : auditorias.length === 0
                ? <tr><td colSpan={9} className="py-10 text-center text-sm text-gray-400"><ClipboardCheck className="w-7 h-7 mx-auto mb-2 text-gray-300" />No hay auditorías en {anio}.</td></tr>
                : auditorias.map((a: Auditoria) => (
                    <tr key={a.id}>
                      <td><span className="font-mono text-xs text-blue-700 font-semibold">{a.codigo}</span></td>
                      <td><p className="text-sm font-medium text-gray-800 truncate max-w-44">{a.nombre}</p></td>
                      <td><span className="badge-gris text-xs">{a.tipos_auditoria?.nombre}</span></td>
                      <td><span className="text-xs text-gray-600">{a.areas?.nombre_corto ?? a.areas?.nombre}</span></td>
                      <td><span className="text-xs text-gray-500">{new Date(a.fecha_programada_inicio).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}</span></td>
                      <td><span className="text-xs text-gray-500">{new Date(a.fecha_programada_fin).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}</span></td>
                      <td><span className={cn('text-xs font-medium', (a._count?.hallazgos ?? 0) > 0 ? 'text-orange-700' : 'text-gray-400')}>{a._count?.hallazgos ?? 0}</span></td>
                      <td><span className={cn(COLORES_ESTADO[a.estados_flujo?.codigo ?? ''] ?? 'badge-gris')}>{a.estados_flujo?.nombre ?? '—'}</span></td>
                      <td><a href={`/auditorias/${a.id}`} className="text-xs text-blue-600 hover:text-blue-800 font-medium" aria-label={`Ver auditoría ${a.codigo}`}>Ver →</a></td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
          {meta && meta.totalPaginas > 1 && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>{meta.total} auditorías</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPagina(p => p-1)} disabled={!meta.tieneAnterior} className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40" aria-label="Anterior"><ChevronLeft className="w-3.5 h-3.5" /></button>
                <span>{pagina}/{meta.totalPaginas}</span>
                <button onClick={() => setPagina(p => p+1)} disabled={!meta.tieneSiguiente} className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40" aria-label="Siguiente"><ChevronRight className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {pestana === 'hallazgos' && (
        <div className="card overflow-hidden">
          <table className="tabla" aria-label="Hallazgos abiertos">
            <thead><tr><th>Código</th><th>Auditoría</th><th>Descripción</th><th>Tipo</th><th>Área</th><th>Fecha límite</th><th>Estado</th></tr></thead>
            <tbody>
              {hallazgos.length === 0
                ? <tr><td colSpan={7} className="py-10 text-center text-sm text-gray-400">No hay hallazgos abiertos.</td></tr>
                : hallazgos.map((h: any) => (
                    <tr key={h.id}>
                      <td><span className="font-mono text-xs font-semibold text-orange-600">{h.codigo}</span></td>
                      <td><span className="text-xs text-gray-600">{h.auditorias?.codigo}</span></td>
                      <td><p className="text-sm text-gray-800 truncate max-w-48">{h.descripcion}</p></td>
                      <td><span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', h.tipos_hallazgo?.severidad >= 3 ? 'badge-rojo' : h.tipos_hallazgo?.severidad === 2 ? 'badge-amarillo' : 'badge-verde')}>{h.tipos_hallazgo?.nombre}</span></td>
                      <td><span className="text-xs text-gray-600">{h.areas?.nombre_corto ?? h.areas?.nombre}</span></td>
                      <td><span className="text-xs text-gray-500">{h.fecha_limite_cierre ? new Date(h.fecha_limite_cierre).toLocaleDateString('es-PE') : '—'}</span></td>
                      <td><span className={cn(COLORES_ESTADO[h.estados_flujo?.codigo ?? ''] ?? 'badge-gris')}>{h.estados_flujo?.nombre}</span></td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
