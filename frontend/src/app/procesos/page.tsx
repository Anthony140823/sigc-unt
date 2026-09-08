// src/app/procesos/page.tsx
'use client';
import { useState } from 'react';
import { GitBranch, ChevronRight, ChevronDown, FileText, BarChart2, Users, FileDown, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { useMapaProcesos, useProcesos } from '@/lib/hooks';
import { useAuthStore } from '@/lib/store/auth.store';
import { cn } from '@/lib/utils/cn';
import { descargarArchivo } from '@/lib/api/servicios';

// Tipo de macroproceso por colores
const COLORES_TIPO: Record<string, { bg: string; border: string; badge: string; text: string }> = {
  ESTRATEGICO: { bg: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700', text: 'text-purple-800' },
  MISIONAL:    { bg: 'bg-blue-50',   border: 'border-blue-200',   badge: 'bg-blue-100 text-blue-700',     text: 'text-blue-800'   },
  SOPORTE:     { bg: 'bg-green-50',  border: 'border-green-200',  badge: 'bg-green-100 text-green-700',   text: 'text-green-800'  },
};

// ── Tarjeta de proceso expandible ─────────────────────────────
function TarjetaProceso({ proceso }: { proceso: any }) {
  const [expandido, setExpandido] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpandido(!expandido)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 transition-colors text-left"
        aria-expanded={expandido}
      >
        {expandido
          ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
          : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
        }
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-blue-700 font-semibold">{proceso.codigo}</span>
            <span className="text-xs px-1.5 py-0.5 rounded" style={
              proceso.estados_flujo?.color_hex
                ? { backgroundColor: `${proceso.estados_flujo.color_hex}20`, color: proceso.estados_flujo.color_hex }
                : { backgroundColor: '#F3F4F6', color: '#6B7280' }
            }>
              {proceso.estados_flujo?.nombre}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-800 mt-0.5">{proceso.nombre}</p>
          <p className="text-xs text-gray-400 mt-0.5">{proceso.areas?.nombre}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 text-xs text-gray-400">
          {proceso._count?.documentos > 0 && (
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" /> {proceso._count.documentos}
            </span>
          )}
          {proceso._count?.indicadores > 0 && (
            <span className="flex items-center gap-1">
              <BarChart2 className="w-3 h-3" /> {proceso._count.indicadores}
            </span>
          )}
          {proceso._count?.subprocesos > 0 && (
            <span className="flex items-center gap-1">
              <GitBranch className="w-3 h-3" /> {proceso._count.subprocesos}
            </span>
          )}
        </div>
      </button>

      {expandido && proceso.subprocesos?.length > 0 && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-2 space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Subprocesos
          </p>
          {proceso.subprocesos.map((sp: any) => (
            <div key={sp.id} className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-white">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
              <span className="font-mono text-xs text-gray-500">{sp.codigo}</span>
              <span className="text-sm text-gray-700 flex-1">{sp.nombre}</span>
            </div>
          ))}
        </div>
      )}

      {expandido && (
        <div className="border-t border-gray-100 px-4 py-2 bg-white flex gap-4">
          <a
            href={`/procesos/${proceso.id}`}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
          >
            Ver detalle →
          </a>
          {proceso.diagrama_bpmn_url && (
            <a
              href={proceso.diagrama_bpmn_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-green-600 hover:text-green-800 font-medium flex items-center gap-1"
            >
              Ver diagrama BPMN ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ── Macroproceso expandible ────────────────────────────────────
function TarjetaMacroproceso({ macro }: { macro: any }) {
  const [expandido, setExpandido] = useState(true);
  const colores = COLORES_TIPO[macro.tipo] ?? COLORES_TIPO.SOPORTE;

  return (
    <div className={cn('rounded-xl border overflow-hidden', colores.border, colores.bg)}>
      <button
        onClick={() => setExpandido(!expandido)}
        className={cn(
          'w-full flex items-center gap-3 px-5 py-4 text-left transition-colors hover:brightness-95',
          colores.bg,
        )}
        aria-expanded={expandido}
      >
        <div className={cn('text-xs font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0', colores.badge)}>
          {macro.tipo}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-gray-500 font-semibold">{macro.codigo}</span>
          </div>
          <p className={cn('text-sm font-bold', colores.text)}>{macro.nombre}</p>
          {macro.descripcion && (
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{macro.descripcion}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {macro.procesos?.length ?? 0} proceso{macro.procesos?.length !== 1 ? 's' : ''}
          </span>
          {expandido
            ? <ChevronDown className="w-4 h-4 text-gray-400" />
            : <ChevronRight className="w-4 h-4 text-gray-400" />
          }
        </div>
      </button>

      {expandido && macro.procesos?.length > 0 && (
        <div className="px-5 pb-4 space-y-2">
          {macro.procesos.map((p: any) => (
            <TarjetaProceso key={p.id} proceso={p} />
          ))}
        </div>
      )}

      {expandido && (!macro.procesos || macro.procesos.length === 0) && (
        <div className="px-5 pb-4 text-sm text-gray-400 italic">
          Sin procesos registrados en este macroproceso.
        </div>
      )}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────
export default function ProcesosPage() {
  const { tieneRol } = useAuthStore();
  const puedeCrear  = tieneRol(['ADMIN_CALIDAD', 'DIRECTOR_CALIDAD']);
  const [vista, setVista] = useState<'mapa' | 'lista'>('mapa');
  const [filtroTipo, setFiltroTipo] = useState<string>('');

  const { data: mapa = [], isLoading } = useMapaProcesos();
  const { data: procesos = [] } = useProcesos(
    vista === 'lista' ? { tipo: filtroTipo || undefined } : undefined,
  );

  const mapaFiltrado = filtroTipo
    ? (mapa as any[]).filter((m) => m.tipo === filtroTipo)
    : mapa as any[];

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Mapa de Procesos</h2>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl leading-relaxed">
            Estructurado bajo el enfoque de gestión pública por procesos (Secretaría de Gestión Pública PCM).
            Las actividades académicas y administrativas se organizan en <strong>procesos estratégicos</strong> que orientan la universidad,
            <strong> procesos misionales</strong> que son la razón de ser, y <strong>procesos de soporte</strong> que proveen los recursos necesarios.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => window.location.reload()} className="btn-secondary gap-1.5 text-xs py-1.5" title="Actualizar">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => descargarArchivo('/procesos/exportar/csv', 'procesos.csv')} className="btn-secondary gap-1.5 text-xs py-1.5" title="Exportar CSV">
            <FileDown className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => descargarArchivo('/procesos/exportar/xlsx', 'procesos.xlsx')} className="btn-secondary gap-1.5 text-xs py-1.5" title="Exportar Excel">
            <FileSpreadsheet className="w-3.5 h-3.5" />
          </button>
          {puedeCrear && (
            <a
              href="/procesos/nuevo"
              className="btn-primary gap-2 text-xs"
              onClick={() => {
                // #region debug-point A:procesos-nuevo-click
                fetch('http://127.0.0.1:7777/event', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    sessionId: 'maintainers-new-routes',
                    runId: 'pre-fix',
                    hypothesisId: 'A',
                    location: 'frontend/src/app/procesos/page.tsx:new-link',
                    msg: '[DEBUG] clicked nuevo proceso link',
                    data: { href: '/procesos/nuevo' },
                    ts: Date.now(),
                  }),
                }).catch(() => {});
                // #endregion
              }}
            >
              <GitBranch className="w-3.5 h-3.5" /> Nuevo proceso
            </a>
          )}
        </div>
      </div>

      {/* Controles de vista */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1 p-0.5 bg-gray-100 rounded-lg">
          {[
            { id: 'mapa',  label: 'Vista de mapa' },
            { id: 'lista', label: 'Vista de lista' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setVista(id as any)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                vista === id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex gap-1">
          {['', 'ESTRATEGICO', 'MISIONAL', 'SOPORTE'].map((tipo) => (
            <button
              key={tipo}
              onClick={() => setFiltroTipo(tipo)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors',
                filtroTipo === tipo
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50',
              )}
            >
              {tipo || 'Todos'}
            </button>
          ))}
        </div>
      </div>

      {/* Estadísticas del mapa */}
      {!isLoading && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { tipo: 'ESTRATEGICO', label: 'Estratégicos', color: 'text-purple-700' },
            { tipo: 'MISIONAL',    label: 'Misionales',   color: 'text-blue-700'   },
            { tipo: 'SOPORTE',     label: 'De Soporte',   color: 'text-green-700'  },
          ].map(({ tipo, label, color }) => {
            const macros = (mapa as any[]).filter((m) => m.tipo === tipo);
            const totalProcesos = macros.reduce((acc: number, m: any) => acc + (m.procesos?.length ?? 0), 0);
            return (
              <div key={tipo} className="card p-3 flex items-center gap-3">
                <GitBranch className={cn('w-5 h-5', color)} />
                <div>
                  <p className={cn('text-lg font-bold', color)}>{totalProcesos}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Vista mapa jerárquico */}
      {vista === 'mapa' && (
        <div className="space-y-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-24 rounded-xl" />
              ))
            : mapaFiltrado.map((macro: any) => (
                <TarjetaMacroproceso key={macro.id} macro={macro} />
              ))
          }
          {!isLoading && mapaFiltrado.length === 0 && (
            <div className="card p-12 text-center text-sm text-gray-400">
              <GitBranch className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              No hay macroprocesos registrados.
            </div>
          )}
        </div>
      )}

      {/* Vista lista */}
      {vista === 'lista' && (
        <div className="card overflow-hidden">
          <table className="tabla" aria-label="Lista de procesos">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Macroproceso</th>
                <th>Área</th>
                <th>Documentos</th>
                <th>Indicadores</th>
                <th>Estado</th>
                <th><span className="sr-only">Ver</span></th>
              </tr>
            </thead>
            <tbody>
              {(procesos as any[]).length === 0
                ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-sm text-gray-400">
                        No hay procesos.
                      </td>
                    </tr>
                  )
                : (procesos as any[]).map((p: any) => (
                    <tr key={p.id}>
                      <td>
                        <span className="font-mono text-xs text-blue-700 font-semibold">{p.codigo}</span>
                      </td>
                      <td>
                        <p className="text-sm font-medium text-gray-800 truncate max-w-44">{p.nombre}</p>
                      </td>
                      <td>
                        <div>
                          <span className={cn('text-xs font-medium px-2 py-0.5 rounded',
                            COLORES_TIPO[p.macroprocesos?.tipo ?? 'SOPORTE']?.badge ?? 'bg-gray-100 text-gray-600')}>
                            {p.macroprocesos?.tipo}
                          </span>
                          <p className="text-xs text-gray-400 mt-0.5 truncate max-w-32">{p.macroprocesos?.nombre}</p>
                        </div>
                      </td>
                      <td>
                        <span className="text-xs text-gray-600">{p.areas?.nombre_corto ?? p.areas?.nombre}</span>
                      </td>
                      <td>
                        <span className="text-xs text-gray-600">{p._count?.documentos ?? 0}</span>
                      </td>
                      <td>
                        <span className="text-xs text-gray-600">{p._count?.indicadores ?? 0}</span>
                      </td>
                      <td>
                        <span className="text-xs px-2 py-0.5 rounded" style={
                          p.estados_flujo?.color_hex
                            ? { backgroundColor: `${p.estados_flujo.color_hex}20`, color: p.estados_flujo.color_hex }
                            : {}
                        }>
                          {p.estados_flujo?.nombre}
                        </span>
                      </td>
                      <td>
                        <a
                          href={`/procesos/${p.id}`}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          aria-label={`Ver proceso ${p.codigo}`}
                        >
                          Ver →
                        </a>
                      </td>
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
