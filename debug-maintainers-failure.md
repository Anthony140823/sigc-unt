[OPEN] Debug Session: `maintainers-failure`

## Resumen
- Síntoma: después de ingresar correctamente, los mantenedores no funcionan.
- Esperado: las pantallas de mantenedores deben cargar datos y permitir operar sin errores.

## Hipótesis Iniciales
1. Las páginas de mantenedores llaman endpoints backend que responden `401` o `403` por un problema de tokens/sesión.
2. Las páginas cargan bien, pero el frontend interpreta mal la forma de respuesta paginada (`datos` vs `datos.datos`).
3. Algún servicio de mantenedores usa rutas distintas a las realmente expuestas por la API.
4. El backend responde con error por datos sembrados incompletos o faltantes en tablas maestras.
5. El fallo ocurre en una sola pantalla de mantenedor, pero el usuario lo percibe como general porque el layout reutiliza hooks/estado compartido.

## Plan
1. Reproducir en una pantalla concreta de mantenedor.
2. Instrumentar solo el punto de carga de datos en frontend.
3. Contrastar con la respuesta real del backend.
4. Aplicar la corrección mínima basada en evidencia.
5. Verificar el flujo.

## Evidencia
- Reproducción confirmada en `GET /api/v1/usuarios`: inicialmente devolvía `500`.
- Log runtime confirmado en backend: `TypeError: Do not know how to serialize a BigInt`.
- La falla ocurría después del `findMany`, al serializar la respuesta JSON de Nest/Express.
- La causa no era autenticación ni forma de respuesta del frontend; era serialización de entidades Prisma con campos `BigInt`.

## Fix
- Se agregó serialización recursiva de `BigInt` en [transform.interceptor.ts](file:///d:/2026/Sistemas/9.%20SGC_UNT_Claude/sigc-unt-completo/sigc-unt/backend/src/common/interceptors/transform.interceptor.ts).
- El fix convierte `bigint` a `number` si está dentro de `Number.MAX_SAFE_INTEGER`; si no, a `string`.
- Verificación post-fix:
  - `GET /api/v1/usuarios` => `200 OK`
  - `GET /api/v1/areas` => `200 OK`
