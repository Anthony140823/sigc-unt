'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import {
  ArrowLeft, Shield, AlertTriangle, TrendingUp, FileText,
  Plus, Save, Calendar, Target, CheckCircle2,
} from 'lucide-react';
import { useRiesgo, useUsuarios } from '@/lib/hooks';
import { riesgosApi } from '@/lib/api/servicios';
import { useAuthStore } from '@/lib/store/auth.store';
import { cn } from '@/lib/utils/cn';
import { useQueryClient } from '@tanstack/react-query';
import { QK } from '@/lib/hooks';
import type { Riesgo, PlanMitigacion, SeguimientoRiesgo } from '@/lib/types';

function formatearFecha(valor?: string) {
  if (!valor) return 'No registrada';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return valor;
  return fecha.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
}

function NivelBadge({ nivel }: { nivel?: { codigo: string; nombre: string; color_hex?: string } }) {
  if (!nivel) return <span className="badge-gris">—</span>;
  return (
    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{
      backgroundColor: nivel.color_hex ? `${nivel.color_hex}20` : '#F3F4F6',
      color: nivel.color_hex ?? '#374151',
    }}>{nivel.nombre}</span>
  );
}

const COLORES_ESTADO: Record<string, string> = {
  IDENTIFICADO: 'badge-amarillo',
  EN_TRATAMIENTO: 'badge-azul',
  CONTROLADO: 'badge-verde',
  MATERIALIZADO: 'badge-rojo',
  CERRADO: 'bg-gray-100 text-gray-500 text-xs font-medium px-2.5 py-0.5 rounded-full',
};

export default function RiesgoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { tieneRol } = useAuthStore();
  const puedeGestionar = tieneRol(['ADMIN_CALIDAD', 'DIRECTOR_CALIDAD', 'JEFE_AREA', 'RESPONSABLE_PROCESO']);
  const puedeMitigar = tieneRol(['ADMIN_CALIDAD', 'DIRECTOR_CALIDAD', 'JEFE_AREA']);

  const { data: riesgo, isLoading, error } = useRiesgo(id);
  const { data: usuariosResp } = useUsuarios({ limit: 200 });
  const usuarios = usuariosResp?.datos ?? [];

  const [pestana, setPestana] = useState<'info' | 'mitigacion' | 'seguimiento'>('info');
  const [showMitigacion, setShowMitigacion] = useState(false);
  const [showSeguimiento, setShowSeguimiento] = useState(false);
  const [guardandoMit, setGuardandoMit] = useState(false);
  const [guardandoSeg, setGuardandoSeg] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-6 w-48 rounded" />
        <div className="card p-6 space-y-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-5 rounded w-full" />)}</div>
      </div>
    );
  }

  if (error || !riesgo) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="w-12 h-12 mx-auto text-red-400 mb-3" />
        <p className="text-gray-600 font-medium">No se pudo cargar el riesgo</p>
        <Link href="/riesgos" className="text-blue-600 text-sm mt-2 inline-block hover:underline">Volver a riesgos</Link>
      </div>
    );
  }

  const r = riesgo as Riesgo & {
    planes_mitigacion?: (PlanMitigacion & {
      usuarios?: { nombres?: string; apellidos?: string };
      estados_flujo?: { codigo: string; nombre: string };
    })[];
    seguimientos_riesgo?: (SeguimientoRiesgo & {
      usuarios?: { nombres?: string; apellidos?: string };
    })[];
  };

  const colorPuntaje = (p: number) => {
    if (p >= 15) return 'text-red-600';
    if (p >= 10) return 'text-orange-500';
    if (p >= 5) return 'text-amber-500';
    return 'text-green-600';
  };

  const handleCrearMitigacion = async (data: any) => {
    setGuardandoMit(true);
    try {
      await riesgosApi.crearMitigacion(id, data);
      qc.invalidateQueries({ queryKey: QK.riesgos.uno(id) });
      setShowMitigacion(false);
    } catch (e) { /* ignore */ }
    setGuardandoMit(false);
  };

  const handleRegistrarSeguimiento = async (data: any) => {
    setGuardandoSeg(true);
    try {
      await riesgosApi.registrarSeguimiento(id, data);
      qc.invalidateQueries({ queryKey: QK.riesgos.uno(id) });
      setShowSeguimiento(false);
    } catch (e) { /* ignore */ }
    setGuardandoSeg(false);
  };

  const puntuacion = r.puntuacion ? Number(r.puntuacion) : Number(r.probabilidad) * Number(r.impacto);

  return (
    <div className="space-y-5">
      {/* Encabezado */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link href="/riesgos" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-gray-900">{r.nombre}</h2>
              <NivelBadge nivel={r.niveles_riesgo} />
              <span className={cn(COLORES_ESTADO[r.estados_flujo?.codigo ?? ''] ?? 'badge-gris')}>{r.estados_flujo?.nombre ?? '—'}</span>
            </div>
            <p className="text-xs text-gray-500 font-mono">{r.codigo}</p>
          </div>
        </div>
      </div>

      {/* Score card */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Probabilidad', value: r.probabilidad, icon: TrendingUp },
          { label: 'Impacto', value: r.impacto, icon: AlertTriangle },
          { label: 'Puntuacion', value: puntuacion.toFixed(1), icon: Shield, cls: colorPuntaje(puntuacion) },
          { label: 'Nivel', value: r.niveles_riesgo?.nombre ?? '—', icon: Target },
        ].map(({ label, value, icon: Icon, cls }) => (
          <div key={label} className="card p-3 text-center">
            <Icon className={cn('w-4 h-4 mx-auto mb-1', cls ?? 'text-gray-400')} />
            <p className={cn('text-xl font-bold', cls ?? 'text-gray-800')}>{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Pestañas */}
      <div className="flex gap-1 border-b border-gray-200">
        {[
          { id: 'info', label: 'Informacion', icon: FileText },
          { id: 'mitigacion', label: `Planes de mitigacion (${r.planes_mitigacion?.length ?? 0})`, icon: Shield },
          { id: 'seguimiento', label: `Seguimientos (${r.seguimientos_riesgo?.length ?? 0})`, icon: TrendingUp },
        ].map(({ id: tabId, label, icon: Icon }) => (
          <button key={tabId} onClick={() => setPestana(tabId as any)}
            className={cn('flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              pestana === tabId ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700')}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      {/* Info */}
      {pestana === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><FileText className="w-4 h-4 text-gray-400" /> Detalle del riesgo</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <span className="text-gray-500">Tipo</span><span className="font-medium text-gray-800">{r.tipo_riesgo}</span>
              <span className="text-gray-500">Area</span><span className="font-medium text-gray-800">{r.areas?.nombre ?? '—'}</span>
              <span className="text-gray-500">Proceso</span><span className="font-medium text-gray-800">{r.procesos?.nombre ?? '—'}</span>
              <span className="text-gray-500">Objetivo estrategico</span><span className="font-medium text-gray-800">{r.objetivos_estrategicos?.nombre ?? '—'}</span>
              <span className="text-gray-500">Creado</span><span className="font-medium text-gray-800">{formatearFecha(r.creado_en)}</span>
            </div>
            {r.causa && <div><span className="text-xs text-gray-500 font-medium">Causa</span><p className="text-sm text-gray-700 mt-0.5">{r.causa}</p></div>}
            {r.consecuencia && <div><span className="text-xs text-gray-500 font-medium">Consecuencia</span><p className="text-sm text-gray-700 mt-0.5">{r.consecuencia}</p></div>}
          </div>
          <div className="card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Descripcion</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.descripcion}</p>
            <div className="flex items-center gap-2 pt-2">
              <span className="text-xs text-gray-400">Estado:</span>
              <span className={cn(COLORES_ESTADO[r.estados_flujo?.codigo ?? ''] ?? 'badge-gris')}>{r.estados_flujo?.nombre ?? '—'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Planes de mitigación */}
      {pestana === 'mitigacion' && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Planes de mitigacion</h3>
            {puedeMitigar && (
              <button onClick={() => setShowMitigacion(!showMitigacion)} className="btn-secondary text-xs gap-1.5 py-1.5">
                <Plus className="w-3.5 h-3.5" /> Nuevo plan
              </button>
            )}
          </div>
          {showMitigacion && (
            <MitigacionForm usuarios={usuarios} onGuardar={handleCrearMitigacion} onCancel={() => setShowMitigacion(false)} loading={guardandoMit} />
          )}
          {(!r.planes_mitigacion || r.planes_mitigacion.length === 0) ? (
            <p className="text-sm text-gray-400">Sin planes de mitigacion registrados.</p>
          ) : (
            <div className="space-y-3">
              {r.planes_mitigacion.map((p) => (
                <div key={p.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="badge-azul text-xs">{p.tipo_respuesta}</span>
                      <p className="text-sm text-gray-800 mt-1">{p.descripcion}</p>
                    </div>
                    <span className={cn(COLORES_ESTADO[p.estados_flujo?.codigo ?? ''] ?? 'badge-gris')}>{p.estados_flujo?.nombre ?? '—'}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                    <span>Inicio: {formatearFecha(p.fecha_inicio)}</span>
                    <span>Fin: {formatearFecha(p.fecha_fin)}</span>
                    {p.probabilidad_residual && <span>P residual: {p.probabilidad_residual}</span>}
                    {p.impacto_residual && <span>I residual: {p.impacto_residual}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Seguimientos */}
      {pestana === 'seguimiento' && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Seguimientos</h3>
            {puedeGestionar && (
              <button onClick={() => setShowSeguimiento(!showSeguimiento)} className="btn-secondary text-xs gap-1.5 py-1.5">
                <Plus className="w-3.5 h-3.5" /> Nuevo seguimiento
              </button>
            )}
          </div>
          {showSeguimiento && (
            <SeguimientoForm onGuardar={handleRegistrarSeguimiento} onCancel={() => setShowSeguimiento(false)} loading={guardandoSeg} />
          )}
          {(!r.seguimientos_riesgo || r.seguimientos_riesgo.length === 0) ? (
            <p className="text-sm text-gray-400">Sin seguimientos registrados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="tabla">
                <thead><tr><th>Fecha</th><th>Prob.</th><th>Imp.</th><th>Estado control</th><th>Observaciones</th></tr></thead>
                <tbody>
                  {r.seguimientos_riesgo.map((s) => (
                    <tr key={s.id}>
                      <td><span className="text-xs text-gray-600">{formatearFecha(s.fecha_seguimiento)}</span></td>
                      <td><span className="text-sm font-bold text-gray-700">{s.probabilidad_actual}</span></td>
                      <td><span className="text-sm font-bold text-gray-700">{s.impacto_actual}</span></td>
                      <td>
                        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full',
                          s.estado_control === 'EFECTIVO' ? 'badge-verde' :
                          s.estado_control === 'PARCIALMENTE_EFECTIVO' ? 'badge-amarillo' : 'badge-rojo')}>
                          {s.estado_control.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td><span className="text-xs text-gray-600">{s.observaciones ?? '—'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MitigacionForm({ usuarios, onGuardar, onCancel, loading }: {
  usuarios: any[]; onGuardar: (data: any) => void; onCancel: () => void; loading: boolean;
}) {
  const [tipo, setTipo] = useState('MITIGAR');
  const [descripcion, setDescripcion] = useState('');
  const [responsableId, setResponsableId] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [probRes, setProbRes] = useState('');
  const [impRes, setImpRes] = useState('');

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="label">Descripcion del plan</label>
          <textarea className="input text-sm w-full" rows={2} value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)} placeholder="Describa las acciones de mitigacion..." />
        </div>
        <div>
          <label className="label">Tipo de respuesta</label>
          <select className="input text-sm" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="MITIGAR">Mitigar</option>
            <option value="ACEPTAR">Aceptar</option>
            <option value="TRANSFERIR">Transferir</option>
            <option value="EVITAR">Evitar</option>
          </select>
        </div>
        <div>
          <label className="label">Responsable</label>
          <select className="input text-sm" value={responsableId} onChange={(e) => setResponsableId(e.target.value)}>
            <option value="">Sin asignar</option>
            {usuarios.map((u: any) => <option key={u.id} value={u.id}>{[u.nombres, u.apellidos].filter(Boolean).join(' ')}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Fecha inicio</label>
          <input className="input text-sm" type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
        </div>
        <div>
          <label className="label">Fecha fin</label>
          <input className="input text-sm" type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
        </div>
        <div>
          <label className="label">Probabilidad residual (1-5)</label>
          <input className="input text-sm" type="number" min="1" max="5" value={probRes} onChange={(e) => setProbRes(e.target.value)} />
        </div>
        <div>
          <label className="label">Impacto residual (1-5)</label>
          <input className="input text-sm" type="number" min="1" max="5" value={impRes} onChange={(e) => setImpRes(e.target.value)} />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={() => onGuardar({
          tipo_respuesta: tipo, descripcion,
          responsable_id: responsableId || undefined,
          fecha_inicio: fechaInicio || undefined, fecha_fin: fechaFin || undefined,
          probabilidad_residual: probRes ? Number(probRes) : undefined,
          impacto_residual: impRes ? Number(impRes) : undefined,
        })} disabled={!descripcion || loading} className="btn-primary text-xs gap-1.5 py-1.5">
          <Save className="w-3.5 h-3.5" />{loading ? 'Guardando...' : 'Crear plan'}
        </button>
        <button onClick={onCancel} className="btn-secondary text-xs py-1.5">Cancelar</button>
      </div>
    </div>
  );
}

function SeguimientoForm({ onGuardar, onCancel, loading }: {
  onGuardar: (data: any) => void; onCancel: () => void; loading: boolean;
}) {
  const [prob, setProb] = useState('');
  const [imp, setImp] = useState('');
  const [estado, setEstado] = useState('EFECTIVO');
  const [obs, setObs] = useState('');

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div>
          <label className="label">Probabilidad actual</label>
          <input className="input text-sm" type="number" min="1" max="5" value={prob}
            onChange={(e) => setProb(e.target.value)} placeholder="1-5" />
        </div>
        <div>
          <label className="label">Impacto actual</label>
          <input className="input text-sm" type="number" min="1" max="5" value={imp}
            onChange={(e) => setImp(e.target.value)} placeholder="1-5" />
        </div>
        <div>
          <label className="label">Estado del control</label>
          <select className="input text-sm" value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="EFECTIVO">Efectivo</option>
            <option value="PARCIALMENTE_EFECTIVO">Parcialmente efectivo</option>
            <option value="INEFECTIVO">Inefectivo</option>
          </select>
        </div>
        <div>
          <label className="label">Observaciones</label>
          <input className="input text-sm" value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Opcional" />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={() => onGuardar({
          probabilidad_actual: Number(prob), impacto_actual: Number(imp),
          estado_control: estado, observaciones: obs || undefined,
        })} disabled={!prob || !imp || loading} className="btn-primary text-xs gap-1.5 py-1.5">
          <Save className="w-3.5 h-3.5" />{loading ? 'Guardando...' : 'Registrar seguimiento'}
        </button>
        <button onClick={onCancel} className="btn-secondary text-xs py-1.5">Cancelar</button>
      </div>
    </div>
  );
}
