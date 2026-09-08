[OPEN] Debug Session: `login-roles-error`

## Resumen
- Síntoma: al intentar ingresar aparece `Cannot read properties of undefined (reading 'roles')`.
- Esperado: el login debe completar la autenticación y redirigir al usuario al dashboard.

## Hipótesis Iniciales
1. La respuesta del backend no incluye `datos.usuario`, por lo que el frontend intenta leer `usuario.roles` de `undefined`.
2. El backend sí devuelve `datos`, pero `authApi.login()` o el `TransformInterceptor` cambian la forma del payload y el frontend lo interpreta mal.
3. El login del frontend recibe un objeto distinto en algunos casos y el destructuring en `login/page.tsx` queda inconsistente.
4. El backend devuelve `usuario`, pero sin `roles`, y el error se dispara al ejecutar `usuario.roles ?? []`.
5. El fallo no está en la API de login sino en el store/auth state posterior al login.

## Plan
1. Reproducir el error con evidencia de la respuesta real.
2. Instrumentar solo el frontend en el punto de recepción del login.
3. Comparar la respuesta observada con la forma esperada por `login/page.tsx`.
4. Aplicar la corrección mínima basada en evidencia.
5. Verificar el flujo completo.

## Evidencia
- La API `POST /api/v1/auth/login` responde con el sobre estándar `{ exito, mensaje, datos }`.
- En [page.tsx](file:///d:/2026/Sistemas/9.%20SGC_UNT_Claude/sigc-unt-completo/sigc-unt/frontend/src/app/login/page.tsx) el frontend desestructura `const { access_token, refresh_token, usuario } = respuesta;`.
- En [servicios.ts](file:///d:/2026/Sistemas/9.%20SGC_UNT_Claude/sigc-unt-completo/sigc-unt/frontend/src/lib/api/servicios.ts) `authApi.login()` devolvía `r.data`, no `extraerDatos(r)`.
- Con esa combinación, `usuario` queda `undefined` porque realmente vive en `respuesta.datos.usuario`.

## Fix
- Se mantuvo el backend intacto.
- Se corrigió `authApi.login()` para desempaquetar la respuesta con `extraerDatos`, alineando el contrato con lo que espera la página de login.
