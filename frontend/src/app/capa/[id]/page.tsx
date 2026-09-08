'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ClipboardList,
  GitBranch,
  ShieldAlert,
  Target,
} from 'lucide-react';
import { useNoConformidad } from '@/lib/hooks';
import { cn } from '@/lib/utils/cn';
import type { AccionCapa, AnalisisCausaRaiz, NoConformidad } from '@/lib/types';
import IshikawaDiagram from '@/components/IshikawaDiagram';

type AnalisisDetalle = AnalisisCausaRaiz & {
  usuarios_analisis_causa_raiz_analista_idTousuarios?: {
    nombres?: string;
    apellidos?: string;
  };
};

type AccionDetalle = AccionCapa & {
  usuarios_acciones_capa_responsable_idTousuarios?: {
    nombres?: string;
    apellidos?: string;
  };
};

type NoConformidadDetalle = NoConformidad & {
  analisis_causa_raiz?: AnalisisDetalle[];
  acciones_capa?: AccionDetalle[];
};

function formatearFecha(valor?: string) {
  if (!valor) return 'No registrada';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return valor;

  return fecha.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function nombreCompleto(persona?: { nombres?: string; apellidos?: string }) {
  const nombre = [persona?.nombres, persona?.apellidos].filter(Boolean).join(' ').trim();
  return nombre || 'No asignado';
}

function OrigenBadge({ origen }: { origen: string }) {
  const estilos: Record<string, string> = {
    AUDITORIA: 'bg-blue-50 text-blue-700',
    INSPECCION: 'bg-slate-100 text-slate-700',
    QUEJA: 'bg-amber-50 text-amber-700',
    INDICADOR: 'bg-purple-50 text-purple-700',
    REVISION_DIRECCION: 'bg-cyan-50 text-cyan-700',
    AUTOEVALUACION: 'bg-emerald-50 text-emerald-700',
    OTRO: 'bg-gray-100 text-gray-700',
  };

  return (
    <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', estilos[origen] ?? 'bg-gray-100 text-gray-700')}>
      {origen.replaceAll('_', ' ')}
    </span>
  );
}

export default function CapaDetallePage() {
  const params = useParams<{ id: string | string[] }>();
  const ncId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const { data, isLoading, error } = useNoConformidad(ncId ?? '');

  const nc = data as NoConformidadDetalle | undefined;
  const analisis = nc?.analisis_causa_raiz ?? [];
  const acciones = nc?.acciones_capa ?? [];

  if (!ncId) {
    return (
      <div className="card p-6">
        <p className="text-sm text-red-600">No se pudo identificar la no conformidad solicitada.</p>
        <Link href="/capa" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800">
          <ArrowLeft className="h-4 w-4" />
          Volver a CAPA
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-10 w-48 rounded" />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="skeleton h-40 rounded-xl lg:col-span-2" />
          <div className="skeleton h-40 rounded-xl" />
        </div>
        <div className="skeleton h-72 rounded-xl" />
      </div>
    );
  }

  if (error || !nc) {
    return (
      <div className="card p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-red-500" />
          <div>
            <h2 className="text-base font-semibold text-gray-900">No se pudo cargar el detalle CAPA</h2>
            <p className="mt-1 text-sm text-gray-600">
              La no conformidad no existe o el servidor no devolvio informacion valida.
            </p>
          </div>
        </div>
        <Link href="/capa" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800">
          <ArrowLeft className="h-4 w-4" />
          Volver a CAPA
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/capa" className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800">
            <ArrowLeft className="h-4 w-4" />
            Volver a CAPA
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">{nc.codigo}</h1>
            <OrigenBadge origen={nc.origen} />
            <span
              className="rounded-full px-2.5 py-1 text-xs font-medium"
              style={nc.estados_flujo?.color_hex ? {
                backgroundColor: `${nc.estados_flujo.color_hex}20`,
                color: nc.estados_flujo.color_hex,
              } : undefined}
            >
              {nc.estados_flujo?.nombre ?? 'Sin estado'}
            </span>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-gray-600">{nc.descripcion}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card p-4 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-orange-600" />
            <h2 className="text-sm font-semibold text-gray-900">Resumen de la no conformidad</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Area</p>
              <p className="mt-1 text-sm text-gray-700">{nc.areas?.nombre ?? 'No registrada'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Proceso</p>
              <p className="mt-1 text-sm text-gray-700">
                {nc.procesos?.codigo ? `${nc.procesos.codigo} - ${nc.procesos.nombre}` : nc.procesos?.nombre ?? 'No asociado'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Fecha de deteccion</p>
              <p className="mt-1 text-sm text-gray-700">{formatearFecha(nc.fecha_deteccion)}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Requisito afectado</p>
              <p className="mt-1 text-sm text-gray-700">{nc.requisito_afectado || 'No especificado'}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Hallazgo relacionado</p>
              <p className="mt-1 text-sm text-gray-700">
                {nc.hallazgos?.codigo ? `${nc.hallazgos.codigo} - ${nc.hallazgos.descripcion ?? ''}`.trim() : 'Sin hallazgo asociado'}
              </p>
            </div>
          </div>
        </section>

        <section className="card p-4">
          <div className="mb-4 flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-gray-900">Indicadores rapidos</h2>
          </div>
          <div className="space-y-3">
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Analisis registrados</p>
              <p className="mt-1 text-xl font-bold text-gray-900">{analisis.length}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Acciones CAPA</p>
              <p className="mt-1 text-xl font-bold text-gray-900">{acciones.length}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Creada el</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{formatearFecha(nc.creado_en)}</p>
            </div>
          </div>
        </section>
      </div>

      <section className="card p-4">
        <div className="mb-4 flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-purple-600" />
          <h2 className="text-sm font-semibold text-gray-900">Analisis de causa raiz</h2>
        </div>
        {analisis.length === 0 ? (
          <p className="text-sm text-gray-500">Aun no se registran analisis de causa raiz para esta no conformidad.</p>
        ) : (
          <div className="space-y-4">
            {analisis.map((item) => {
              const esIshikawa = item.metodos_causa_raiz?.codigo === 'ISHIKAWA';
              return (
                <article key={item.id} className="rounded-xl border border-gray-100 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {item.metodos_causa_raiz?.nombre ?? 'Metodo no especificado'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Analista: {nombreCompleto(item.usuarios_analisis_causa_raiz_analista_idTousuarios)}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">{formatearFecha(item.fecha_analisis)}</span>
                  </div>

                  {esIshikawa ? (
                    <div className="mt-3">
                      <IshikawaDiagram
                        efecto={item.causa_raiz || 'Efecto'}
                        causas={[
                          { nombre: 'Personas',   factores: item.factores_contribuyentes?.filter((_, i) => i % 3 === 0) ?? [] },
                          { nombre: 'Métodos',    factores: item.factores_contribuyentes?.filter((_, i) => i % 3 === 1) ?? [] },
                          { nombre: 'Medición',   factores: item.factores_contribuyentes?.filter((_, i) => i % 3 === 2) ?? [] },
                        ]}
                      />
                      <div className="mt-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Causa raiz</p>
                        <p className="mt-1 text-sm text-gray-700">{item.descripcion_causa}</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Descripcion de la causa</p>
                          <p className="mt-1 text-sm text-gray-700">{item.descripcion_causa}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Causa raiz</p>
                          <p className="mt-1 text-sm text-gray-700">{item.causa_raiz}</p>
                        </div>
                      </div>
                      {item.factores_contribuyentes?.length ? (
                        <div className="mt-3">
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Factores contribuyentes</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {item.factores_contribuyentes.map((factor, index) => (
                              <span key={`${item.id}-${index}`} className="rounded-full bg-purple-50 px-2.5 py-1 text-xs text-purple-700">
                                {factor}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="card p-4">
        <div className="mb-4 flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-emerald-600" />
          <h2 className="text-sm font-semibold text-gray-900">Acciones CAPA</h2>
        </div>
        {acciones.length === 0 ? (
          <p className="text-sm text-gray-500">No hay acciones registradas para esta no conformidad.</p>
        ) : (
          <div className="space-y-3">
            {acciones.map((accion) => (
              <article key={accion.id} className="rounded-xl border border-gray-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        {accion.tipo_accion}
                      </span>
                      <span
                        className="rounded-full px-2.5 py-1 text-xs font-medium"
                        style={accion.estados_flujo?.color_hex ? {
                          backgroundColor: `${accion.estados_flujo.color_hex}20`,
                          color: accion.estados_flujo.color_hex,
                        } : undefined}
                      >
                        {accion.estados_flujo?.nombre ?? 'Sin estado'}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-gray-900">{accion.descripcion}</p>
                  </div>
                  <div className="min-w-36 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{formatearFecha(accion.fecha_compromiso)}</span>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">Avance: {accion.porcentaje_avance ?? 0}%</p>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Responsable</p>
                    <p className="mt-1 text-sm text-gray-700">
                      {nombreCompleto(accion.usuarios_acciones_capa_responsable_idTousuarios)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Area</p>
                    <p className="mt-1 text-sm text-gray-700">{accion.areas?.nombre ?? 'No asignada'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Cierre real</p>
                    <p className="mt-1 text-sm text-gray-700">{formatearFecha(accion.fecha_real_cierre)}</p>
                  </div>
                </div>

                {(accion.resultado_esperado || accion.resultado_real || accion.verificacion_efectividad) && (
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Resultado esperado</p>
                      <p className="mt-1 text-sm text-gray-700">{accion.resultado_esperado || 'No definido'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Resultado real</p>
                      <p className="mt-1 text-sm text-gray-700">{accion.resultado_real || 'Pendiente'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Verificacion</p>
                      <p className="mt-1 text-sm text-gray-700">{accion.verificacion_efectividad || 'Pendiente'}</p>
                    </div>
                  </div>
                )}

                <div className="mt-3">
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        (accion.porcentaje_avance ?? 0) >= 100 ? 'bg-emerald-500' : 'bg-blue-500',
                      )}
                      style={{ width: `${Math.min(accion.porcentaje_avance ?? 0, 100)}%` }}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
        <span>La ruta de detalle CAPA ya esta disponible para los enlaces de la lista y las alertas.</span>
      </div>
    </div>
  );
}
