// src/app/capa/page.tsx
'use client';
import { useEffect, useState } from 'react';
import {
  Plus, AlertTriangle, CheckCircle, Clock,
  ChevronLeft, ChevronRight, RefreshCw, Search,
  FileDown, FileSpreadsheet,
} from 'lucide-react';
import {
  useNoConformidades, useAlertasCapa,
  useEstadisticasCapa, useCrearNC,
} from '@/lib/hooks';
import { useAuthStore } from '@/lib/store/auth.store';
import { useAreas } from '@/lib/hooks';
import { cn } from '@/lib/utils/cn';
import { descargarArchivo } from '@/lib/api/servicios';
import { formatFecha, diasHasta, estaVencido } from '@/lib/utils/cn';
import type { NoConformidad } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// ── Esquema de validación NC ───────────────────────────────────
const esquemaNC = z.object({
  origen:      z.string().min(1, 'Seleccione el origen'),
  descripcion: z.string().min(10, 'Describa la no conformidad (mín. 10 caracteres)'),
  area_id:     z.string().uuid('Seleccione el área'),
  requisito_afectado: z.string().optional(),
  fecha_deteccion:    z.string().optional(),
});
type FormNC = z.infer<typeof esquemaNC>;

// ── Badge de origen ────────────────────────────────────────────
function OrigenBadge({ origen }: { origen: string }) {
  const cfg: Record<string, string> = {
    AUDITORIA:          'badge-azul',
    INSPECCION:         'badge-gris',
    QUEJA:              'badge-amarillo',
    INDICADOR:          'badge-gris',
    REVISION_DIRECCION: 'badge-azul',
    AUTOEVALUACION:     'badge-verde',
    OTRO:               'badge-gris',
  };
  const labels: Record<string, string> = {
    AUDITORIA: 'Auditoría', INSPECCION: 'Inspección',
    QUEJA: 'Queja', INDICADOR: 'Indicador',
    REVISION_DIRECCION: 'Rev. Dirección', AUTOEVALUACION: 'Autoevaluación',
    OTRO: 'Otro',
  };
  return <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', cfg[origen] ?? 'badge-gris')}>{labels[origen] ?? origen}</span>;
}

// ── Modal crear NC ─────────────────────────────────────────────
function ModalCrearNC({ onClose }: { onClose: () => void }) {
  const { mutate, isPending } = useCrearNC();
  const { data: areas = [] }  = useAreas();

  const { register, handleSubmit, formState: { errors } } = useForm<FormNC>({
    resolver: zodResolver(esquemaNC),
  });

  const onSubmit = (datos: FormNC) => {
    // #region debug-point C:capa-nc-submit
    fetch('http://127.0.0.1:7777/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'capa-nueva-nc-button',
        runId: 'pre-fix',
        hypothesisId: 'C',
        location: 'frontend/src/app/capa/page.tsx:ModalCrearNC:onSubmit',
        msg: '[DEBUG] submit registrar nc',
        data: {
          origen: datos.origen,
          area_id: datos.area_id,
          descripcion_len: datos.descripcion?.length ?? 0,
        },
        ts: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    mutate(datos, { onSuccess: onClose });
  };

  useEffect(() => {
    // #region debug-point B:capa-modal-mounted
    fetch('http://127.0.0.1:7777/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'capa-nueva-nc-button',
        runId: 'pre-fix',
        hypothesisId: 'B',
        location: 'frontend/src/app/capa/page.tsx:ModalCrearNC:mount',
        msg: '[DEBUG] modal crear nc mounted',
        data: { areasCount: Array.isArray(areas) ? areas.length : -1 },
        ts: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }, [areas]);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
         role="dialog" aria-modal="true" aria-labelledby="modal-nc-title">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 id="modal-nc-title" className="text-sm font-semibold text-gray-900">
            Registrar No Conformidad
          </h3>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4" noValidate>
          {/* Origen */}
          <div>
            <label className="label text-xs" htmlFor="origen">Origen *</label>
            <select id="origen" className="input text-xs" {...register('origen')}>
              <option value="">Seleccionar origen...</option>
              <option value="AUDITORIA">Auditoría</option>
              <option value="INSPECCION">Inspección</option>
              <option value="QUEJA">Queja / Reclamo</option>
              <option value="INDICADOR">Indicador fuera de meta</option>
              <option value="REVISION_DIRECCION">Revisión por la Dirección</option>
              <option value="AUTOEVALUACION">Autoevaluación</option>
              <option value="OTRO">Otro</option>
            </select>
            {errors.origen && <p className="mt-1 text-xs text-red-600">{errors.origen.message}</p>}
          </div>

          {/* Área */}
          <div>
            <label className="label text-xs" htmlFor="area_id">Área donde se detectó *</label>
            <select id="area_id" className="input text-xs" {...register('area_id')}>
              <option value="">Seleccionar área...</option>
              {areas.map((a: any) => (
                <option key={a.id} value={a.id}>{a.nombre}</option>
              ))}
            </select>
            {errors.area_id && <p className="mt-1 text-xs text-red-600">{errors.area_id.message}</p>}
          </div>

          {/* Descripción */}
          <div>
            <label className="label text-xs" htmlFor="descripcion">Descripción de la no conformidad *</label>
            <textarea id="descripcion" className="input text-xs h-24 resize-none"
              placeholder="Describa detalladamente la no conformidad detectada..."
              {...register('descripcion')} />
            {errors.descripcion && <p className="mt-1 text-xs text-red-600">{errors.descripcion.message}</p>}
          </div>

          {/* Requisito afectado */}
          <div>
            <label className="label text-xs" htmlFor="requisito_afectado">Requisito incumplido (opcional)</label>
            <input id="requisito_afectado" type="text" className="input text-xs"
              placeholder="Ej: Requisito 7.5.3 ISO 21001:2018"
              {...register('requisito_afectado')} />
          </div>

          {/* Fecha detección */}
          <div>
            <label className="label text-xs" htmlFor="fecha_deteccion">Fecha de detección</label>
            <input id="fecha_deteccion" type="date" className="input text-xs"
              defaultValue={new Date().toISOString().split('T')[0]}
              {...register('fecha_deteccion')} />
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <button type="button" className="btn-secondary text-xs py-1.5" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary text-xs py-1.5" disabled={isPending}>
              {isPending ? 'Registrando...' : 'Registrar NC'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────
export default function CapaPage() {
  const { tieneRol } = useAuthStore();
  const puedeCrear  = tieneRol(['ADMIN_CALIDAD','AUDITOR_LIDER','AUDITOR','JEFE_AREA']);

  const [pagina, setPagina]       = useState(1);
  const [busqueda, setBusqueda]   = useState('');
  const [origen, setOrigen]       = useState('');
  const [estado, setEstado]       = useState('');
  const [modalNC, setModalNC]     = useState(false);
  const [pestana, setPestana]     = useState<'lista' | 'alertas'>('lista');

  const { data, isLoading, refetch } = useNoConformidades({
    page: pagina, limit: 15,
    busqueda: busqueda || undefined,
    origen:   origen   || undefined,
    estado_codigo: estado || undefined,
  });
  const { data: alertas = [] }       = useAlertasCapa();
  const { data: estadisticas }        = useEstadisticasCapa();

  const ncs  = data?.datos ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Acciones Correctivas y Preventivas</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="btn-secondary gap-1.5 text-xs py-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => descargarArchivo('/capa/no-conformidades/exportar/csv', 'no-conformidades.csv')} className="btn-secondary gap-1.5 text-xs py-1.5" title="Exportar CSV">
            <FileDown className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => descargarArchivo('/capa/no-conformidades/exportar/xlsx', 'no-conformidades.xlsx')} className="btn-secondary gap-1.5 text-xs py-1.5" title="Exportar Excel">
            <FileSpreadsheet className="w-3.5 h-3.5" />
          </button>
          {puedeCrear && (
            <button
              onClick={() => {
                // #region debug-point A:capa-nueva-nc-click
                fetch('http://127.0.0.1:7777/event', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    sessionId: 'capa-nueva-nc-button',
                    runId: 'pre-fix',
                    hypothesisId: 'A',
                    location: 'frontend/src/app/capa/page.tsx:new-nc-button',
                    msg: '[DEBUG] clicked nueva nc button',
                    data: { modalNCBefore: modalNC, puedeCrear },
                    ts: Date.now(),
                  }),
                }).catch(() => {});
                // #endregion
                setModalNC(true);
              }}
              className="btn-primary gap-2 text-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Nueva NC
            </button>
          )}
        </div>
      </div>

      {/* KPIs CAPA */}
      {estadisticas && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Acciones vencidas',      valor: (estadisticas as any).accionesVencidas, color: 'text-red-700',   bg: 'bg-red-50',   icon: <AlertTriangle className="w-4 h-4" /> },
            { label: 'Por origen: Auditoría',  valor: (estadisticas as any).porOrigen?.find((o: any) => o.origen === 'AUDITORIA')?._count?.id ?? 0, color: 'text-blue-700',  bg: 'bg-blue-50',  icon: <CheckCircle className="w-4 h-4" /> },
            { label: 'Alertas próximas',       valor: alertas.length,     color: 'text-amber-700', bg: 'bg-amber-50', icon: <Clock className="w-4 h-4" /> },
            { label: 'Total NC registradas',   valor: meta?.total ?? '—', color: 'text-gray-700',  bg: 'bg-gray-50',  icon: <AlertTriangle className="w-4 h-4" /> },
          ].map(({ label, valor, color, bg, icon }) => (
            <div key={label} className={cn('card p-3 border', bg)}>
              <div className="flex items-center gap-2">
                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', bg, color)}>{icon}</div>
                <div>
                  <p className={cn('text-xl font-bold', color)}>{valor}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pestañas */}
      <div className="flex gap-1 border-b border-gray-200">
        {[
          { id: 'lista',   label: `No Conformidades ${meta ? `(${meta.total})` : ''}` },
          { id: 'alertas', label: `Alertas de vencimiento ${alertas.length > 0 ? `(${alertas.length})` : ''}` },
        ].map(({ id, label }) => (
          <button key={id}
            onClick={() => setPestana(id as any)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              pestana === id
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            )}>
            {label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {pestana === 'lista' && (
        <div className="space-y-3">
          {/* Filtros */}
          <div className="card p-3">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-40">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input type="search" placeholder="Buscar por código o descripción..."
                  className="input pl-8 text-xs py-1.5"
                  value={busqueda}
                  onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }} />
              </div>
              <select className="input text-xs py-1.5 w-40" value={origen}
                onChange={(e) => { setOrigen(e.target.value); setPagina(1); }}>
                <option value="">Todos los orígenes</option>
                <option value="AUDITORIA">Auditoría</option>
                <option value="INSPECCION">Inspección</option>
                <option value="QUEJA">Queja</option>
                <option value="INDICADOR">Indicador</option>
                <option value="REVISION_DIRECCION">Rev. Dirección</option>
                <option value="AUTOEVALUACION">Autoevaluación</option>
              </select>
              <select className="input text-xs py-1.5 w-40" value={estado}
                onChange={(e) => { setEstado(e.target.value); setPagina(1); }}>
                <option value="">Todos los estados</option>
                <option value="IDENTIFICADA">Identificada</option>
                <option value="ANALISIS">En Análisis</option>
                <option value="PLAN_ACCION">Plan de Acción</option>
                <option value="EN_EJECUCION">En Ejecución</option>
                <option value="VERIFICACION">En Verificación</option>
                <option value="CERRADA">Cerrada</option>
              </select>
            </div>
          </div>

          {/* Tabla */}
          <div className="card overflow-hidden">
            <table className="tabla" aria-label="No conformidades">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Origen</th>
                  <th>Descripción</th>
                  <th>Área</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                  <th>Estado</th>
                  <th><span className="sr-only">Ver</span></th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 8 }).map((__, j) => (
                          <td key={j}><div className="skeleton h-4 rounded w-full" /></td>
                        ))}
                      </tr>
                    ))
                  : ncs.length === 0
                  ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-sm text-gray-400">
                          <CheckCircle className="w-7 h-7 mx-auto mb-2 text-green-300" />
                          No hay no conformidades con los filtros aplicados.
                        </td>
                      </tr>
                    )
                  : ncs.map((nc: NoConformidad) => {
                      const totalAcciones = (nc as any)._count?.acciones_capa ?? 0;
                      return (
                        <tr key={nc.id}>
                          <td>
                            <span className="font-mono text-xs font-semibold text-orange-700">{nc.codigo}</span>
                          </td>
                          <td><OrigenBadge origen={nc.origen} /></td>
                          <td>
                            <p className="text-sm text-gray-800 truncate max-w-48">{nc.descripcion}</p>
                            {nc.requisito_afectado && (
                              <p className="text-xs text-gray-400 truncate">{nc.requisito_afectado}</p>
                            )}
                          </td>
                          <td><span className="text-xs text-gray-600">{nc.areas?.nombre_corto ?? nc.areas?.nombre ?? '—'}</span></td>
                          <td>
                            <span className="text-xs text-gray-500">
                              {new Date(nc.fecha_deteccion).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                            </span>
                          </td>
                          <td>
                            <span className={cn('text-xs font-medium', totalAcciones > 0 ? 'text-blue-700' : 'text-gray-400')}>
                              {totalAcciones} acción{totalAcciones !== 1 ? 'es' : ''}
                            </span>
                          </td>
                          <td>
                            <span className="badge-gris text-xs" style={nc.estados_flujo?.color_hex ? {
                              backgroundColor: `${nc.estados_flujo.color_hex}20`,
                              color: nc.estados_flujo.color_hex,
                            } : {}}>
                              {nc.estados_flujo?.nombre ?? '—'}
                            </span>
                          </td>
                          <td>
                            <a href={`/capa/${nc.id}`}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                              aria-label={`Ver detalle ${nc.codigo}`}>
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
                <span>{meta.total} registros</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPagina(p => p - 1)} disabled={!meta.tieneAnterior}
                    className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40" aria-label="Anterior">
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span>{pagina}/{meta.totalPaginas}</span>
                  <button onClick={() => setPagina(p => p + 1)} disabled={!meta.tieneSiguiente}
                    className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40" aria-label="Siguiente">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pestaña alertas */}
      {pestana === 'alertas' && (
        <div className="space-y-2">
          {alertas.length === 0 ? (
            <div className="card p-12 text-center">
              <CheckCircle className="w-10 h-10 mx-auto mb-3 text-green-400" />
              <p className="text-sm font-medium text-gray-600">Sin alertas de vencimiento</p>
              <p className="text-xs text-gray-400 mt-1">Todas las acciones CAPA están dentro del plazo.</p>
            </div>
          ) : alertas.map((a: any) => {
            const dias = diasHasta(a.fecha_compromiso);
            const vencida = estaVencido(a.fecha_compromiso);
            return (
              <div key={a.id} className={cn(
                'card p-4 flex items-start gap-4',
                vencida ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50',
              )}>
                <AlertTriangle className={cn('w-5 h-5 mt-0.5 flex-shrink-0', vencida ? 'text-red-500' : 'text-amber-500')} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-mono font-semibold text-gray-700">
                        {a.no_conformidades?.codigo}
                      </span>
                      <p className="text-sm font-medium text-gray-800 mt-0.5">{a.descripcion}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Área: {a.areas?.nombre} · Responsable: {a.usuarios_acciones_capa_responsable_idTousuarios?.nombres ?? '—'}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={cn('text-sm font-bold', vencida ? 'text-red-600' : 'text-amber-600')}>
                        {vencida ? `Venció hace ${Math.abs(dias)} días` : `Vence en ${dias} días`}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(a.fecha_compromiso).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  {/* Barra de avance */}
                  <div className="mt-2 flex items-center gap-2">
                    <div className="progress-bar flex-1">
                      <div className="progress-fill bg-blue-500" style={{ width: `${a.porcentaje_avance ?? 0}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 w-10 text-right">{a.porcentaje_avance ?? 0}%</span>
                  </div>
                </div>
                <a href={`/capa/${a.nc_id}`}
                  className="btn-secondary text-xs py-1.5 flex-shrink-0"
                  aria-label="Ver acción CAPA">
                  Ver acción
                </a>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modalNC && (
        <ModalCrearNC
          onClose={() => {
            // #region debug-point D:capa-modal-close
            fetch('http://127.0.0.1:7777/event', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId: 'capa-nueva-nc-button',
                runId: 'pre-fix',
                hypothesisId: 'D',
                location: 'frontend/src/app/capa/page.tsx:modal-close',
                msg: '[DEBUG] closing modal crear nc',
                data: { modalNCBefore: modalNC },
                ts: Date.now(),
              }),
            }).catch(() => {});
            // #endregion
            setModalNC(false);
          }}
        />
      )}
    </div>
  );
}
