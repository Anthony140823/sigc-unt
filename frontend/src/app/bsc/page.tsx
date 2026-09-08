'use client';
import { useBscTablero } from '@/lib/hooks';
import { TrendingUp, TrendingDown, Minus, BarChart3, Layers, RefreshCw, File as FileIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { descargarArchivo } from '@/lib/api/servicios';
import type { BscPerspectiva, BscObjetivo, BscIndicador } from '@/lib/types';
import Link from 'next/link';

const PERSPECTIVA_COLORS: Record<string, { bg: string; border: string; icon: string; label: string }> = {
  Financiera:   { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-600', label: 'Perspectiva Financiera' },
  Clientes:     { bg: 'bg-blue-50',    border: 'border-blue-200',    icon: 'text-blue-600',    label: 'Perspectiva Clientes' },
  Procesos:     { bg: 'bg-amber-50',   border: 'border-amber-200',   icon: 'text-amber-600',   label: 'Perspectiva Procesos Internos' },
  Aprendizaje:  { bg: 'bg-purple-50',  border: 'border-purple-200',  icon: 'text-purple-600',  label: 'Perspectiva Aprendizaje y Crecimiento' },
};

const DEFAULT_COLOR = { bg: 'bg-gray-50', border: 'border-gray-200', icon: 'text-gray-600', label: 'Perspectiva' };

function TendenciaIcon({ tipo }: { tipo?: string }) {
  if (tipo === 'MAYOR') return <TrendingUp className="h-3.5 w-3.5 text-green-500" />;
  if (tipo === 'MENOR') return <TrendingDown className="h-3.5 w-3.5 text-red-500" />;
  return <Minus className="h-3.5 w-3.5 text-gray-400" />;
}

function SemaforoDot({ estado }: { estado?: 'VERDE' | 'AMARILLO' | 'ROJO' | null }) {
  const colors = { VERDE: 'bg-green-500', AMARILLO: 'bg-yellow-500', ROJO: 'bg-red-500' };
  return <span className={cn('inline-block h-2.5 w-2.5 rounded-full', estado ? colors[estado] : 'bg-gray-300')} title={estado ?? 'Sin datos'} />;
}

export default function BscPage() {
  const { data, isLoading, error, refetch } = useBscTablero();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-10 w-64 rounded" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-64 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card p-6">
        <p className="text-sm text-red-600">Error al cargar el tablero BSC.</p>
        <button onClick={() => refetch()} className="btn-secondary mt-4 gap-2 text-xs">
          <RefreshCw className="h-3.5 w-3.5" /> Reintentar
        </button>
      </div>
    );
  }

  const perspectivas = data.perspectivas;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Balanced Scorecard</h1>
          <p className="mt-1 text-sm text-gray-500">Objetivos estratégicos agrupados por perspectiva</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => descargarArchivo('/bsc/exportar/pdf', 'bsc.pdf')} className="btn-secondary gap-1.5 text-xs py-1.5" title="Exportar PDF">
            <FileIcon className="w-3.5 h-3.5" /> PDF
          </button>
          <button onClick={() => refetch()} className="btn-secondary gap-1.5 text-xs py-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {perspectivas.map((p: BscPerspectiva) => {
          const colors = PERSPECTIVA_COLORS[p.nombre] || DEFAULT_COLOR;
          return (
            <section key={p.nombre} className={cn('rounded-xl border p-4', colors.bg, colors.border)}>
              <div className="mb-4 flex items-center gap-2">
                <Layers className={cn('h-5 w-5', colors.icon)} />
                <h2 className="text-base font-semibold text-gray-900">{p.nombre}</h2>
                <span className="ml-auto rounded-full bg-white/60 px-2 py-0.5 text-xs font-medium text-gray-500">
                  {p.objetivos.length} objetivos
                </span>
              </div>

              <div className="space-y-3">
                {p.objetivos.map((obj: BscObjetivo) => (
                  <div key={obj.id} className="rounded-lg bg-white p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/indicadores?objetivo=${obj.id}`}
                          className="text-sm font-semibold text-gray-900 hover:text-blue-600"
                        >
                          {obj.codigo} &mdash; {obj.nombre}
                        </Link>
                      </div>
                      <span className="flex-shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                        {obj.total_indicadores} indicadores
                      </span>
                    </div>

                    {obj.indicadores.length > 0 && (
                      <div className="mt-2 divide-y divide-gray-50">
                        {obj.indicadores.map((ind: BscIndicador) => (
                          <div key={ind.id} className="flex items-center gap-2 py-1.5 text-xs text-gray-600">
                            <TendenciaIcon tipo={ind.tipo_tendencia} />
                            <SemaforoDot estado={ind.ultima_medicion?.estado_semaforo} />
                            <Link href={`/indicadores`} className="truncate text-gray-700 hover:text-blue-600">
                              {ind.codigo}
                            </Link>
                            <span className="ml-auto text-gray-400">
                              {ind.ultima_medicion
                                ? `${ind.ultima_medicion.valor_real}${ind.unidad_medida ? ` ${ind.unidad_medida}` : ''}`
                                : 'Sin medición'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {obj.indicadores.length === 0 && (
                      <p className="mt-2 text-xs text-gray-400">Sin indicadores asociados</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {perspectivas.length === 0 && (
        <div className="card p-8 text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-3 text-sm font-semibold text-gray-900">No hay objetivos estratégicos</h3>
          <p className="mt-1 text-sm text-gray-500">Crea objetivos estratégicos desde el mantenedor para visualizar el BSC.</p>
        </div>
      )}
    </div>
  );
}
