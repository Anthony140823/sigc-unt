// src/app/encuestas/page.tsx
'use client';
import { useState } from 'react';
import { Plus, RefreshCw, Smile, ChevronLeft, ChevronRight, FileDown, FileSpreadsheet } from 'lucide-react';
import { useEncuestas } from '@/lib/hooks';
import { useAuthStore } from '@/lib/store/auth.store';
import { cn } from '@/lib/utils/cn';
import { descargarArchivo } from '@/lib/api/servicios';

export default function EncuestasPage() {
  const { tieneRol } = useAuthStore();
  const puedeCrear   = tieneRol(['ADMIN_CALIDAD', 'DIRECTOR_CALIDAD', 'JEFE_AREA']);
  const [pagina, setPagina]     = useState(1);
  const [poblacion, setPoblacion] = useState('');
  const [estado, setEstado]     = useState('');

  const { data, isLoading, refetch } = useEncuestas({
    page: pagina, limit: 15,
    poblacion: poblacion || undefined,
    estado_codigo: estado || undefined,
  });

  const encuestas = data?.datos ?? [];
  const meta      = data?.meta;

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Gestión de la Satisfacción</h2>
        <div className="flex gap-2">
          <button onClick={() => refetch()} className="btn-secondary gap-1.5 text-xs py-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => descargarArchivo('/encuestas/exportar/csv', 'encuestas.csv')} className="btn-secondary gap-1.5 text-xs py-1.5" title="Exportar CSV">
            <FileDown className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => descargarArchivo('/encuestas/exportar/xlsx', 'encuestas.xlsx')} className="btn-secondary gap-1.5 text-xs py-1.5" title="Exportar Excel">
            <FileSpreadsheet className="w-3.5 h-3.5" />
          </button>
          {puedeCrear && (
            <a href="/encuestas/nueva" className="btn-primary gap-2 text-xs">
              <Plus className="w-3.5 h-3.5" /> Nueva encuesta
            </a>
          )}
        </div>
      </div>

      {/* KPIs rápidos */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { l: 'Total encuestas',  v: meta?.total ?? 0 },
          { l: 'Activas ahora',    v: encuestas.filter((e: any) => e.estados_flujo?.codigo === 'ACTIVA').length },
          { l: 'En diseño',        v: encuestas.filter((e: any) => e.estados_flujo?.codigo === 'DISENO').length },
        ].map(({ l, v }) => (
          <div key={l} className="card p-3 text-center">
            <p className="text-2xl font-bold text-gray-800">{v}</p>
            <p className="text-xs text-gray-500 mt-0.5">{l}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="card p-3 flex flex-wrap gap-3">
        <select
          className="input text-xs py-1.5 w-44"
          value={poblacion}
          onChange={(e) => { setPoblacion(e.target.value); setPagina(1); }}
          aria-label="Filtrar por población objetivo"
        >
          <option value="">Todas las poblaciones</option>
          <option value="ESTUDIANTE">Estudiantes</option>
          <option value="DOCENTE">Docentes</option>
          <option value="EGRESADO">Egresados</option>
          <option value="ADMINISTRATIVO">Administrativos</option>
          <option value="EXTERNO">Externos</option>
          <option value="TODOS">Todos</option>
        </select>
        <select
          className="input text-xs py-1.5 w-36"
          value={estado}
          onChange={(e) => { setEstado(e.target.value); setPagina(1); }}
          aria-label="Filtrar por estado"
        >
          <option value="">Todos los estados</option>
          <option value="DISENO">En Diseño</option>
          <option value="ACTIVA">Activa</option>
          <option value="CERRADA">Cerrada</option>
          <option value="ANULADA">Anulada</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        <table className="tabla" aria-label="Lista de encuestas">
          <thead>
            <tr>
              <th>Código</th>
              <th>Título</th>
              <th>Población</th>
              <th>Ciclo</th>
              <th>Vigencia</th>
              <th>Respuestas</th>
              <th>Anónima</th>
              <th>Estado</th>
              <th><span className="sr-only">Ver</span></th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((__, j) => (
                      <td key={j}><div className="skeleton h-4 rounded w-full" /></td>
                    ))}
                  </tr>
                ))
              : encuestas.length === 0
              ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-sm text-gray-400">
                      <Smile className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      No hay encuestas con los filtros aplicados.
                    </td>
                  </tr>
                )
              : encuestas.map((e: any) => {
                  const estadoCodigo = e.estados_flujo?.codigo ?? '';
                  const badgeCls = estadoCodigo === 'ACTIVA' ? 'badge-verde'
                    : estadoCodigo === 'CERRADA' ? 'badge-azul'
                    : estadoCodigo === 'DISENO' ? 'badge-amarillo'
                    : 'badge-gris';

                  return (
                    <tr key={e.id}>
                      <td>
                        <span className="font-mono text-xs text-blue-700 font-semibold">{e.codigo}</span>
                      </td>
                      <td>
                        <p className="text-sm font-medium text-gray-800 truncate max-w-52">{e.titulo}</p>
                        {e.programas_academicos && (
                          <p className="text-xs text-gray-400 truncate">{e.programas_academicos.nombre}</p>
                        )}
                      </td>
                      <td>
                        <span className="badge-azul text-xs">{e.poblacion_objetivo}</span>
                      </td>
                      <td>
                        <span className="text-xs text-gray-600">{e.ciclo_academico ?? '—'}</span>
                      </td>
                      <td>
                        <div className="text-xs text-gray-500">
                          <p>{e.fecha_inicio ? new Date(e.fecha_inicio).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }) : '—'}</p>
                          <p className="text-gray-400">↓ {e.fecha_fin ? new Date(e.fecha_fin).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }) : '—'}</p>
                        </div>
                      </td>
                      <td>
                        <span className="text-sm font-bold text-gray-700">
                          {e._count?.participaciones_encuesta ?? 0}
                        </span>
                      </td>
                      <td>
                        <span className={e.es_anonima ? 'badge-verde' : 'badge-gris'}>
                          {e.es_anonima ? 'Sí' : 'No'}
                        </span>
                      </td>
                      <td>
                        <span className={cn('text-xs font-medium px-2.5 py-0.5 rounded-full', badgeCls)}>
                          {e.estados_flujo?.nombre ?? '—'}
                        </span>
                      </td>
                      <td>
                        <a
                          href={`/encuestas/${e.id}`}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          aria-label={`Ver encuesta ${e.codigo}`}
                        >
                          Ver →
                        </a>
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
            <span>{meta.total} encuestas</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagina((p) => p - 1)}
                disabled={!meta.tieneAnterior}
                className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                aria-label="Página anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span>{pagina} / {meta.totalPaginas}</span>
              <button
                onClick={() => setPagina((p) => p + 1)}
                disabled={!meta.tieneSiguiente}
                className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                aria-label="Página siguiente"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
