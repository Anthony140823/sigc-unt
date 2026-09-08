// src/components/providers.tsx
'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth.store';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import ChatBotWidget from '@/components/ChatBotWidget';

export function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, hasHydrated } = useAuthStore();

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,           // 1 minuto por defecto
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  useEffect(() => {
    Promise.resolve(useAuthStore.persist.rehydrate()).finally(() => {
      useAuthStore.setState({ hasHydrated: true });
    });
  }, []);

  const esRutaPublica = pathname === '/login' || pathname.startsWith('/login/');
  const mostrarShell = !esRutaPublica;

  useEffect(() => {
    if (mostrarShell && hasHydrated && !isAuthenticated) {
      window.location.replace('/login');
    }
  }, [mostrarShell, hasHydrated, isAuthenticated]);

  const contenido = (() => {
    if (!mostrarShell) return children;

    if (!hasHydrated || !isAuthenticated) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Verificando sesión...</p>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="dashboard-shell">
          <aside className="dashboard-sidebar" role="navigation" aria-label="Navegación principal">
            <Sidebar />
          </aside>

          <div className="dashboard-main">
            <Topbar />
            <main id="main-content" className="dashboard-content" role="main">
              {children}
            </main>
          </div>
        </div>
        <ChatBotWidget />
      </>
    );
  })();

  return (
    <QueryClientProvider client={queryClient}>
      {contenido}
    </QueryClientProvider>
  );
}
