// src/app/login/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Shield, Loader2, AlertCircle } from 'lucide-react';
import { authApi } from '@/lib/api/servicios';
import { useAuthStore } from '@/lib/store/auth.store';
import Cookies from 'js-cookie';

const esquemaLogin = z.object({
  username: z.string().min(3, 'Ingrese su usuario o email'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type DatosLogin = z.infer<typeof esquemaLogin>;

export default function LoginPage() {
  const router   = useRouter();
  const { setCredentials } = useAuthStore();
  const [mostrarPass, setMostrarPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoOk, setLogoOk] = useState(true);

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<DatosLogin>({ resolver: zodResolver(esquemaLogin) });

  const onSubmit = async (datos: DatosLogin) => {
    setError(null);
    try {
      // #region debug-point B:login-request-start
      fetch('http://127.0.0.1:7777/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'login-network-error',
          runId: 'pre-fix',
          hypothesisId: 'H1-H5',
          location: 'frontend/src/app/login/page.tsx:onSubmit:before-login',
          msg: '[DEBUG] login request starting',
          data: {
            pageOrigin: typeof window !== 'undefined' ? window.location.origin : null,
            apiUrlEnv: process.env.NEXT_PUBLIC_API_URL ?? null,
          },
          ts: Date.now(),
        }),
      }).catch(() => {});
      // #endregion

      const respuesta = await authApi.login(datos.username, datos.password);
      // #region debug-point A:login-response-shape
      fetch('http://127.0.0.1:7777/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'login-roles-error',
          runId: 'pre-fix',
          hypothesisId: 'A',
          location: 'frontend/src/app/login/page.tsx:onSubmit',
          msg: '[DEBUG] login response shape captured',
          data: {
            keys: respuesta && typeof respuesta === 'object' ? Object.keys(respuesta as Record<string, unknown>) : null,
            hasDatos: Boolean((respuesta as any)?.datos),
            hasUsuario: Boolean((respuesta as any)?.usuario),
            datosKeys: (respuesta as any)?.datos && typeof (respuesta as any).datos === 'object'
              ? Object.keys((respuesta as any).datos)
              : null,
            nestedUsuarioKeys: (respuesta as any)?.datos?.usuario && typeof (respuesta as any).datos.usuario === 'object'
              ? Object.keys((respuesta as any).datos.usuario)
              : null,
          },
          ts: Date.now(),
        }),
      }).catch(() => {});
      // #endregion

      // La respuesta viene directamente (sin envolver en {datos:...})
      const { access_token, refresh_token, usuario } = respuesta;

      setCredentials({
        usuario,
        roles: usuario.roles ?? [],
        access_token,
        refresh_token,
      });

      Cookies.set('access_token',  access_token,  { expires: 1/96, secure: true, sameSite: 'strict' });
      Cookies.set('refresh_token', refresh_token, { expires: 7,    secure: true, sameSite: 'strict' });

      router.push('/dashboard');
    } catch (err: any) {
      // #region debug-point C:login-request-error
      fetch('http://127.0.0.1:7777/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'login-network-error',
          runId: 'pre-fix',
          hypothesisId: 'H1-H5',
          location: 'frontend/src/app/login/page.tsx:onSubmit:catch',
          msg: '[DEBUG] login request failed',
          data: {
            pageOrigin: typeof window !== 'undefined' ? window.location.origin : null,
            apiUrlEnv: process.env.NEXT_PUBLIC_API_URL ?? null,
            errorName: err?.name ?? null,
            errorCode: err?.code ?? null,
            errorMessage: err?.message ?? null,
            responseStatus: err?.response?.status ?? null,
            responseData: err?.response?.data ?? null,
            requestUrl: err?.config?.baseURL && err?.config?.url
              ? `${err.config.baseURL}${err.config.url}`
              : err?.config?.url ?? null,
          },
          ts: Date.now(),
        }),
      }).catch(() => {});
      // #endregion

      const msg = err?.response?.data?.mensaje ?? err?.message ?? 'Error al iniciar sesión';
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B63FF] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-4 overflow-hidden shadow-lg">
            {logoOk ? (
              <img
                src="/logo-unt.png"
                alt="Universidad Nacional de Trujillo"
                className="h-14 w-14 object-contain"
                onError={() => setLogoOk(false)}
              />
            ) : (
              <Shield className="w-8 h-8 text-blue-700" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-white">SIGC-UNT</h1>
          <p className="text-blue-200 text-sm mt-1">
            Sistema Integrado de Gestión de la Calidad
          </p>
          <p className="text-blue-300 text-xs mt-0.5">
            Universidad Nacional de Trujillo
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Iniciar sesión</h2>

          {error && (
            <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Usuario */}
            <div>
              <label className="label" htmlFor="username">
                Usuario o email institucional
              </label>
              <input
                id="username"
                type="text"
                className={`input ${errors.username ? 'border-red-400 focus:ring-red-400' : ''}`}
                placeholder="jperez o jperez@unitru.edu.pe"
                autoComplete="username"
                {...register('username')}
              />
              {errors.username && (
                <p className="mt-1 text-xs text-red-600">{errors.username.message}</p>
              )}
            </div>

            {/* Contraseña */}
            <div>
              <label className="label" htmlFor="password">Contraseña</label>
              <div className="relative">
                <input
                  id="password"
                  type={mostrarPass ? 'text' : 'password'}
                  className={`input pr-10 ${errors.password ? 'border-red-400 focus:ring-red-400' : ''}`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register('password')}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setMostrarPass(!mostrarPass)}
                  aria-label={mostrarPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {mostrarPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Botón */}
            <button
              type="submit"
              className="btn-primary w-full mt-2"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Iniciando sesión...</>
              ) : (
                'Ingresar al sistema'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-400">
            Sistema de uso exclusivo para personal autorizado de la UNT.
            <br />¿Problemas de acceso?{' '}
            <a href="mailto:calidad@unitru.edu.pe" className="text-blue-600 hover:underline">
              Contactar a Calidad
            </a>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-blue-300 text-xs mt-6">
          SIGC-UNT v1.0 · Oficina de Calidad Universitaria · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
