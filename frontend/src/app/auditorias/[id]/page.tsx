'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  ArrowLeft, Calendar, Users, ClipboardList, AlertTriangle, FileText,
  Plus, X, CheckCircle2, XCircle, Save, UserPlus, UserMinus,
} from 'lucide-react';
import { useAuditoria, useChecklist, useResponderChecklist, useAsignarAuditor, useCambiarEstadoAuditoria, useCrearHallazgo, useCerrarHallazgo, useUsuarios, useAreas } from '@/lib/hooks';
import { useAuthStore } from '@/lib/store/auth.store';
import { cn } from '@/lib/utils/cn';
import type { Auditoria, Hallazgo, AuditorAsignado } from '@/lib/types';

const COLORES_ESTADO: Record<string, string> = {
  PROGRAMADA:     'badge-gris',
  EN_EJECUCION:   'badge-amarillo',
  FINALIZADA:     'badge-azul',
  INFORME_EMITIDO:'badge-verde',
  CERRADA:        'bg-gray-100 text-gray-500 text-xs font-medium px-2.5 py-0.5 rounded-full',
  CANCELADA:      'badge-rojo',
};

const SIGUIENTE_ESTADO: Record<string, string> = {
  PROGRAMADA: 'EN_EJECUCION',
  EN_EJECUCION: 'FINALIZADA',
  FINALIZADA: 'INFORME_EMITIDO',
  INFORME_EMITIDO: 'CERRADA',
};

function formatearFecha(valor?: string) {
  if (!valor) return 'No registrada';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return valor;
  return fecha.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
}

function SeveridadBadge({ severidad, nombre }: { severidad: number; nombre: string }) {
  const estilos = severidad >= 3 ? 'badge-rojo' : severidad === 2 ? 'badge-amarillo' : 'badge-verde';
  return <span className={cn('text-xs font-medium', estilos)}>{nombre}</span>;
}

export default function AuditoriaDetallePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { tieneRol } = useAuthStore();
  const puedeGestionar = tieneRol(['ADMIN_CALIDAD', 'AUDITOR_LIDER']);

  const { data: auditoria, isLoading, error } = useAuditoria(id);
  const { data: checklistRaw, isLoading: checklistLoading } = useChecklist(id);
  const checklist: any[] = Array.isArray(checklistRaw) ? checklistRaw : [];
  const { data: usuariosResp } = useUsuarios({ limit: 200 });
  const usuarios = usuariosResp?.datos ?? [];
  const { data: areas = [] } = useAreas();

  const asignarAuditor = useAsignarAuditor(id);
  const cambiarEstado = useCambiarEstadoAuditoria(id);
  const crearHallazgo = useCrearHallazgo(id);
  const cerrarHallazgo = useCerrarHallazgo();
  const responderChecklist = useResponderChecklist(id);

  const [pestana, setPestana] = useState<'info' | 'equipo' | 'checklist' | 'hallazgos'>('info');
  const [showAsignar, setShowAsignar] = useState(false);
  const [showNuevoHallazgo, setShowNuevoHallazgo] = useState(false);
  const [showAvanzar, setShowAvanzar] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-6 w-48 rounded" />
        <div className="card p-6 space-y-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-5 rounded w-full" />)}</div>
      </div>
    );
  }

  if (error || !auditoria) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="w-12 h-12 mx-auto text-red-400 mb-3" />
        <p className="text-gray-600 font-medium">No se pudo cargar la auditoría</p>
        <Link href="/auditorias" className="text-blue-600 text-sm mt-2 inline-block hover:underline">Volver a auditorías</Link>
      </div>
    );
  }

  const a = auditoria as any;
  const estadoActual = a.estados_flujo?.codigo;
  const puedeAvanzar = puedeGestionar && SIGUIENTE_ESTADO[estadoActual] && estadoActual !== 'CERRADA' && estadoActual !== 'CANCELADA';

  return (
    <div className="space-y-5">
      {/* Encabezado */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link href="/auditorias" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-gray-900">{a.nombre}</h2>
              <span className={cn(COLORES_ESTADO[estadoActual ?? ''] ?? 'badge-gris')}>{a.estados_flujo?.nombre ?? '—'}</span>
            </div>
            <p className="text-xs text-gray-500 font-mono">{a.codigo}</p>
          </div>
        </div>
        {puedeAvanzar && (
          <div className="relative">
            <button onClick={() => setShowAvanzar(!showAvanzar)} className="btn-primary text-xs gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Avanzar a {a.estados_flujo?.nombre ? SIGUIENTE_ESTADO[estadoActual]?.replace(/_/g, ' ').toLowerCase() : ''}
            </button>
            {showAvanzar && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10 w-64">
                <p className="text-xs text-gray-600 mb-2">¿Cambiar estado a <strong>{SIGUIENTE_ESTADO[estadoActual]?.replace(/_/g, ' ')}</strong>?</p>
                <div className="flex gap-2">
                  <button onClick={() => { cambiarEstado.mutate(SIGUIENTE_ESTADO[estadoActual]); setShowAvanzar(false); }} className="btn-primary text-xs py-1.5" disabled={cambiarEstado.isPending}>
                    {cambiarEstado.isPending ? 'Cambiando...' : 'Confirmar'}
                  </button>
                  <button onClick={() => setShowAvanzar(false)} className="btn-secondary text-xs py-1.5">Cancelar</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pestañas */}
      <div className="flex gap-1 border-b border-gray-200">
        {[
          { id: 'info', label: 'Información', icon: FileText },
          { id: 'equipo', label: `Equipo auditor (${a.auditores_asignados?.length ?? 0})`, icon: Users },
          { id: 'checklist', label: 'Checklist', icon: ClipboardList },
          { id: 'hallazgos', label: `Hallazgos (${a.hallazgos?.length ?? 0})`, icon: AlertTriangle },
        ].map(({ id: tabId, label, icon: Icon }) => (
          <button key={tabId} onClick={() => setPestana(tabId as any)}
            className={cn('flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              pestana === tabId ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700')}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      {/* Pestaña: Información */}
      {pestana === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><FileText className="w-4 h-4 text-gray-400" /> Información general</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <span className="text-gray-500">Tipo</span><span className="font-medium text-gray-800">{a.tipos_auditoria?.nombre ?? '—'}</span>
              <span className="text-gray-500">Área auditada</span><span className="font-medium text-gray-800">{a.areas?.nombre ?? '—'}</span>
              <span className="text-gray-500">Plan asociado</span><span className="font-medium text-gray-800">{a.planes_auditoria?.nombre ?? '—'}</span>
              <span className="text-gray-500">Objetivo</span><span className="font-medium text-gray-800">{a.objetivo ?? '—'}</span>
              <span className="text-gray-500">Alcance</span><span className="font-medium text-gray-800">{a.alcance ?? '—'}</span>
            </div>
          </div>
          <div className="card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" /> Fechas</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <span className="text-gray-500">Programada inicio</span><span className="font-medium text-gray-800">{formatearFecha(a.fecha_programada_inicio)}</span>
              <span className="text-gray-500">Programada fin</span><span className="font-medium text-gray-800">{formatearFecha(a.fecha_programada_fin)}</span>
              <span className="text-gray-500">Real inicio</span><span className="font-medium text-gray-800">{formatearFecha(a.fecha_real_inicio)}</span>
              <span className="text-gray-500">Real fin</span><span className="font-medium text-gray-800">{formatearFecha(a.fecha_real_fin)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Pestaña: Equipo auditor */}
      {pestana === 'equipo' && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Users className="w-4 h-4 text-gray-400" /> Equipo auditor</h3>
            {puedeGestionar && (
              <button onClick={() => setShowAsignar(!showAsignar)} className="btn-secondary text-xs gap-1.5 py-1.5">
                <UserPlus className="w-3.5 h-3.5" /> Asignar auditor
              </button>
            )}
          </div>

          {showAsignar && (
            <AsignarAuditorForm
              usuarios={usuarios}
              onAsignar={(data) => { asignarAuditor.mutate(data); setShowAsignar(false); }}
              onCancel={() => setShowAsignar(false)}
              loading={asignarAuditor.isPending}
            />
          )}

          {(!a.auditores_asignados || a.auditores_asignados.length === 0) ? (
            <p className="text-sm text-gray-400">No hay auditores asignados.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {a.auditores_asignados.map((aud: any) => (
                <div key={aud.id} className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full text-sm">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold">
                    {(aud.usuarios?.nombres?.[0] ?? '?').toUpperCase()}
                  </span>
                  <span className="font-medium text-gray-700">
                    {[aud.usuarios?.nombres, aud.usuarios?.apellidos].filter(Boolean).join(' ') || 'Sin nombre'}
                  </span>
                  <span className="text-xs text-gray-400">({aud.rol_auditoria})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pestaña: Checklist */}
      {pestana === 'checklist' && (
        <ChecklistSection
          auditoriaId={id}
          items={checklist}
          loading={checklistLoading}
          puedeEditar={puedeGestionar}
          onGuardar={(data) => responderChecklist.mutate(data)}
          saving={responderChecklist.isPending}
        />
      )}

      {/* Pestaña: Hallazgos */}
      {pestana === 'hallazgos' && (
        <HallazgosSection
          hallazgos={a.hallazgos}
          puedeCrear={puedeGestionar}
          showNuevo={showNuevoHallazgo}
          onToggleNuevo={() => setShowNuevoHallazgo(!showNuevoHallazgo)}
          onCrear={(data) => { crearHallazgo.mutate(data); setShowNuevoHallazgo(false); }}
          creating={crearHallazgo.isPending}
          onCerrar={(hallazgoId, data) => cerrarHallazgo.mutate({ hallazgoId, data })}
          areas={areas}
        />
      )}

      {/* Modales toast de éxito/error */}
      {asignarAuditor.isSuccess && <p className="text-xs text-green-600">Auditor asignado correctamente.</p>}
      {cambiarEstado.isSuccess && <p className="text-xs text-green-600">Estado actualizado.</p>}
      {crearHallazgo.isSuccess && <p className="text-xs text-green-600">Hallazgo registrado.</p>}
    </div>
  );
}

// ─── Formulario asignar auditor ───────────────────────────────
function AsignarAuditorForm({ usuarios, onAsignar, onCancel, loading }: {
  usuarios: any[]; onAsignar: (data: any) => void; onCancel: () => void; loading: boolean;
}) {
  const [usuarioId, setUsuarioId] = useState('');
  const [rol, setRol] = useState('AUDITOR');

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <select className="input text-sm" value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)}>
          <option value="">Seleccionar usuario...</option>
          {usuarios.map((u: any) => (
            <option key={u.id} value={u.id}>{[u.nombres, u.apellidos].filter(Boolean).join(' ')} — {u.email}</option>
          ))}
        </select>
        <select className="input text-sm" value={rol} onChange={(e) => setRol(e.target.value)}>
          <option value="LIDER">Auditor Líder</option>
          <option value="AUDITOR">Auditor</option>
          <option value="OBSERVADOR">Observador</option>
          <option value="EXPERTO_TECNICO">Experto Técnico</option>
        </select>
        <div className="flex gap-2">
          <button onClick={() => onAsignar({ usuario_id: usuarioId, rol_auditoria: rol })} disabled={!usuarioId || loading}
            className="btn-primary text-xs py-1.5 gap-1.5"><UserPlus className="w-3.5 h-3.5" />{loading ? 'Asignando...' : 'Asignar'}</button>
          <button onClick={onCancel} className="btn-secondary text-xs py-1.5">Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Sección Checklist ──────────────────────────────────────
function ChecklistSection({ auditoriaId, items, loading, puedeEditar, onGuardar, saving }: {
  auditoriaId: string; items: any[]; loading: boolean; puedeEditar: boolean;
  onGuardar: (data: any) => void; saving: boolean;
}) {
  const [respuestas, setRespuestas] = useState<Record<string, { respuesta: string; observacion?: string; genera_hallazgo?: boolean }>>({});

  if (loading) {
    return <div className="card p-5 space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-10 rounded w-full" />)}</div>;
  }

  const itemsList = Array.isArray(items) ? items : [];

  if (itemsList.length === 0) {
    return (
      <div className="card p-8 text-center">
        <ClipboardList className="w-10 h-10 mx-auto text-gray-300 mb-3" />
        <p className="text-sm text-gray-500">No hay checklist configurado para esta auditoría.</p>
        <p className="text-xs text-gray-400 mt-1">El checklist se asigna según el tipo de auditoría.</p>
      </div>
    );
  }

  const setResp = (itemId: string, field: string, value: any) => {
    setRespuestas(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value },
    }));
  };

  const handleGuardar = () => {
    const items = Object.entries(respuestas).map(([item_id, vals]) => ({
      item_id, respuesta: vals.respuesta,
      ...(vals.observacion ? { observacion: vals.observacion } : {}),
      ...(vals.genera_hallazgo !== undefined ? { genera_hallazgo: vals.genera_hallazgo } : {}),
    }));
    onGuardar({ items });
  };

  const totalRespondidas = Object.keys(respuestas).length;

  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Lista de verificación</h3>
        {puedeEditar && totalRespondidas > 0 && (
          <button onClick={handleGuardar} disabled={saving} className="btn-primary text-xs gap-1.5 py-1.5">
            <Save className="w-3.5 h-3.5" />{saving ? 'Guardando...' : `Guardar respuestas (${totalRespondidas})`}
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="tabla">
          <thead>
            <tr><th>#</th><th>Pregunta / Criterio</th><th>Respuesta</th><th>Observación</th><th>Genera hallazgo</th></tr>
          </thead>
          <tbody>
            {itemsList.map((item: any, idx: number) => {
              const resp = respuestas[item.id] || {};
              const itemRespuesta = item.respuestas_checklist?.[0];
              return (
                <tr key={item.id}>
                  <td className="text-xs text-gray-400">{idx + 1}</td>
                  <td><p className="text-sm text-gray-800">{item.pregunta}</p></td>
                  <td>
                    {puedeEditar ? (
                      <select className="input text-xs py-1 w-24" value={resp.respuesta ?? itemRespuesta?.respuesta ?? ''}
                        onChange={(e) => setResp(item.id, 'respuesta', e.target.value)}>
                        <option value="">—</option><option value="SI">Sí</option><option value="NO">No</option><option value="N/A">N/A</option>
                      </select>
                    ) : (
                      <span className="text-sm font-medium">{itemRespuesta?.respuesta ?? '—'}</span>
                    )}
                  </td>
                  <td>
                    {puedeEditar ? (
                      <input className="input text-xs py-1 w-40" placeholder="Observación..." value={resp.observacion ?? itemRespuesta?.observacion ?? ''}
                        onChange={(e) => setResp(item.id, 'observacion', e.target.value)} />
                    ) : (
                      <span className="text-xs text-gray-600">{itemRespuesta?.observacion ?? '—'}</span>
                    )}
                  </td>
                  <td className="text-center">
                    {puedeEditar ? (
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600"
                        checked={resp.genera_hallazgo ?? itemRespuesta?.genera_hallazgo ?? false}
                        onChange={(e) => setResp(item.id, 'genera_hallazgo', e.target.checked)} />
                    ) : (
                      <span>{itemRespuesta?.genera_hallazgo ? <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" /> : <XCircle className="w-4 h-4 text-gray-300 mx-auto" />}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Sección Hallazgos ─────────────────────────────────────
function HallazgosSection({ hallazgos, puedeCrear, showNuevo, onToggleNuevo, onCrear, creating, onCerrar, areas }: {
  hallazgos: any[]; puedeCrear: boolean; showNuevo: boolean; onToggleNuevo: () => void;
  onCrear: (data: any) => void; creating: boolean; onCerrar: (id: string, data: any) => void; areas: any[];
}) {
  const [cerrando, setCerrando] = useState<string | null>(null);

  const handleCerrar = (hallazgoId: string) => {
    onCerrar(hallazgoId, { con_observacion: false });
    setCerrando(null);
  };

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-gray-400" /> Hallazgos
        </h3>
        {puedeCrear && (
          <button onClick={onToggleNuevo} className="btn-secondary text-xs gap-1.5 py-1.5">
            <Plus className="w-3.5 h-3.5" /> Nuevo hallazgo
          </button>
        )}
      </div>

      {showNuevo && (
        <NuevoHallazgoForm areas={areas} onCrear={onCrear} onCancel={onToggleNuevo} loading={creating} />
      )}

      {(!hallazgos || hallazgos.length === 0) ? (
        <p className="text-sm text-gray-400 py-4 text-center">No se registraron hallazgos.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="tabla" aria-label="Hallazgos de la auditoría">
            <thead>
              <tr><th>Código</th><th>Descripción</th><th>Tipo</th><th>Área</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {hallazgos.map((h: any) => (
                <tr key={h.id}>
                  <td><span className="font-mono text-xs font-semibold text-orange-600">{h.codigo}</span></td>
                  <td><p className="text-sm text-gray-800 truncate max-w-64">{h.descripcion}</p></td>
                  <td><SeveridadBadge severidad={h.tipos_hallazgo?.severidad ?? 0} nombre={h.tipos_hallazgo?.nombre ?? '—'} /></td>
                  <td><span className="text-xs text-gray-600">{h.areas?.nombre_corto ?? h.areas?.nombre ?? '—'}</span></td>
                  <td><span className={cn(COLORES_ESTADO[h.estados_flujo?.codigo ?? ''] ?? 'badge-gris')}>{h.estados_flujo?.nombre ?? '—'}</span></td>
                  <td>
                    {h.estados_flujo?.codigo === 'ABIERTO' && puedeCrear && (
                      <button onClick={() => setCerrando(h.id)} className="text-xs text-green-600 hover:text-green-800 font-medium">
                        Cerrar
                      </button>
                    )}
                    {cerrando === h.id && (
                      <div className="inline-flex gap-1 ml-2">
                        <button onClick={() => handleCerrar(h.id)} className="text-xs text-green-700 font-medium">Confirmar</button>
                        <button onClick={() => setCerrando(null)} className="text-xs text-gray-500">X</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Formulario nuevo hallazgo ──────────────────────────────
function NuevoHallazgoForm({ areas, onCrear, onCancel, loading }: {
  areas: any[]; onCrear: (data: any) => void; onCancel: () => void; loading: boolean;
}) {
  const [descripcion, setDescripcion] = useState('');
  const [tipoId, setTipoId] = useState('1');
  const [areaId, setAreaId] = useState('');
  const [requisito, setRequisito] = useState('');
  const [fechaLimite, setFechaLimite] = useState('');

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="label">Descripción del hallazgo</label>
          <textarea className="input text-sm w-full" rows={3} value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)} placeholder="Describa el hallazgo encontrado..." />
        </div>
        <div>
          <label className="label">Tipo de hallazgo</label>
          <select className="input text-sm" value={tipoId} onChange={(e) => setTipoId(e.target.value)}>
            <option value="1">Oportunidad de Mejora</option>
            <option value="2">Observación</option>
            <option value="3">No Conformidad Menor</option>
            <option value="4">No Conformidad Mayor</option>
          </select>
        </div>
        <div>
          <label className="label">Área responsable</label>
          <select className="input text-sm" value={areaId} onChange={(e) => setAreaId(e.target.value)}>
            <option value="">Seleccionar...</option>
            {areas.map((a: any) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Requisito incumplido</label>
          <input className="input text-sm" value={requisito} onChange={(e) => setRequisito(e.target.value)}
            placeholder="Ej: ISO 9001:2015 7.5.3" />
        </div>
        <div>
          <label className="label">Fecha límite de cierre</label>
          <input className="input text-sm" type="date" value={fechaLimite} onChange={(e) => setFechaLimite(e.target.value)} />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={() => onCrear({ tipo_id: parseInt(tipoId), descripcion, area_id: areaId, requisito_incumplido: requisito || undefined, fecha_limite_cierre: fechaLimite || undefined })}
          disabled={!descripcion || !areaId || loading} className="btn-primary text-xs gap-1.5 py-1.5">
          <Plus className="w-3.5 h-3.5" />{loading ? 'Guardando...' : 'Registrar hallazgo'}
        </button>
        <button onClick={onCancel} className="btn-secondary text-xs py-1.5">Cancelar</button>
      </div>
    </div>
  );
}
