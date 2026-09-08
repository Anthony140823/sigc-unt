'use client';
import { useState } from 'react';
import { Bell, CheckCheck, RefreshCw, ArrowRight, Inbox, Calendar } from 'lucide-react';
import { useNotificaciones, useMarcarNotificacionLeida } from '@/lib/hooks';
import { dashboardApi } from '@/lib/api/servicios';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils/cn';

const ICONOS_TIPO: Record<string, string> = {
  capa: '🔧', documento: '📄', auditoria: '📋', riesgo: '⚠️',
  indicador: '📊', encuesta: '📝', sistema: '⚙️', calidad: '✅',
};

export default function NotificacionesPage() {
  const qc = useQueryClient();
  const [soloNoLeidas, setSoloNoLeidas] = useState(true);
  const { data: notificaciones = [], isLoading, refetch } = useNotificaciones(soloNoLeidas);
  const marcarLeida = useMarcarNotificacionLeida();

  const handleMarcarTodas = async () => {
    try {
      await dashboardApi.marcarTodasLeidas();
      qc.invalidateQueries({ queryKey: ['dashboard', 'notificaciones'] });
    } catch { /* ignore */ }
  };

  const handleClick = async (n: any) => {
    if (!n.leida) {
      await marcarLeida.mutateAsync(n.id);
      qc.invalidateQueries({ queryKey: ['dashboard', 'notificaciones'] });
    }
    if (n.url_accion) window.location.href = n.url_accion;
  };

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Notificaciones</h2>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {notificaciones.length} notificacion{notificaciones.length !== 1 ? 'es' : ''}
            {soloNoLeidas && ` sin leer`}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => refetch()} className="btn-secondary gap-1.5 text-xs py-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleMarcarTodas} className="btn-secondary gap-1.5 text-xs py-1.5" disabled={notificaciones.length === 0}>
            <CheckCheck className="w-3.5 h-3.5" /> Marcar todas leídas
          </button>
        </div>
      </div>

      {/* Filtro */}
      <div className="flex gap-2">
        {[true, false].map((v) => (
          <button key={String(v)} onClick={() => setSoloNoLeidas(v)}
            className={cn('px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors',
              soloNoLeidas === v ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            )}
          >{v ? 'No leídas' : 'Todas'}</button>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {isLoading ? Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-20 rounded-xl" />
        )) : notificaciones.length === 0 ? (
          <div className="card p-12 text-center">
            <Inbox className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-500">No hay notificaciones{soloNoLeidas ? ' sin leer' : ''}.</p>
          </div>
        ) : notificaciones.map((n: any) => (
          <button
            key={n.id}
            onClick={() => handleClick(n)}
            className={cn(
              'w-full text-left rounded-xl border p-4 transition-colors hover:shadow-sm',
              n.leida ? 'bg-white border-gray-200' : 'bg-blue-50/50 border-blue-200',
            )}
          >
            <div className="flex items-start gap-3">
              <span className="text-lg flex-shrink-0 pt-0.5">{ICONOS_TIPO[n.tipo] ?? '📌'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={cn('text-sm font-medium', n.leida ? 'text-gray-700' : 'text-gray-900')}>
                    {n.titulo}
                  </p>
                  {!n.leida && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{n.mensaje}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Calendar className="w-3 h-3" />
                    {new Date(n.creado_en).toLocaleDateString('es-PE', {
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                  {n.url_accion && (
                    <span className="flex items-center gap-1 text-[10px] text-blue-600 font-medium">
                      Ver detalle <ArrowRight className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
