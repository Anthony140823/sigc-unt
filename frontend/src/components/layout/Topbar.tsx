// src/components/layout/Topbar.tsx
'use client';
import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Search, CheckCheck, LogOut, Shield, Sun, Moon } from 'lucide-react';
import { useNotificaciones, useMarcarNotificacionLeida } from '@/lib/hooks';
import { useAuthStore } from '@/lib/store/auth.store';
import { authApi, dashboardApi } from '@/lib/api/servicios';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils/cn';

// Mapa de títulos por ruta
const TITULOS: Record<string, string> = {
  '/dashboard':    'Dashboard',
  '/documentos':   'Gestión Documental',
  '/procesos':     'Mapa de Procesos',
  '/indicadores':  'Indicadores de Gestión',
  '/acreditacion': 'Acreditación y Autoevaluación',
  '/auditorias':   'Auditorías e Inspecciones',
  '/capa':         'Acciones Correctivas y Preventivas',
  '/riesgos':      'Gestión de Riesgos',
  '/encuestas':    'Gestión de la Satisfacción',
  '/usuarios':     'Gestión de Usuarios',
};

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { usuario, cerrarSesion } = useAuthStore();
  const [logoOk, setLogoOk] = useState(true);
  const [panelNotif, setPanelNotif] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: notificaciones = [] } = useNotificaciones(false);
  const { mutate: marcarLeida } = useMarcarNotificacionLeida();

  const sinLeer = notificaciones.filter((n) => !n.leida).length;

  const titulo = Object.entries(TITULOS).find(
    ([ruta]) => pathname === ruta || pathname.startsWith(ruta + '/'),
  )?.[1] ?? 'SIGC-UNT';

  // Cerrar panel al hacer clic fuera
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelNotif(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleMarcarTodas = async () => {
    await dashboardApi.marcarTodasLeidas();
    setPanelNotif(false);
  };

  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignorar error remoto y limpiar la sesión local.
    }
    cerrarSesion();
    router.push('/login');
  };

  return (
    <header className="dashboard-topbar">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <div className="hidden h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm sm:flex overflow-hidden">
            {logoOk ? (
              <img
                src="/logo-unt.png"
                alt="Universidad Nacional de Trujillo"
                className="h-10 w-10 object-contain"
                onError={() => setLogoOk(false)}
              />
            ) : (
              <Shield className="h-5 w-5 text-blue-700" />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-gray-900">{titulo}</h1>
            <p className="truncate text-xs text-gray-400">
              Universidad Nacional de Trujillo
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="search"
            placeholder="Buscar documento, NC, riesgo..."
            className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-gray-50 w-56
                       focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
            aria-label="Búsqueda global"
          />
        </div>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors dark:hover:bg-gray-800 dark:hover:text-gray-200"
          aria-label={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
          title={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setPanelNotif(!panelNotif)}
            className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label={`Notificaciones${sinLeer > 0 ? `, ${sinLeer} sin leer` : ''}`}
            aria-expanded={panelNotif}
          >
            <Bell className="w-4 h-4" />
            {sinLeer > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold
                               rounded-full flex items-center justify-center leading-none">
                {sinLeer > 9 ? '9+' : sinLeer}
              </span>
            )}
          </button>

          {panelNotif && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-gray-200
                            shadow-lg z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-900">Notificaciones</span>
                {sinLeer > 0 && (
                  <button
                    onClick={handleMarcarTodas}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                  >
                    <CheckCheck className="w-3 h-3" />
                    Marcar todas como leídas
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto scrollbar-thin">
                {notificaciones.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-400">
                    No hay notificaciones
                  </div>
                ) : (
                  notificaciones.slice(0, 15).map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        'px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors',
                        !n.leida && 'bg-blue-50/50',
                      )}
                      onClick={() => {
                        if (!n.leida) marcarLeida(n.id);
                        if (n.url_accion) window.location.href = n.url_accion;
                        setPanelNotif(false);
                      }}
                    >
                      <div className="flex items-start gap-2">
                        {!n.leida && (
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                        )}
                        <div className={!n.leida ? '' : 'pl-4'}>
                          <p className="text-xs font-semibold text-gray-800 line-clamp-1">
                            {n.titulo}
                          </p>
                          <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                            {n.mensaje}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-1">
                            {new Date(n.creado_en).toLocaleDateString('es-PE', {
                              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            {usuario?.nombres?.charAt(0)}{usuario?.apellidos?.charAt(0)}
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-semibold text-gray-900 leading-none">
              {usuario?.nombres?.split(' ')[0]} {usuario?.apellidos?.split(' ')[0]}
            </p>
            <p className="text-[10px] text-gray-400 leading-none mt-0.5">
              {usuario?.cargo ?? 'Sin cargo'}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="btn-secondary hidden sm:inline-flex"
          aria-label="Cerrar sesión"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
