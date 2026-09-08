# SIGC-UNT Backend — NestJS

> Sistema Integrado de Gestión de la Calidad · Universidad Nacional de Trujillo, Perú

---

## Estructura del Proyecto

```
backend/
├── prisma/
│   └── schema.prisma              # Esquema ORM (mapea a sigc_unt en PostgreSQL)
├── src/
│   ├── main.ts                    # Bootstrap de la aplicación
│   ├── app.module.ts              # Módulo raíz
│   ├── config/                    # Configuraciones tipadas
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   ├── minio.config.ts
│   │   └── redis.config.ts
│   ├── database/
│   │   ├── database.module.ts     # Módulo global Prisma
│   │   └── prisma.service.ts      # PrismaService con soft-delete middleware
│   ├── common/
│   │   ├── common.module.ts       # Módulo global de utilidades
│   │   ├── decorators/
│   │   │   ├── roles.decorator.ts # @Roles(), @Publico(), enum RolSistema
│   │   │   └── usuario-actual.decorator.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts  # Respuestas de error estándar en español
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts  # Verifica JWT en cada request
│   │   │   └── roles.guard.ts     # RBAC basado en @Roles()
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   └── transform.interceptor.ts  # Envuelve respuestas en {exito, datos, ...}
│   │   ├── interfaces/
│   │   │   └── jwt-payload.interface.ts
│   │   ├── listeners/
│   │   │   └── notificaciones.listener.ts  # Escucha eventos → crea notificaciones
│   │   ├── pipes/
│   │   │   └── parse-uuid.pipe.ts
│   │   ├── services/
│   │   │   ├── auditoria-sistema.service.ts
│   │   │   └── email.service.ts
│   │   └── utils/
│   │       └── paginacion.util.ts  # paginación, semáforo, códigos, fechas
│   └── modules/
│       ├── auth/                  # JWT, Local Strategy, login/logout/refresh
│       ├── usuarios/              # CRUD + roles RBAC
│       ├── areas/                 # Estructura organizacional jerárquica
│       ├── procesos/              # Mapa de procesos BPMN + matriz RACI
│       ├── documentos/            # Ciclo de vida documental + MinIO
│       ├── indicadores/           # KPIs + mediciones + semáforo automático
│       ├── acreditacion/          # SINEACE / ISO + autoevaluaciones + evidencias
│       ├── auditorias/            # Planes + auditorías + checklists + hallazgos
│       ├── capa/                  # NC + análisis causa raíz + acciones CAPA
│       ├── riesgos/               # Matriz P×I + mitigaciones + seguimientos
│       ├── encuestas/             # Constructor + participación + resultados
│       └── dashboard/             # Dashboards ejecutivo/táctico/operativo + notificaciones
├── test/
│   ├── auth.service.spec.ts
│   └── documentos.service.spec.ts
├── .env.example
├── jest.config.ts
├── package.json
└── tsconfig.json
```

---

## Requisitos Previos

| Herramienta | Versión mínima |
|---|---|
| Node.js | 20.x LTS |
| PostgreSQL | 16+ |
| Redis | 7+ |
| MinIO | RELEASE.2024-01-01+ |
| Docker | 24+ (opcional) |

---

## Configuración inicial

### 1. Instalar dependencias

```bash
cd backend
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con los valores reales
```

### 3. Aplicar el schema SQL base

```bash
# Asegurarse de que la DB exista
psql -U postgres -c "CREATE DATABASE sigc_unt_db ENCODING 'UTF8';"

# Ejecutar el script completo de creación de tablas
psql -U postgres -d sigc_unt_db -f ../db/01_sigc_unt_schema.sql
```

### 4. Generar el cliente Prisma

```bash
npm run db:generate
```

### 5. Iniciar en desarrollo

```bash
npm run start:dev
```

La API estará disponible en: `http://localhost:4000/api/v1`  
Swagger UI: `http://localhost:4000/api/docs`

---

## Inicio con Docker Compose (recomendado)

```bash
# Desde la raíz del proyecto
docker compose up -d

# Ver logs del backend
docker compose logs -f backend

# Aplicar migraciones
docker compose exec backend npm run db:migrate
```

---

## Endpoints Principales

### Autenticación

```
POST /api/v1/auth/login              → Login (retorna access_token + refresh_token)
POST /api/v1/auth/refresh            → Renovar access_token
POST /api/v1/auth/logout             → Cerrar sesión (revoca refresh tokens)
GET  /api/v1/auth/perfil             → Perfil del usuario autenticado
POST /api/v1/auth/cambiar-password   → Cambiar contraseña
```

### Módulos Funcionales

| Módulo | Prefijo | Descripción |
|---|---|---|
| Usuarios | `/api/v1/usuarios` | CRUD + asignación de roles |
| Áreas | `/api/v1/areas` | Estructura organizacional |
| Procesos | `/api/v1/procesos` | Mapa de procesos + RACI |
| Documentos | `/api/v1/documentos` | Ciclo de vida documental |
| Indicadores | `/api/v1/indicadores` | KPIs + mediciones |
| Acreditación | `/api/v1/acreditacion` | Autoevaluación SINEACE/ISO |
| Auditorías | `/api/v1/auditorias` | Planes + ejecución + hallazgos |
| CAPA | `/api/v1/capa` | NC + acciones correctivas |
| Riesgos | `/api/v1/riesgos` | Matriz de riesgos P×I |
| Encuestas | `/api/v1/encuestas` | Satisfacción de partes interesadas |
| Dashboard | `/api/v1/dashboard` | KPIs ejecutivo/táctico/operativo |

---

## Roles del Sistema (RBAC)

| Código | Descripción | Acceso |
|---|---|---|
| `SUPERADMIN` | Administrador TI | Total |
| `ADMIN_CALIDAD` | Administrador SGC | Gestión completa del sistema |
| `DIRECTOR_CALIDAD` | Director de Calidad | Aprobaciones, reportes estratégicos |
| `AUDITOR_LIDER` | Auditor Líder | Auditorías, hallazgos, CAPA |
| `AUDITOR` | Auditor | Ejecución de auditorías |
| `JEFE_AREA` | Jefe de Área | Gestión de su área |
| `RESPONSABLE_PROCESO` | Responsable | Gestión de su proceso |
| `DIGITADOR` | Digitador | Ingreso de datos |
| `CONSULTA` | Solo lectura | Consulta de información |

---

## Eventos del Sistema (EventEmitter)

El sistema usa un bus de eventos interno para desacoplar módulos:

| Evento | Disparador | Acción |
|---|---|---|
| `auth.login` | Login exitoso | Log de sesión |
| `auth.password-changed` | Cambio de contraseña | Notificación al usuario |
| `documento.estado-cambiado` | Cambio de estado en GD | Notificación al creador |
| `capa.nc-creada` | Nueva NC | Notificación al jefe de área |
| `capa.accion-asignada` | Asignación de acción | Notificación al responsable |
| `capa.alerta-vencimiento` | Cron diario 7 AM | Alerta por email + notificación |
| `indicador.alerta-roja` | Medición con semáforo rojo | Notificación al responsable |
| `riesgo.nivel-critico` | Riesgo crítico/alto | Notificación a Director de Calidad |
| `auditoria.hallazgo-creado` | NC Mayor/Menor en auditoría | Notificación al jefe del área |

---

## Tareas Programadas (Cron)

| Tarea | Horario | Descripción |
|---|---|---|
| `verificarVencimientosDiario` | Cada día 7:00 AM (Lima) | Revisa acciones CAPA próximas o vencidas |

---

## Ejecutar Tests

```bash
# Tests unitarios
npm test

# Con cobertura
npm run test:cov

# Tests e2e
npm run test:e2e
```

---

## Convenciones de Código

- **Idioma**: Todo en español (variables, métodos, comentarios, mensajes de error)
- **Respuesta estándar**: `{ exito: boolean, mensaje: string, datos: T, timestamp: string }`
- **Paginación**: `?page=1&limit=20&sortBy=creado_en&order=DESC`
- **UUID**: Todas las PKs de tablas maestras usan UUID v4
- **Soft delete**: `eliminado_en` + `eliminado_por` en tablas críticas
- **Auditoría**: Todos los cambios críticos quedan en `log_auditoria_sistema`

---

## Notas de Seguridad

- Los tokens JWT access expiran en **15 minutos**; los refresh en **7 días**
- Los refresh tokens se rotan en cada uso (se invalida el anterior)
- Las contraseñas se hashean con **bcrypt rounds=12**
- Después de **5 intentos fallidos**, la cuenta se bloquea **30 minutos**
- Todos los inputs pasan por el `ValidationPipe` con `whitelist: true`
- Rate limiting activo: **100 requests / 60 segundos** por IP

---

*SIGC-UNT v1.0.0 · Universidad Nacional de Trujillo · Oficina de Calidad Universitaria*
