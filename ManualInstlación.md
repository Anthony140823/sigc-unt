# SIGC-UNT — Sistema Integrado de Gestión de la Calidad

> **Universidad Nacional de Trujillo, Perú**  
> Oficina Central de Calidad Universitaria

---

## Descripción

Plataforma web institucional para la planificación, ejecución, monitoreo, medición y mejora continua de la calidad académica y administrativa de la UNT, con soporte completo para procesos de acreditación (SINEACE, ISO 21001, ABET).

---

## Manual de instalación (Windows)

### Opción A: Docker (recomendado)

#### Prerrequisitos

- Docker Desktop ≥ 24
- Git

#### Pasos

1. Clonar el repositorio:

```bash
git clone https://github.com/unitru/sigc-unt.git
cd sigc-unt
```

2. Configurar variables de entorno del backend:

```bash
copy backend\.env.example backend\.env
```

3. Levantar los servicios con Docker Compose:

```bash
docker compose -f 03_docker-compose.yml up -d
docker compose -f 03_docker-compose.yml ps
```

4. Inicializar base de datos (elige una):

- Con Prisma:

```bash
docker compose -f 03_docker-compose.yml exec backend npx prisma db push
docker compose -f 03_docker-compose.yml exec backend npx ts-node prisma/seed.ts
```

- Con SQL (si el contenedor incluye `psql`):

```bash
docker compose -f 03_docker-compose.yml exec backend psql -U sigc_user -d sigc_unt_db -f /app/01_sigc_unt_schema.sql
docker compose -f 03_docker-compose.yml exec backend npx ts-node prisma/seed.ts
```

5. Acceder al sistema:

- Frontend: `http://localhost:3100/login`
- API: `http://localhost:4000/api/v1`
- Health: `http://localhost:4000/api/health`
- Swagger: `http://localhost:4000/api/docs`
- MinIO (si aplica): `http://localhost:9001`

### Opción B: Desarrollo local (sin Docker)

#### Prerrequisitos

- Node.js 20 LTS (recomendado)
- PostgreSQL 16+
- Redis 7+
- Git

#### Backend

```bash
cd backend
npm install
copy .env.example .env
npm run db:generate
npx prisma db push
npm run db:seed
npm run start:dev
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

Acceder al frontend en: `http://localhost:3100/login`

### Troubleshooting rápido

- `ERR_CONNECTION_REFUSED`: el servicio no está levantado o el puerto es distinto. Verifica que el backend esté en `:4000` y el frontend en `:3100`.
- Next.js en Windows: si `npm run dev` se queda “Starting…” o no responde, usa Node 20 LTS.

## Manual de usuario

### Acceso al sistema

1. Ingrese a: `http://localhost:3100/login`
2. Escriba su usuario y contraseña.
3. Presione **Ingresar al sistema**.

Si el inicio de sesión es correcto, el sistema redirige al **Dashboard**.

### Estructura de la pantalla

- Menú lateral (Sidebar): acceso a módulos (Dashboard, Documentos, Procesos, Indicadores, Auditorías, CAPA, Riesgos, Encuestas, Acreditación, Usuarios).
- Barra superior (Topbar): título del módulo, buscador (si aplica), notificaciones, usuario y botón **Cerrar sesión**.
- Área central: listado, formularios y reportes del módulo seleccionado.

### Roles y permisos

El sistema habilita/oculta opciones según el rol asignado. Roles típicos:

| Rol | Uso principal |
|---|---|
| `SUPERADMIN` | Administración completa del sistema |
| `ADMIN_CALIDAD` | Gestión integral del SGC |
| `DIRECTOR_CALIDAD` | Supervisión, aprobaciones y reportes |
| `AUDITOR_LIDER` / `AUDITOR` | Gestión y ejecución de auditorías |
| `JEFE_AREA` | Gestión del área (acciones, documentos, NC, etc.) |
| `RESPONSABLE_PROCESO` | Gestión de procesos e indicadores del proceso |
| `DIGITADOR` | Registro de información operativa |
| `CONSULTA` | Acceso de solo lectura (según configuración) |

### Notificaciones

- El ícono de campana muestra el número de notificaciones sin leer.
- Al abrir el panel, puede marcar todas como leídas.
- Al seleccionar una notificación, el sistema puede redirigir al elemento relacionado.

### Módulos: uso básico

#### 1) Dashboard

- Visualiza indicadores y alertas principales del SGC.
- Útil para revisar estado general, pendientes y tendencias.

#### 2) Gestión Documental (`/documentos`)

Funciones típicas:

- Buscar y filtrar documentos.
- Registrar nuevos documentos (si su rol lo permite).
- Gestionar versiones y estado (borrador, vigente, obsoleto) según el flujo configurado.

Buenas prácticas:

- Mantener títulos claros y versión actualizada.
- Verificar el área/proceso asociado antes de publicar.

#### 3) Mapa de Procesos (`/procesos`)

- Explora la estructura de macroprocesos, procesos y subprocesos.
- Revise responsables y relaciones si están configurados.

#### 4) Indicadores (`/indicadores`)

- Visualiza indicadores, metas y cumplimiento.
- Registra mediciones (si corresponde a su rol).

Recomendación:

- Registrar mediciones con evidencia y fecha correcta para un historial confiable.

#### 5) Auditorías (`/auditorias`)

- Consulta auditorías planificadas y en ejecución.
- Registra hallazgos y seguimiento (según rol).

#### 6) CAPA — Acciones Correctivas y Preventivas (`/capa`)

Conceptos:

- NC (No Conformidad): registro del incumplimiento o desviación.
- Acción correctiva: elimina la causa de una NC.
- Acción preventiva: reduce la probabilidad de ocurrencia de una NC.

Operación típica:

1. Entrar a **CAPA**.
2. Revisar el listado de NC, filtros por origen/estado y búsqueda.
3. Presionar **Nueva NC** (si su rol lo permite).
4. Completar: origen, área, descripción y (opcional) requisito/fecha.
5. Guardar y dar seguimiento hasta el cierre/efectividad.

#### 7) Riesgos (`/riesgos`)

- Consulta y registra riesgos, probabilidad/impacto y planes de mitigación (según rol).
- Mantenga la evaluación actualizada cuando cambian las condiciones.

#### 8) Encuestas (`/encuestas`)

- Visualiza encuestas disponibles.
- Crea encuestas y secciones/preguntas (si su rol lo permite).
- Responde encuestas asignadas según disponibilidad.

#### 9) Acreditación (`/acreditacion`)

- Consulta planes, matrices y avances de autoevaluación/acreditación.
- Registra evidencias (según rol).

#### 10) Usuarios (`/usuarios`)

- Administración de usuarios y roles (solo roles autorizados).
- Activar/desactivar usuarios según políticas internas.

### Cierre de sesión

- En la barra superior, presione **Cerrar sesión** para salir del sistema.

### Problemas comunes

- Pantalla en blanco o error: recargue la página y verifique conexión a la API.
- No aparece un módulo: su rol puede no tener permisos.
- `ERR_CONNECTION_REFUSED`: el frontend/backend no está levantado o el puerto no coincide (frontend `3100`, backend `4000`).

## Estructura del Repositorio

```
sigc-unt/
├── backend/                    # API NestJS (Node 20 + TypeScript)
│   ├── src/
│   │   ├── modules/            # 12 módulos funcionales
│   │   │   ├── auth/           # JWT + bcrypt + refresh tokens
│   │   │   ├── usuarios/       # CRUD + RBAC
│   │   │   ├── areas/          # Estructura organizacional
│   │   │   ├── documentos/     # Ciclo de vida documental + MinIO
│   │   │   ├── procesos/       # Mapa BPMN + matriz RACI
│   │   │   ├── indicadores/    # KPIs + semáforo automático
│   │   │   ├── acreditacion/   # SINEACE/ISO + autoevaluaciones
│   │   │   ├── auditorias/     # Planes + checklists + hallazgos
│   │   │   ├── capa/           # NC + análisis causa raíz + acciones
│   │   │   ├── riesgos/        # Matriz P×I + mitigaciones
│   │   │   ├── encuestas/      # Constructor + participación
│   │   │   ├── dashboard/      # KPIs ejecutivo/táctico/operativo
│   │   │   └── health/         # Endpoint de salud del sistema
│   │   ├── common/             # Guards, decoradores, utils, listeners
│   │   ├── database/           # PrismaService con soft-delete
│   │   └── config/             # Configuraciones tipadas
│   ├── prisma/
│   │   ├── schema.prisma       # 45+ modelos mapeados a sigc_unt
│   │   └── seed.ts             # Datos iniciales completos
│   ├── test/                   # Tests unitarios
│   └── Dockerfile
├── frontend/                   # Next.js (App Router + TypeScript)
│   ├── src/
│   │   ├── app/                # 10 páginas + layouts
│   │   │   ├── login/          # Autenticación con validación Zod
│   │   │   ├── dashboard/      # KPIs ejecutivos y operativos
│   │   │   ├── documentos/     # Gestión documental paginada
│   │   │   ├── procesos/       # Mapa jerárquico expandible
│   │   │   ├── indicadores/    # KPIs + gráfico de tendencia
│   │   │   ├── auditorias/     # Planes, ejecución, hallazgos
│   │   │   ├── capa/           # NC + alertas de vencimiento
│   │   │   ├── riesgos/        # Matriz + mapa de calor P×I
│   │   │   ├── encuestas/      # Satisfacción de partes interesadas
│   │   │   ├── acreditacion/   # Cronograma + matriz cumplimiento
│   │   │   └── usuarios/       # CRUD + toggle activo
│   │   ├── components/
│   │   │   ├── layout/         # Sidebar + Topbar con notificaciones
│   │   │   └── providers.tsx   # React Query global
│   │   └── lib/
│   │       ├── api/            # Cliente Axios + servicios por módulo
│   │       ├── hooks/          # React Query hooks (TanStack Query v5)
│   │       ├── store/          # Zustand: auth + notificaciones
│   │       ├── types/          # Interfaces TypeScript completas
│   │       └── utils/          # cn, fechas, formatos
│   └── Dockerfile
├── nginx/
│   └── nginx.conf              # Proxy inverso + SSL + rate limiting
├── .github/
│   └── workflows/
│       └── ci-cd.yml           # Pipeline GitHub Actions
└── 03_docker-compose.yml       # Orquestación completa
```

---

## Inicio Rápido

### Prerrequisitos

- Docker ≥ 24 + Docker Compose ≥ 2.20
- Node.js 20 LTS (solo para desarrollo local)
- Git

### 1. Clonar y configurar

```bash
git clone https://github.com/unitru/sigc-unt.git
cd sigc-unt

# Crear archivos de entorno
cp backend/.env.example backend/.env
# Editar backend/.env con tus valores reales
```

### 2. Variables de entorno mínimas en `backend/.env`

```env
DATABASE_URL=postgresql://sigc_user:password@postgres:5432/sigc_unt_db
JWT_SECRET=cambia_este_secreto_minimo_32_caracteres_aqui
JWT_REFRESH_SECRET=cambia_este_refresh_secreto_diferente
MINIO_ACCESS_KEY=sigcadmin
MINIO_SECRET_KEY=password_minio_seguro
SMTP_HOST=mail.unitru.edu.pe
SMTP_USER=calidad@unitru.edu.pe
SMTP_PASS=password_email
```

### 3. Levantar con Docker Compose

```bash
# Iniciar todos los servicios
docker compose -f 03_docker-compose.yml up -d

# Ver logs
docker compose -f 03_docker-compose.yml logs -f backend

# Aplicar schema de base de datos
docker compose -f 03_docker-compose.yml exec backend psql -U sigc_user -d sigc_unt_db -f /app/01_sigc_unt_schema.sql

# O usando Prisma
docker compose -f 03_docker-compose.yml exec backend npx prisma db push

# Cargar datos semilla
docker compose -f 03_docker-compose.yml exec backend npx ts-node prisma/seed.ts
```

### 4. Verificar estado

```bash
# Backend API
curl http://localhost:4000/api/health

# Frontend
open http://localhost:3100
```

### 5. Login inicial

| Campo | Valor |
|---|---|
| Usuario | `superadmin` |
| Contraseña | `Admin@UNT2025!` |

> ⚠️ **Cambiar la contraseña inmediatamente** en primer acceso.

---

## Desarrollo Local (sin Docker)

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Editar .env
npx prisma generate
npx prisma db push
npx ts-node prisma/seed.ts
npm run start:dev
# API: http://localhost:4000/api/v1
# Swagger: http://localhost:4000/api/docs
```

### Frontend

```bash
cd frontend
npm install
# Crear .env.local con:
# NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
npm run dev
# App: http://localhost:3100
```

---

## URLs del Sistema

| Servicio | URL | Descripción |
|---|---|---|
| Frontend | `http://localhost:3100` | Interfaz web SIGC-UNT |
| API REST | `http://localhost:4000/api/v1` | Backend NestJS |
| Swagger  | `http://localhost:4000/api/docs` | Documentación API |
| MinIO    | `http://localhost:9001` | Consola de almacenamiento |
| Health   | `http://localhost:4000/api/health` | Estado del sistema |

---

## Módulos del Sistema

| Módulo | Ruta | Descripción |
|---|---|---|
| Dashboard | `/dashboard` | KPIs ejecutivos, tácticos y operativos |
| Documentos | `/documentos` | Ciclo de vida documental SGC |
| Procesos | `/procesos` | Mapa BPMN con jerarquía |
| Indicadores | `/indicadores` | KPIs + semáforo automático |
| Acreditación | `/acreditacion` | SINEACE/ISO + autoevaluación |
| Auditorías | `/auditorias` | Planes + checklists + hallazgos |
| CAPA | `/capa` | NC + causa raíz + acciones correctivas |
| Riesgos | `/riesgos` | Matriz P×I + mapa de calor |
| Encuestas | `/encuestas` | Satisfacción de partes interesadas |
| Usuarios | `/usuarios` | Gestión de usuarios y roles RBAC |

---

## Stack Tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Backend | NestJS + Node.js | 10.x / 20.x |
| Frontend | Next.js + React | 15.x / 18.x |
| Base de datos | PostgreSQL | 16+ |
| ORM | Prisma | 5.x |
| Caché | Redis | 7.x |
| Almacenamiento | MinIO (S3) | Latest |
| Autenticación | JWT + bcrypt | — |
| Validación | Zod + class-validator | — |
| Estado | Zustand + TanStack Query | 4.x / 5.x |
| Estilos | Tailwind CSS | 3.x |
| Contenedores | Docker + Compose | 24.x |
| CI/CD | GitHub Actions | — |

---

## Normas y Estándares Soportados

- **ISO 21001:2018** — Sistemas de Gestión para Organizaciones Educativas
- **ISO 9001:2015** — Sistemas de Gestión de la Calidad
- **SINEACE 2022** — Modelo de Acreditación Superior Perú
- **ABET EAC 2023** — Acreditación de Ingeniería
- **BPMN 2.0** — Modelado de procesos de negocio

---

## Roles del Sistema

| Rol | Descripción |
|---|---|
| `SUPERADMIN` | Acceso total — solo TI institucional |
| `ADMIN_CALIDAD` | Gestión completa del SGC |
| `DIRECTOR_CALIDAD` | Aprobaciones y reportes estratégicos |
| `AUDITOR_LIDER` | Planificación y ejecución de auditorías |
| `AUDITOR` | Ejecución de auditorías |
| `JEFE_AREA` | Gestión de su área organizacional |
| `RESPONSABLE_PROCESO` | Gestión de su proceso asignado |
| `DIGITADOR` | Ingreso de mediciones y formularios |
| `CONSULTA` | Solo lectura en módulos autorizados |

---

## Contribución

1. Crear branch: `git checkout -b feature/nombre-funcionalidad`
2. Hacer commits descriptivos en español
3. Abrir Pull Request hacia `develop`
4. El pipeline CI debe pasar (lint + tests)

---

## Licencia

Sistema de uso institucional exclusivo de la Universidad Nacional de Trujillo.  
© 2025 Oficina Central de Calidad Universitaria — UNT

---

*SIGC-UNT v1.0.0 · Desarrollado para la acreditación y mejora continua de la calidad universitaria*
