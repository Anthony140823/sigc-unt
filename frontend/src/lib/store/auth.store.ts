// src/lib/store/auth.store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import Cookies from 'js-cookie';
import type { Usuario } from '../types';

interface AuthState {
  usuario:       Usuario | null;
  roles:         string[];
  accessToken:   string | null;
  refreshToken:  string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;

  // Acciones
  setCredentials: (data: {
    usuario: Usuario;
    roles: string[];
    access_token: string;
    refresh_token: string;
  }) => void;
  actualizarUsuario: (usuario: Partial<Usuario>) => void;
  cerrarSesion: () => void;
  tieneRol: (rol: string | string[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      usuario:         null,
      roles:           [],
      accessToken:     null,
      refreshToken:    null,
      isAuthenticated: false,
      hasHydrated:     false,

      setCredentials: ({ usuario, roles, access_token, refresh_token }) => {
        // Guardar tokens en cookies httpOnly-like con opciones seguras
        Cookies.set('access_token',  access_token,  { expires: 1/96,  secure: true, sameSite: 'strict' });
        Cookies.set('refresh_token', refresh_token, { expires: 7,      secure: true, sameSite: 'strict' });

        set({
          usuario,
          roles,
          accessToken:     access_token,
          refreshToken:    refresh_token,
          isAuthenticated: true,
        });
      },

      actualizarUsuario: (datosActualizados) => {
        set((state) => ({
          usuario: state.usuario ? { ...state.usuario, ...datosActualizados } : null,
        }));
      },

      cerrarSesion: () => {
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
        set({ usuario: null, roles: [], accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      tieneRol: (rol) => {
        const { roles } = get();
        if (roles.includes('SUPERADMIN')) return true;
        if (Array.isArray(rol)) return rol.some((r) => roles.includes(r));
        return roles.includes(rol);
      },
    }),
    {
      name: 'sigc-auth',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        usuario:         state.usuario,
        roles:           state.roles,
        isAuthenticated: state.isAuthenticated,
      }),
      skipHydration: true,
    },
  ),
);

// ══════════════════════════════════════════════════════════════
// Store de notificaciones
// ══════════════════════════════════════════════════════════════
interface NotifState {
  sinLeer: number;
  setSinLeer: (n: number) => void;
  decrementar: () => void;
}

export const useNotifStore = create<NotifState>((set) => ({
  sinLeer: 0,
  setSinLeer: (n) => set({ sinLeer: n }),
  decrementar: () => set((s) => ({ sinLeer: Math.max(0, s.sinLeer - 1) })),
}));
