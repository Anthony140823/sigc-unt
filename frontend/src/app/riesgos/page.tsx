// src/app/riesgos/page.tsx
'use client';
import { useState } from 'react';
import { Plus, Shield, RefreshCw, ChevronLeft, ChevronRight, Search, FileDown, FileSpreadsheet } from 'lucide-react';
import { useRiesgos, useMapaCalorRiesgos, useCrearRiesgo } from '@/lib/hooks';
import { useAreas } from '@/lib/hooks';
import { useAuthStore } from '@/lib/store/auth.store';
import { cn } from '@/lib/utils/cn';
import { descargarArchivo } from '@/lib/api/servicios';
import type { Riesgo } from '@/lib/types';

// ── Badge nivel de riesgo ──────────────────────────────────────
function NivelBadge({ nivel }: { nivel?: { codigo: string; nombre: string; color_hex?: string } }) {
  if (!nivel) return <span className="badge-gris">—</span>;
  return (
    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{
      backgroundColor: nivel.color_hex ? `${nivel.color_hex}20` : '#F3F4F6',
      color: nivel.color_hex ?? '#374151',
    }}>
      {nivel.nombre}
    </span>
  );
}

// ── Mapa de calor ──────────────────────────────────────────────
function MapaCalor({ data }: { data: any }) {
  const niveles = [5, 4, 3, 2, 1];
  const nivImpacto = [1, 2, 3, 4, 5];
  const celdas = data?.celdas ?? {};

  const colorCelda = (prob: number, imp: number): string => {
    const puntaje = prob * imp;
    if (puntaje >= 15) return 'bg-red-500 text-white';
    if (puntaje >= 10) return 'bg-orange-400 text-white';
    if (puntaje >= 5)  return 'bg-amber-300 text-gray-800';
    return 'bg-green-200 text-gray-700';
  };

  return (
    <div className="overflow-x-auto">
      <table className="text-xs border-collapse mx-auto" aria-label="Mapa de calor de riesgos">
        <thead>
          <tr>
            <th className="w-12 text-gray-500 font-medium text-right pr-2">Prob↓ / Imp→</th>
            {nivImpacto.map(i => (
              <th key={i} className="w-16 text-center text-gray-500 font-medium pb-1">{i}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {niveles.map(prob => (
            <tr key={prob}>
              <td className="text-right pr-2 text-gray-500 font-medium py-1">{prob}</td>
              {nivImpacto.map(imp => {
                const key  = `${prob}x${imp}`;
                const info = celdas[key];
                return (
                  <td key={imp} className="p-0.5">
                    <div className={cn('w-full h-12 rounded flex items-center justify-center font-bold text-sm cursor-default', colorCelda(prob, imp))}
                         title={info ? `${info.count} riesgos` : ''}>
                      {info ? info.count : ''}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-center text-xs text-gray-400 mt-2">Probabilidad × Impacto</p>
    </div>
  );
}

export default function RiesgosPage() {
  const { tieneRol } = useAuthStore();
  const puedeCrear  = tieneRol(['ADMIN_CALIDAD','DIRECTOR_CALIDAD','JEFE_AREA']);

  const [pagina, setPagina]     = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [tipo, setTipo]         = useState('');

  const { data, isLoading, refetch } = useRiesgos({ page: pagina, limit: 15, busqueda: busqueda || undefined, tipo_riesgo: tipo || undefined });
  const { data: mapaCalor }          = useMapaCalorRiesgos();

  const riesgos = data?.datos ?? [];
  const meta    = data?.meta;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Gestión de Riesgos</h2>
        <div className="flex gap-2">
          <button onClick={() => refetch()} className="btn-secondary gap-1.5 text-xs py-1.5"><RefreshCw className="w-3.5 h-3.5" /></button>
          <button onClick={() => descargarArchivo('/riesgos/exportar/csv', 'riesgos.csv')} className="btn-secondary gap-1.5 text-xs py-1.5" title="Exportar CSV">
            <FileDown className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => descargarArchivo('/riesgos/exportar/xlsx', 'riesgos.xlsx')} className="btn-secondary gap-1.5 text-xs py-1.5" title="Exportar Excel">
            <FileSpreadsheet className="w-3.5 h-3.5" />
          </button>
          {puedeCrear && (
            <a href="/riesgos/nuevo" className="btn-primary gap-2 text-xs">
              <Plus className="w-3.5 h-3.5" /> Nuevo riesgo
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Tabla riesgos */}
        <div className="xl:col-span-2 space-y-3">
          <div className="card p-3 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input type="search" placeholder="Buscar riesgo..." className="input pl-8 text-xs py-1.5"
                value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }} />
            </div>
            <select className="input text-xs py-1.5 w-40" value={tipo} onChange={(e) => { setTipo(e.target.value); setPagina(1); }}>
              <option value="">Todos los tipos</option>
              {['ESTRATEGICO','OPERACIONAL','FINANCIERO','LEGAL','REPUTACIONAL','TI','ACADEMICO'].map(t => (
                <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
              ))}
            </select>
          </div>

          <div className="card overflow-hidden">
            <table className="tabla" aria-label="Matriz de riesgos">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>P</th>
                  <th>I</th>
                  <th>Puntuación</th>
                  <th>Nivel</th>
                  <th><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>{Array.from({ length: 8 }).map((__, j) => <td key={j}><div className="skeleton h-4 rounded w-full" /></td>)}</tr>
                    ))
                  : riesgos.length === 0
                  ? <tr><td colSpan={8} className="py-10 text-center text-sm text-gray-400"><Shield className="w-7 h-7 mx-auto mb-2 text-gray-300" />No hay riesgos registrados.</td></tr>
                  : riesgos.map((r: Riesgo) => (
                      <tr key={r.id}>
                        <td><span className="font-mono text-xs text-blue-700 font-semibold">{r.codigo}</span></td>
                        <td><p className="text-sm text-gray-800 truncate max-w-40">{r.nombre}</p><p className="text-xs text-gray-400 truncate">{r.areas?.nombre}</p></td>
                        <td><span className="badge-gris text-xs">{r.tipo_riesgo}</span></td>
                        <td><span className="text-sm font-bold text-gray-700">{r.probabilidad}</span></td>
                        <td><span className="text-sm font-bold text-gray-700">{r.impacto}</span></td>
                        <td><span className="text-sm font-bold text-gray-900">{r.puntuacion ? Number(r.puntuacion).toFixed(1) : '—'}</span></td>
                        <td><NivelBadge nivel={r.niveles_riesgo} /></td>
                        <td><a href={`/riesgos/${r.id}`} className="text-xs text-blue-600 hover:text-blue-800 font-medium" aria-label={`Ver riesgo ${r.codigo}`}>Ver →</a></td>
                      </tr>
                    ))
                }
              </tbody>
            </table>
            {meta && meta.totalPaginas > 1 && (
              <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>{meta.total} riesgos</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPagina(p => p-1)} disabled={!meta.tieneAnterior} className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40" aria-label="Anterior"><ChevronLeft className="w-3.5 h-3.5" /></button>
                  <span>{pagina}/{meta.totalPaginas}</span>
                  <button onClick={() => setPagina(p => p+1)} disabled={!meta.tieneSiguiente} className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40" aria-label="Siguiente"><ChevronRight className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mapa de calor */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Mapa de calor P × I</h3>
          {mapaCalor ? <MapaCalor data={mapaCalor} /> : <div className="skeleton h-48 rounded" />}
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {[{ c: 'bg-red-500',    l: 'Crítico (≥15)'  },
              { c: 'bg-orange-400', l: 'Alto (10–14)'    },
              { c: 'bg-amber-300',  l: 'Medio (5–9)'     },
              { c: 'bg-green-200',  l: 'Bajo (<5)'       },
            ].map(({ c, l }) => (
              <div key={l} className="flex items-center gap-1">
                <div className={cn('w-3 h-3 rounded', c)} />
                <span className="text-gray-500">{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
