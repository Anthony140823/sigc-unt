[OPEN] Debug Session: `capa-nueva-nc-button`

## Resumen
- Síntoma: en "Acciones Correctivas y Preventivas", al pulsar `Nueva NC`, no ocurre ninguna acción visible.
- Esperado: el botón debe abrir un formulario, modal o ruta válida para registrar una no conformidad.

## Hipótesis Iniciales
1. El botón tiene `onClick` sin implementación efectiva o con handler que retorna antes de ejecutar.
2. El botón depende de permisos/estado y queda visualmente habilitado, pero bloqueado por una condición no visible.
3. El flujo esperaba abrir una ruta o modal que no existe o no se monta por estado incorrecto.
4. El click sí ocurre, pero una excepción en frontend corta la ejecución antes de renderizar el formulario.
5. El problema está solo en el frontend; la API de CAPA podría estar sana.

## Plan
1. Ubicar el botón `Nueva NC` y el flujo asociado.
2. Instrumentar el click y los estados de apertura antes de cambiar lógica.
3. Reproducir el problema con evidencia runtime.
4. Aplicar la corrección mínima basada en evidencia.
5. Verificar el flujo y redeploy local.

## Evidencia
- El botón `Nueva NC` en [page.tsx](file:///d:/2026/Sistemas/9.%20SGC_UNT_Claude/sigc-unt-completo/sigc-unt/frontend/src/app/capa/page.tsx) sí estaba conectado a `setModalNC(true)`.
- El usuario reportó un error de runtime de Next/React:
  - `Hydration failed because the initial UI does not match what was rendered on the server`
  - `Expected server HTML to contain a matching <a> in <div>`
  - stack apuntando a [page.tsx](file:///d:/2026/Sistemas/9.%20SGC_UNT_Claude/sigc-unt-completo/sigc-unt/frontend/src/app/auditorias/page.tsx)
- Esto confirmó que el flujo no estaba roto por el botón de CAPA en sí, sino por un desajuste SSR/cliente en controles condicionados por `useAuthStore().tieneRol(...)`.
- La causa raíz fue la rehidratación temprana del store persistido de auth desde `sessionStorage`, que hacía que el servidor renderizara sin ciertos botones y el cliente intentara hidratar con ellos ya presentes.

## Fix
- Se añadió `hasHydrated` al store en [auth.store.ts](file:///d:/2026/Sistemas/9.%20SGC_UNT_Claude/sigc-unt-completo/sigc-unt/frontend/src/lib/store/auth.store.ts).
- Se activó `skipHydration: true` para evitar la rehidratación automática durante el primer render.
- Se movió la rehidratación del store a [providers.tsx](file:///d:/2026/Sistemas/9.%20SGC_UNT_Claude/sigc-unt-completo/sigc-unt/frontend/src/components/providers.tsx), ejecutándola después del montaje del cliente.
- Se ajustó [layout.tsx](file:///d:/2026/Sistemas/9.%20SGC_UNT_Claude/sigc-unt-completo/sigc-unt/frontend/src/app/dashboard/layout.tsx) para esperar `hasHydrated` antes de redirigir o renderizar contenido protegido.

## Estado
- Diagnósticos limpios en los archivos modificados.
- La instrumentación de depuración en [page.tsx](file:///d:/2026/Sistemas/9.%20SGC_UNT_Claude/sigc-unt-completo/sigc-unt/frontend/src/app/capa/page.tsx) se mantiene hasta confirmación del usuario.
