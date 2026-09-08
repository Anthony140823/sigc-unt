# Debug Session: login-network-error

Status: OPEN

## Symptom
- Login con `superadmin` / `Admin@UNT2025!` muestra `Network Error` en frontend productivo.

## Scope
- Frontend standalone en produccion local
- Flujo de autenticacion `/login`

## Hypotheses
1. El frontend productivo apunta a una `baseURL` de API incorrecta o vacia y Axios falla antes de recibir respuesta HTTP.
2. El backend esta arriba, pero el navegador bloquea la solicitud por CORS o `credentials` en el entorno productivo local.
3. El login usa cookies `secure: true` o alguna condicion de navegador/HTTP que rompe el flujo en `http://localhost`.
4. La build standalone no expone correctamente variables de entorno del frontend y el cliente queda intentando llamar a un host inexistente.
5. El error no es de credenciales, sino de conectividad a `/auth/login`, por lo que la respuesta nunca llega al frontend.

## Evidence Plan
- Inspeccionar `api client`, `authApi.login()` y `login/page.tsx`.
- Verificar URL de backend desde el frontend productivo.
- Instrumentar el punto de submit/login para capturar URL, error Axios y estado de respuesta.
- Reproducir y analizar logs antes de aplicar fix.

## Evidence Collected
- `frontend/src/lib/api/cliente.ts` usa `http://localhost:4000/api/v1` por defecto en browser.
- `backend/.env` estaba en `FRONTEND_URL=http://localhost:3000`, excluyendo el frontend productivo en `3002`.
- Pre-fix CORS `OPTIONS /api/v1/auth/login` desde `Origin: http://localhost:3002` no devolvia `Access-Control-Allow-Origin`.
- Post-fix CORS `OPTIONS /api/v1/auth/login` desde `Origin: http://localhost:3002` devolvio `Access-Control-Allow-Origin: http://localhost:3002`.
- Post-fix `POST /api/v1/auth/login` con `superadmin` / `Admin@UNT2025!` devolvio `access_token`, `refresh_token` y `usuario`.

## Root Cause
- El backend solo permitia `http://localhost:3000` en CORS, pero el frontend desplegado estaba en `http://localhost:3002`.

## Fix Applied
- `backend/src/main.ts`: soporte para multiples origenes separados por coma y callback CORS.
- `backend/.env`: `FRONTEND_URL=http://localhost:3000,http://localhost:3002`.

## Additional Evidence
- El backend siguio devolviendo `POST /api/v1/auth/login 200` aun cuando el usuario veia `Internal Server Error`.
- La salida del frontend standalone mostro `MODULE_NOT_FOUND` para `...standalone/.next-prod/server/pages/_error.js`.
- Se cambio temporalmente el despliegue del frontend a `next dev -p 3002` para eliminar el paquete standalone corrupto y validar el login sobre codigo actualizado.

## Status
- OPEN
- Esperando confirmacion visual del usuario en el navegador.
