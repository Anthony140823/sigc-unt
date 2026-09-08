[OPEN] Debug Session: `maintainers-new-routes`

## Resumen
- Síntoma: al seleccionar "nuevo proceso" y acciones equivalentes en otros mantenedores aparece `404 This page could not be found`.
- Esperado: los botones de creación deben abrir formularios válidos y no rutas inexistentes.

## Hipótesis Iniciales
1. Los botones de "nuevo" apuntan a rutas como `/modulo/nuevo`, pero esas páginas no existen en `app/`.
2. Las páginas sí existen, pero están nombradas distinto (`crear`, `new`, modal embebido) y los `href` quedaron desalineados.
3. Algunos mantenedores usan modales para crear y otros usan páginas dedicadas; el layout o menú unificó mal esos patrones.
4. El problema no es de Next Router, sino de `basePath` o `href` relativos mal construidos.
5. El fallo es transversal porque varios mantenedores copiaron el mismo patrón de enlace roto.

## Plan
1. Inventariar rutas reales en `frontend/src/app`.
2. Localizar enlaces y botones de "nuevo" en mantenedores.
3. Contrastar enlaces vs. páginas existentes.
4. Aplicar la corrección mínima basada en evidencia.
5. Verificar navegación y despliegue local.

## Evidencia
- Los listados enlazaban a `/procesos/nuevo`, `/riesgos/nuevo`, `/indicadores/nuevo`, `/documentos/nuevo` y `/acreditacion/nuevo`.
- En `frontend/src/app` no existian esas rutas; solo estaban los `page.tsx` de listado.
- Verificacion runtime pre-fix:
  - `/procesos/nuevo` => `404`
  - `/riesgos/nuevo` => `404`
  - `/indicadores/nuevo` => `404`
- Verificacion runtime post-fix:
  - `/procesos/nuevo` => `200`
  - `/riesgos/nuevo` => `200`
  - `/documentos/nuevo` => `200`
  - `/indicadores/nuevo` => `200`
  - `/acreditacion/nuevo` => `200`

## Fix
- Se crearon las paginas faltantes:
  - [page.tsx](file:///d:/2026/Sistemas/9.%20SGC_UNT_Claude/sigc-unt-completo/sigc-unt/frontend/src/app/procesos/nuevo/page.tsx)
  - [page.tsx](file:///d:/2026/Sistemas/9.%20SGC_UNT_Claude/sigc-unt-completo/sigc-unt/frontend/src/app/riesgos/nuevo/page.tsx)
  - [page.tsx](file:///d:/2026/Sistemas/9.%20SGC_UNT_Claude/sigc-unt-completo/sigc-unt/frontend/src/app/documentos/nuevo/page.tsx)
  - [page.tsx](file:///d:/2026/Sistemas/9.%20SGC_UNT_Claude/sigc-unt-completo/sigc-unt/frontend/src/app/indicadores/nuevo/page.tsx)
  - [page.tsx](file:///d:/2026/Sistemas/9.%20SGC_UNT_Claude/sigc-unt-completo/sigc-unt/frontend/src/app/acreditacion/nuevo/page.tsx)
- Se agrego el modulo [CatalogosModule](file:///d:/2026/Sistemas/9.%20SGC_UNT_Claude/sigc-unt-completo/sigc-unt/backend/src/modules/catalogos/catalogos.module.ts) y endpoints para poblar formularios:
  - `/api/v1/catalogos/tipos-documento`
  - `/api/v1/catalogos/frecuencias-medicion`
  - `/api/v1/catalogos/estandares-acreditacion`
  - `/api/v1/catalogos/programas-academicos`

## Residual
- `programas-academicos` responde `200`, pero actualmente retorna una lista vacia, por lo que el formulario de `acreditacion/nuevo` queda visible pero deshabilitado hasta sembrar programas academicos activos.
