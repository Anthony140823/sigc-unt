// src/app/documentos/page.tsx
'use client';
import { useState } from 'react';
import { Plus, Search, Filter, Download, RefreshCw, FileText, Eye, ChevronLeft, ChevronRight, FileDown, FileSpreadsheet, File as FileIcon } from 'lucide-react';
import { useDocumentos, useCambiarEstadoDocumento } from '@/lib/hooks';
import { useAuthStore } from '@/lib/store/auth.store';
import { documentosApi, descargarArchivo } from '@/lib/api/servicios';
import { cn } from '@/lib/utils/cn';
import type { Documento } from '@/lib/types';

// Badge de estado del documento
function EstadoBadge({ estado }: { estado?: { codigo: string; nombre: string; color_hex?: string } }) {
  if (!estado) return null;
  const colores: Record<string, string> = {
    BORRADOR:    'badge-gris',
    EN_REVISION: 'badge-amarillo',
    APROBADO:    'badge-azul',
    PUBLICADO:   'bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full',
    OBSOLETO:    'badge-rojo',
    ARCHIVADO:   'badge-gris',
  };
  return (
    <span className={cn('text-xs font-medium px-2.5 py-0.5 rounded-full', colores[estado.codigo] ?? 'badge-gris')}>
      {estado.nombre}
    </span>
  );
}

export default function DocumentosPage() {
  const { tieneRol } = useAuthStore();
  const puedeEditar = tieneRol(['ADMIN_CALIDAD','DIRECTOR_CALIDAD','JEFE_AREA','RESPONSABLE_PROCESO']);

  const [pagina, setPagina]     = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [tipoId, setTipoId]     = useState<string>('');
  const [estado, setEstado]     = useState<string>('');

  const { data, isLoading, refetch } = useDocumentos({
    page:              pagina,
    limit:             15,
    busqueda:          busqueda || undefined,
    tipo_documento_id: tipoId || undefined,
    estado_codigo:     estado || undefined,
    sortBy:            'modificado_en',
    order:             'DESC',
  });

  const documentos = data?.datos ?? [];
  const meta       = data?.meta;

  const handleDescargar = async (doc: Documento) => {
    try {
      const res = await documentosApi.generarUrlDescarga(doc.id);
      if (res?.url) window.open(res.url, '_blank');
    } catch {
      alert('No se pudo generar el enlace de descarga.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Documentos del SGC</h2>
          {meta && (
            <p className="text-xs text-gray-400 mt-0.5">
              {meta.total.toLocaleString('es-PE')} documentos totales
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="btn-secondary gap-1.5 text-xs py-1.5" aria-label="Actualizar">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => descargarArchivo('/documentos/exportar/csv', 'documentos.csv')} className="btn-secondary gap-1.5 text-xs py-1.5" title="Exportar CSV">
            <FileDown className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => descargarArchivo('/documentos/exportar/xlsx', 'documentos.xlsx')} className="btn-secondary gap-1.5 text-xs py-1.5" title="Exportar Excel">
            <FileSpreadsheet className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => descargarArchivo('/documentos/exportar/pdf', 'documentos.pdf')} className="btn-secondary gap-1.5 text-xs py-1.5" title="Exportar PDF">
            <FileIcon className="w-3.5 h-3.5" />
          </button>
          {puedeEditar && (
            <a href="/documentos/nuevo" className="btn-primary gap-2 text-xs">
              <Plus className="w-3.5 h-3.5" />
              Nuevo documento
            </a>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="card p-3">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Búsqueda */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="search"
              placeholder="Buscar por código, título o palabra clave..."
              className="input pl-8 text-xs py-1.5"
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
              aria-label="Buscar documentos"
            />
          </div>

          {/* Tipo */}
          <select
            className="input text-xs py-1.5 w-40"
            value={tipoId}
            onChange={(e) => { setTipoId(e.target.value); setPagina(1); }}
            aria-label="Filtrar por tipo"
          >
            <option value="">Todos los tipos</option>
            <option value="1">Política</option>
            <option value="2">Manual</option>
            <option value="3">Procedimiento</option>
            <option value="4">Instructivo</option>
            <option value="5">Formato</option>
            <option value="6">Registro</option>
            <option value="7">Plan</option>
          </select>

          {/* Estado */}
          <select
            className="input text-xs py-1.5 w-40"
            value={estado}
            onChange={(e) => { setEstado(e.target.value); setPagina(1); }}
            aria-label="Filtrar por estado"
          >
            <option value="">Todos los estados</option>
            <option value="BORRADOR">Borrador</option>
            <option value="EN_REVISION">En Revisión</option>
            <option value="APROBADO">Aprobado</option>
            <option value="PUBLICADO">Publicado</option>
            <option value="OBSOLETO">Obsoleto</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="tabla" aria-label="Lista de documentos">
            <thead>
              <tr>
                <th scope="col">Código</th>
                <th scope="col">Título</th>
                <th scope="col">Tipo</th>
                <th scope="col">Área</th>
                <th scope="col">Versión</th>
                <th scope="col">Estado</th>
                <th scope="col">Modificado</th>
                <th scope="col"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((__, j) => (
                        <td key={j}><div className="skeleton h-4 rounded w-full max-w-24" /></td>
                      ))}
                    </tr>
                  ))
                : documentos.length === 0
                ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-sm text-gray-400">
                        <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        No se encontraron documentos con los filtros aplicados.
                      </td>
                    </tr>
                  )
                : documentos.map((doc) => (
                    <tr key={doc.id}>
                      <td>
                        <span className="font-mono text-xs text-blue-700 font-semibold">
                          {doc.codigo}
                        </span>
                      </td>
                      <td>
                        <p className="text-sm font-medium text-gray-800 truncate max-w-52">
                          {doc.titulo}
                        </p>
                        {doc.palabras_clave?.length > 0 && (
                          <p className="text-xs text-gray-400 truncate">
                            {doc.palabras_clave.slice(0, 3).join(', ')}
                          </p>
                        )}
                      </td>
                      <td>
                        <span className="badge-gris">{doc.tipos_documento?.codigo ?? '—'}</span>
                      </td>
                      <td>
                        <span className="text-xs text-gray-600">
                          {doc.areas?.nombre_corto ?? doc.areas?.nombre ?? '—'}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs font-mono text-gray-700">v{doc.version_actual}</span>
                      </td>
                      <td><EstadoBadge estado={doc.estados_flujo} /></td>
                      <td>
                        <span className="text-xs text-gray-500">
                          {new Date(doc.modificado_en).toLocaleDateString('es-PE', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <a
                            href={`/documentos/${doc.id}`}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-blue-600"
                            title="Ver detalle"
                            aria-label={`Ver documento ${doc.codigo}`}
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                          {doc.estados_flujo?.codigo === 'PUBLICADO' && (
                            <button
                              onClick={() => handleDescargar(doc)}
                              className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-green-600"
                              title="Descargar"
                              aria-label={`Descargar ${doc.codigo}`}
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {meta && meta.totalPaginas > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>
              Mostrando {((pagina - 1) * 15) + 1}–{Math.min(pagina * 15, meta.total)} de {meta.total}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagina((p) => p - 1)}
                disabled={!meta.tieneAnterior}
                className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                aria-label="Página anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-medium">{pagina} / {meta.totalPaginas}</span>
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
