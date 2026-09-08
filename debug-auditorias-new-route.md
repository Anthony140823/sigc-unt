[OPEN] Debug Session: `auditorias-new-route`

## Resumen
- Síntoma: al seleccionar "nueva auditoría" aparece `404 This page could not be found`.
- Esperado: el botón de creación debe abrir una pantalla o flujo válido para registrar una auditoría.

## Hipótesis Iniciales
1. El botón de "nueva auditoría" apunta a `/auditorias/nuevo`, pero esa ruta no existe en `frontend/src/app`.
2. La pantalla existe con otro nombre o patrón, y el enlace quedó desalineado después de cambios previos.
3. La creación de auditorías usa modal o subflujo embebido, pero el listado todavía usa `href` a una página inexistente.
4. El problema es transversal a rutas de detalle/alta del módulo de auditorías, no solo al botón "nuevo".
5. El `404` es de Next.js y no del backend; la API de auditorías podría estar sana.

## Plan
1. Verificar el enlace usado por el mantenedor de auditorías.
2. Contrastar ese enlace con las rutas reales en `frontend/src/app`.
3. Instrumentar el clic del enlace roto para cerrar la evidencia.
4. Aplicar la corrección mínima basada en evidencia.
5. Verificar navegación y despliegue local.

## Evidencia
- En [page.tsx](file:///d:/2026/Sistemas/9.%20SGC_UNT_Claude/sigc-unt-completo/sigc-unt/frontend/src/app/auditorias/page.tsx) el botón apuntaba a `/auditorias/nueva`.
- Bajo `frontend/src/app/auditorias` no existía ninguna carpeta `nueva/` ni `nuevo/`.
- Verificación runtime pre-fix: `GET /auditorias/nueva` => `404`.
- La API sí expone `POST /api/v1/auditorias`, por lo que el fallo era de navegación frontend, no de backend.

## Fix
- Se añadió instrumentación mínima sobre el clic del enlace roto en [page.tsx](file:///d:/2026/Sistemas/9.%20SGC_UNT_Claude/sigc-unt-completo/sigc-unt/frontend/src/app/auditorias/page.tsx).
- Se creó la página [page.tsx](file:///d:/2026/Sistemas/9.%20SGC_UNT_Claude/sigc-unt-completo/sigc-unt/frontend/src/app/auditorias/nueva/page.tsx).
- La nueva pantalla permite:
  - crear el plan anual si aún no existe
  - programar la auditoría dentro del plan
- Se añadió el endpoint de catálogo `/api/v1/catalogos/tipos-auditoria` para poblar el selector de tipos.

## Verificación
- `GET /auditorias/nueva` => `200`.
- `GET /api/v1/catalogos/tipos-auditoria` => `200` con datos válidos.
- Backend recompilado y redeploy local completado.
