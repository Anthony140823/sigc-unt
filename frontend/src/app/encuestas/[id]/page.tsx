'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Calendar,
  CheckCircle2,
  ClipboardList,
  FileText,
  HelpCircle,
  Layers3,
  Users,
} from 'lucide-react';
import { useEncuesta } from '@/lib/hooks';
import { cn } from '@/lib/utils/cn';
import type { Encuesta, Pregunta, SeccionEncuesta } from '@/lib/types';

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

function etiquetaPoblacion(poblacion: string) {
  return poblacion.replaceAll('_', ' ');
}

function badgeEstado(encuesta?: Encuesta) {
  const codigo = encuesta?.estados_flujo?.codigo ?? '';
  if (codigo === 'ACTIVA') return 'badge-verde';
  if (codigo === 'CERRADA') return 'badge-azul';
  if (codigo === 'DISENO') return 'badge-amarillo';
  return 'badge-gris';
}

function tipoPregunta(pregunta: Pregunta) {
  return pregunta.tipos_pregunta?.nombre ?? pregunta.tipos_pregunta?.codigo ?? `Tipo ${pregunta.tipo_id}`;
}

export default function EncuestaDetallePage() {
  const params = useParams<{ id: string | string[] }>();
  const encuestaId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const { data, isLoading, error } = useEncuesta(encuestaId ?? '');

  const encuesta = data as Encuesta | undefined;
  const secciones = encuesta?.secciones_encuesta ?? [];
  const totalPreguntas = secciones.reduce(
    (acumulado, seccion) => acumulado + (seccion.preguntas_encuesta?.length ?? 0),
    0,
  );

  if (!encuestaId) {
    return (
      <div className="card p-6">
        <p className="text-sm text-red-600">No se pudo identificar la encuesta solicitada.</p>
        <Link href="/encuestas" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800">
          <ArrowLeft className="h-4 w-4" />
          Volver a Encuestas
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-10 w-52 rounded" />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="skeleton h-44 rounded-xl lg:col-span-2" />
          <div className="skeleton h-44 rounded-xl" />
        </div>
        <div className="skeleton h-80 rounded-xl" />
      </div>
    );
  }

  if (error || !encuesta) {
    return (
      <div className="card p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-red-500" />
          <div>
            <h2 className="text-base font-semibold text-gray-900">No se pudo cargar la encuesta</h2>
            <p className="mt-1 text-sm text-gray-600">
              La encuesta no existe o el servidor no devolvio informacion valida.
            </p>
          </div>
        </div>
        <Link href="/encuestas" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800">
          <ArrowLeft className="h-4 w-4" />
          Volver a Encuestas
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/encuestas" className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800">
            <ArrowLeft className="h-4 w-4" />
            Volver a Encuestas
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">{encuesta.codigo}</h1>
            <span className="badge-azul text-xs">{etiquetaPoblacion(encuesta.poblacion_objetivo)}</span>
            <span className={cn('text-xs font-medium px-2.5 py-0.5 rounded-full', badgeEstado(encuesta))}>
              {encuesta.estados_flujo?.nombre ?? 'Sin estado'}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-700">{encuesta.titulo}</p>
          {encuesta.descripcion && (
            <p className="mt-1 max-w-3xl text-sm text-gray-500">{encuesta.descripcion}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card p-4 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-gray-900">Ficha de la encuesta</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Programa academico</p>
              <p className="mt-1 text-sm text-gray-700">{encuesta.programas_academicos?.nombre ?? 'Institucional'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Ciclo academico</p>
              <p className="mt-1 text-sm text-gray-700">{encuesta.ciclo_academico ?? 'No especificado'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Fecha de inicio</p>
              <p className="mt-1 text-sm text-gray-700">{formatearFecha(encuesta.fecha_inicio)}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Fecha de fin</p>
              <p className="mt-1 text-sm text-gray-700">{formatearFecha(encuesta.fecha_fin)}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Tipo de participacion</p>
              <p className="mt-1 text-sm text-gray-700">{encuesta.es_anonima ? 'Anonima' : 'Identificada'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Creada el</p>
              <p className="mt-1 text-sm text-gray-700">{formatearFecha(encuesta.creado_en)}</p>
            </div>
          </div>
        </section>

        <section className="card p-4">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-semibold text-gray-900">Resumen rapido</h2>
          </div>
          <div className="space-y-3">
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Secciones</p>
              <p className="mt-1 text-xl font-bold text-gray-900">{secciones.length}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Preguntas</p>
              <p className="mt-1 text-xl font-bold text-gray-900">{totalPreguntas}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Participaciones</p>
              <p className="mt-1 text-xl font-bold text-gray-900">{encuesta._count?.participaciones_encuesta ?? 0}</p>
            </div>
          </div>
        </section>
      </div>

      <section className="card p-4">
        <div className="mb-4 flex items-center gap-2">
          <Layers3 className="h-4 w-4 text-purple-600" />
          <h2 className="text-sm font-semibold text-gray-900">Estructura de la encuesta</h2>
        </div>

        {secciones.length === 0 ? (
          <p className="text-sm text-gray-500">La encuesta aun no tiene secciones ni preguntas registradas.</p>
        ) : (
          <div className="space-y-4">
            {secciones.map((seccion: SeccionEncuesta, indice) => (
              <article key={seccion.id} className="rounded-xl border border-gray-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
                        Seccion {indice + 1}
                      </span>
                      <span className="text-xs text-gray-400">Orden {seccion.orden}</span>
                    </div>
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">{seccion.titulo}</h3>
                    {seccion.descripcion && (
                      <p className="mt-1 text-sm text-gray-500">{seccion.descripcion}</p>
                    )}
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    {(seccion.preguntas_encuesta?.length ?? 0)} pregunta(s)
                  </div>
                </div>

                {seccion.preguntas_encuesta?.length ? (
                  <div className="mt-4 space-y-3">
                    {seccion.preguntas_encuesta.map((pregunta, preguntaIndex) => (
                      <div key={pregunta.id} className="rounded-lg bg-gray-50 p-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                                P{preguntaIndex + 1}
                              </span>
                              <span className="text-xs text-gray-500">{tipoPregunta(pregunta)}</span>
                              {pregunta.obligatoria && (
                                <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                                  Obligatoria
                                </span>
                              )}
                            </div>
                            <p className="mt-2 text-sm font-medium text-gray-900">{pregunta.texto}</p>
                            {pregunta.texto_ayuda && (
                              <p className="mt-1 text-xs text-gray-500">{pregunta.texto_ayuda}</p>
                            )}
                          </div>
                          <HelpCircle className="h-4 w-4 flex-shrink-0 text-gray-400" />
                        </div>

                        {pregunta.opciones_pregunta?.length ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {pregunta.opciones_pregunta.map((opcion) => (
                              <span key={opcion.id} className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-600">
                                {opcion.texto}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-gray-500">Esta seccion aun no tiene preguntas.</p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Users className="h-4 w-4" />
            Participacion
          </div>
          <p className="mt-2 text-sm text-gray-500">
            La generacion de token y el envio de respuestas se gestionan desde el flujo de participacion.
          </p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Calendar className="h-4 w-4" />
            Vigencia
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Revisa las fechas antes de publicar la encuesta para apertura y cierre correctos.
          </p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <CheckCircle2 className="h-4 w-4" />
            Estado
          </div>
          <p className="mt-2 text-sm text-gray-500">
            La ruta de detalle ya esta disponible para los enlaces de la lista de encuestas.
          </p>
        </div>
      </div>
    </div>
  );
}
