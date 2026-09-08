// src/lib/api/cliente.ts
// Cliente HTTP centralizado con manejo automático de tokens JWT
import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import Cookies from 'js-cookie';

const isServer = typeof window === 'undefined';
const BASE_URL = isServer 
  ? (process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1')
  : (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1');

// Instancia principal
export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Interceptor de Request: inyecta el access_token ──────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = Cookies.get('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Interceptor de Response: refresca token si expira ────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = Cookies.get('refresh_token');
      if (!refreshToken) {
        isRefreshing = false;
        // Sin refresh token → redirigir al login
        if (typeof window !== 'undefined') {
          Cookies.remove('access_token');
          Cookies.remove('refresh_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token: newRefreshToken } = response.data.datos;

        Cookies.set('access_token', access_token, { expires: 1 / 96, secure: true, sameSite: 'strict' });
        if (newRefreshToken) {
          Cookies.set('refresh_token', newRefreshToken, { expires: 7, secure: true, sameSite: 'strict' });
        }

        processQueue(null, access_token);
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// ─── Tipos de respuesta estándar ──────────────────────────────
export interface RespuestaApi<T = any> {
  exito:     boolean;
  mensaje:   string;
  datos?:    T;
  timestamp: string;
}

export interface RespuestaPaginada<T> {
  datos: T[];
  meta: {
    total:        number;
    pagina:       number;
    limite:       number;
    totalPaginas: number;
    tieneSiguiente: boolean;
    tieneAnterior:  boolean;
  };
}

// ─── Helpers para extraer datos ───────────────────────────────
export const extraerDatos = <T>(res: AxiosResponse<RespuestaApi<T>>): T => {
  if (!res.data.exito || res.data.datos === undefined) {
    throw new Error(res.data.mensaje ?? 'Error en la respuesta del servidor');
  }
  return res.data.datos;
};
