-- =============================================================================
-- SISTEMA INTEGRADO DE GESTIÓN DE LA CALIDAD - SIGC-UNT
-- Universidad Nacional de Trujillo, Perú
-- PostgreSQL 16+
-- Versión: 1.0.0 | Fecha: 2025
-- Autores: Oficina de Calidad UNT
-- =============================================================================
-- Ejecutar con: psql -U postgres -d sigc_unt_db -f 01_sigc_unt_schema.sql
-- Prerequisito: CREATE DATABASE sigc_unt_db ENCODING 'UTF8' LC_COLLATE 'es_PE.UTF-8';
-- =============================================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- Búsqueda de texto fuzzy
CREATE EXTENSION IF NOT EXISTS "unaccent";   -- Búsqueda sin acentos
CREATE EXTENSION IF NOT EXISTS "btree_gin";  -- Índices GIN para tipos básicos

-- Crear esquema principal
CREATE SCHEMA IF NOT EXISTS sigc_unt;
SET search_path TO sigc_unt, public;

-- =============================================================================
-- SECCIÓN 1: FUNCIÓN UTILITARIA DE AUDITORÍA AUTOMÁTICA
-- =============================================================================

-- Función que actualiza automáticamente modificado_en al hacer UPDATE
CREATE OR REPLACE FUNCTION sigc_unt.fn_actualizar_modificado_en()
RETURNS TRIGGER AS $$
BEGIN
    NEW.modificado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- SECCIÓN 2: TABLAS DE CATÁLOGOS / LOOKUP
-- Contienen los valores controlados del sistema. Sin FKs salientes complejas.
-- =============================================================================

-- Roles del sistema (RBAC)
CREATE TABLE sigc_unt.roles (
    id              SMALLSERIAL PRIMARY KEY,
    codigo          VARCHAR(30)  NOT NULL,
    nombre          VARCHAR(80)  NOT NULL,
    descripcion     TEXT,
    nivel_jerarquia SMALLINT     NOT NULL DEFAULT 99, -- 1=más alto, 99=más bajo
    esta_activo     BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_roles_codigo UNIQUE (codigo)
);
COMMENT ON TABLE sigc_unt.roles IS 'Roles del sistema para control de acceso basado en roles (RBAC).';

-- Estados generales de flujos de trabajo (reutilizable en varios módulos)
CREATE TABLE sigc_unt.estados_flujo (
    id          SMALLSERIAL PRIMARY KEY,
    modulo      VARCHAR(10)  NOT NULL, -- GD, CAPA, AA, AI, GR, GS, etc.
    codigo      VARCHAR(30)  NOT NULL,
    nombre      VARCHAR(80)  NOT NULL,
    descripcion TEXT,
    color_hex   VARCHAR(7),            -- Representación visual (#RRGGBB)
    es_final    BOOLEAN      NOT NULL DEFAULT FALSE, -- Si el flujo termina aquí
    orden       SMALLINT     NOT NULL DEFAULT 0,
    esta_activo BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_estados_flujo_modulo_codigo UNIQUE (modulo, codigo)
);
COMMENT ON TABLE sigc_unt.estados_flujo IS 'Estados controlados por módulo para flujos de trabajo configurables.';

-- Tipos de documentos
CREATE TABLE sigc_unt.tipos_documento (
    id          SMALLSERIAL PRIMARY KEY,
    codigo      VARCHAR(10)  NOT NULL,
    nombre      VARCHAR(80)  NOT NULL,
    descripcion TEXT,
    prefijo     VARCHAR(5),   -- Prefijo para código de documento (POL, MAN, INS, FOR, REG, PLA)
    requiere_aprobacion BOOLEAN NOT NULL DEFAULT TRUE,
    esta_activo BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_tipos_documento_codigo UNIQUE (codigo)
);
COMMENT ON TABLE sigc_unt.tipos_documento IS 'Catálogo de tipos de documentos del SGC: políticas, manuales, instructivos, formatos, registros, planes.';

-- Tipos de hallazgo en auditoría
CREATE TABLE sigc_unt.tipos_hallazgo (
    id          SMALLSERIAL PRIMARY KEY,
    codigo      VARCHAR(20)  NOT NULL,
    nombre      VARCHAR(80)  NOT NULL,
    descripcion TEXT,
    severidad   SMALLINT     NOT NULL, -- 1=OportunidadMejora, 2=ObservNomenor, 3=NCMenor, 4=NCMayor
    esta_activo BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_tipos_hallazgo_codigo UNIQUE (codigo),
    CONSTRAINT chk_tipos_hallazgo_severidad CHECK (severidad BETWEEN 1 AND 4)
);
COMMENT ON TABLE sigc_unt.tipos_hallazgo IS 'Tipos de hallazgo en auditoría con nivel de severidad.';

-- Niveles de riesgo
CREATE TABLE sigc_unt.niveles_riesgo (
    id              SMALLSERIAL PRIMARY KEY,
    codigo          VARCHAR(10)  NOT NULL,
    nombre          VARCHAR(40)  NOT NULL,
    rango_min       DECIMAL(5,2) NOT NULL, -- Puntuación mínima (prob x impacto)
    rango_max       DECIMAL(5,2) NOT NULL, -- Puntuación máxima
    color_hex       VARCHAR(7),
    accion_requerida TEXT,
    esta_activo     BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_niveles_riesgo_codigo UNIQUE (codigo),
    CONSTRAINT chk_niveles_riesgo_rango CHECK (rango_min <= rango_max)
);
COMMENT ON TABLE sigc_unt.niveles_riesgo IS 'Escala de niveles de riesgo con rangos de puntuación P×I.';

-- Tipos de auditoría
CREATE TABLE sigc_unt.tipos_auditoria (
    id          SMALLSERIAL PRIMARY KEY,
    codigo      VARCHAR(20)  NOT NULL,
    nombre      VARCHAR(80)  NOT NULL,
    descripcion TEXT,
    esta_activo BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_tipos_auditoria_codigo UNIQUE (codigo)
);
COMMENT ON TABLE sigc_unt.tipos_auditoria IS 'Tipos de auditoría: interna, externa, seguimiento, certificación.';

-- Tipos de pregunta para encuestas
CREATE TABLE sigc_unt.tipos_pregunta (
    id              SMALLSERIAL PRIMARY KEY,
    codigo          VARCHAR(20)  NOT NULL,
    nombre          VARCHAR(60)  NOT NULL,
    descripcion     TEXT,
    tiene_opciones  BOOLEAN      NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_tipos_pregunta_codigo UNIQUE (codigo)
);
COMMENT ON TABLE sigc_unt.tipos_pregunta IS 'Tipos de pregunta para el constructor de encuestas.';

-- Métodos de análisis de causa raíz (CAPA)
CREATE TABLE sigc_unt.metodos_causa_raiz (
    id          SMALLSERIAL PRIMARY KEY,
    codigo      VARCHAR(20)  NOT NULL,
    nombre      VARCHAR(80)  NOT NULL,
    descripcion TEXT,
    esta_activo BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_metodos_causa_raiz_codigo UNIQUE (codigo)
);
COMMENT ON TABLE sigc_unt.metodos_causa_raiz IS 'Métodos de análisis de causa raíz: 5 Porqués, Ishikawa, etc.';

-- Estándares de acreditación
CREATE TABLE sigc_unt.estandares_acreditacion (
    id          SMALLSERIAL PRIMARY KEY,
    codigo      VARCHAR(20)  NOT NULL,
    nombre      VARCHAR(120) NOT NULL,
    organismo   VARCHAR(80)  NOT NULL, -- SINEACE, ISO, ABET, CNA, etc.
    version     VARCHAR(20),
    descripcion TEXT,
    url_referencia VARCHAR(500),
    esta_activo BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_estandares_acreditacion_codigo UNIQUE (codigo)
);
COMMENT ON TABLE sigc_unt.estandares_acreditacion IS 'Catálogo de estándares de acreditación gestionados en el sistema.';

-- Frecuencias de medición de indicadores
CREATE TABLE sigc_unt.frecuencias_medicion (
    id              SMALLSERIAL PRIMARY KEY,
    codigo          VARCHAR(20)  NOT NULL,
    nombre          VARCHAR(40)  NOT NULL,
    dias_periodo    SMALLINT,    -- Días aproximados del período
    CONSTRAINT uq_frecuencias_medicion_codigo UNIQUE (codigo)
);
COMMENT ON TABLE sigc_unt.frecuencias_medicion IS 'Frecuencias de medición para indicadores: diaria, semanal, mensual, etc.';

-- =============================================================================
-- SECCIÓN 3: TABLAS MAESTRAS
-- Entidades principales del negocio.
-- =============================================================================

-- Facultades y unidades académicas
CREATE TABLE sigc_unt.facultades (
    id              UUID         NOT NULL DEFAULT uuid_generate_v4(),
    codigo          VARCHAR(10)  NOT NULL,
    nombre          VARCHAR(150) NOT NULL,
    nombre_corto    VARCHAR(40),
    decano_nombre   VARCHAR(200),
    email           VARCHAR(100),
    telefono        VARCHAR(20),
    esta_activo     BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    modificado_en   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_facultades PRIMARY KEY (id),
    CONSTRAINT uq_facultades_codigo UNIQUE (codigo)
);
COMMENT ON TABLE sigc_unt.facultades IS 'Facultades y escuelas de postgrado de la UNT.';

-- Áreas organizacionales (unidades, oficinas, direcciones, departamentos)
CREATE TABLE sigc_unt.areas (
    id              UUID         NOT NULL DEFAULT uuid_generate_v4(),
    codigo          VARCHAR(20)  NOT NULL,
    nombre          VARCHAR(200) NOT NULL,
    nombre_corto    VARCHAR(50),
    facultad_id     UUID,        -- NULL para áreas centrales (Rectorado, VRAs)
    area_padre_id   UUID,        -- Jerarquía organizacional
    tipo_area       VARCHAR(30)  NOT NULL DEFAULT 'OFICINA', -- RECTORADO, VICERRECTORADO, DECANATO, DIRECCION, OFICINA, DPTO_ACADEMICO
    responsable_nombre VARCHAR(200),
    email           VARCHAR(100),
    esta_activo     BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    modificado_en   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    creado_por      UUID,
    modificado_por  UUID,
    CONSTRAINT pk_areas PRIMARY KEY (id),
    CONSTRAINT uq_areas_codigo UNIQUE (codigo),
    CONSTRAINT fk_areas_facultad FOREIGN KEY (facultad_id)
        REFERENCES sigc_unt.facultades (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_areas_padre FOREIGN KEY (area_padre_id)
        REFERENCES sigc_unt.areas (id) ON DELETE RESTRICT ON UPDATE CASCADE
);
COMMENT ON TABLE sigc_unt.areas IS 'Estructura organizacional completa de la UNT con jerarquía self-referencial.';

-- Usuarios del sistema
CREATE TABLE sigc_unt.usuarios (
    id              UUID         NOT NULL DEFAULT uuid_generate_v4(),
    codigo_usuario  VARCHAR(20)  NOT NULL,     -- Código institucional (DNI, CUI, código docente)
    username        VARCHAR(50)  NOT NULL,     -- Para login
    email           VARCHAR(150) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    nombres         VARCHAR(100) NOT NULL,
    apellidos       VARCHAR(100) NOT NULL,
    tipo_usuario    VARCHAR(20)  NOT NULL,     -- DOCENTE, ADMINISTRATIVO, AUTORIDAD, EXTERNO
    area_id         UUID,
    cargo           VARCHAR(200),
    telefono        VARCHAR(20),
    avatar_url      VARCHAR(500),
    ldap_dn         VARCHAR(500),              -- Para futura integración LDAP
    esta_activo     BOOLEAN      NOT NULL DEFAULT TRUE,
    ultimo_login    TIMESTAMPTZ,
    intentos_login  SMALLINT     NOT NULL DEFAULT 0,
    bloqueado_hasta TIMESTAMPTZ,
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    modificado_en   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    creado_por      UUID,
    modificado_por  UUID,
    eliminado_en    TIMESTAMPTZ,
    eliminado_por   UUID,
    CONSTRAINT pk_usuarios PRIMARY KEY (id),
    CONSTRAINT uq_usuarios_username UNIQUE (username),
    CONSTRAINT uq_usuarios_email UNIQUE (email),
    CONSTRAINT uq_usuarios_codigo UNIQUE (codigo_usuario),
    CONSTRAINT fk_usuarios_area FOREIGN KEY (area_id)
        REFERENCES sigc_unt.areas (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_usuarios_tipo CHECK (tipo_usuario IN ('DOCENTE','ADMINISTRATIVO','AUTORIDAD','EXTERNO'))
);
COMMENT ON TABLE sigc_unt.usuarios IS 'Usuarios del sistema. Soft delete con campo eliminado_en.';

-- Asignación de roles a usuarios (un usuario puede tener varios roles)
CREATE TABLE sigc_unt.usuarios_roles (
    id              BIGSERIAL    PRIMARY KEY,
    usuario_id      UUID         NOT NULL,
    rol_id          SMALLINT     NOT NULL,
    area_id         UUID,        -- Rol válido solo en esta área (NULL = global)
    fecha_inicio    DATE         NOT NULL DEFAULT CURRENT_DATE,
    fecha_fin       DATE,        -- NULL = indefinido
    asignado_por    UUID,
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_ur_usuario FOREIGN KEY (usuario_id)
        REFERENCES sigc_unt.usuarios (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ur_rol FOREIGN KEY (rol_id)
        REFERENCES sigc_unt.roles (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_ur_area FOREIGN KEY (area_id)
        REFERENCES sigc_unt.areas (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT uq_usuarios_roles_activo UNIQUE (usuario_id, rol_id, area_id)
);
COMMENT ON TABLE sigc_unt.usuarios_roles IS 'Tabla de asociación usuario-rol, con alcance opcional por área.';

-- Programas académicos (carreras, maestrías, doctorados)
CREATE TABLE sigc_unt.programas_academicos (
    id              UUID         NOT NULL DEFAULT uuid_generate_v4(),
    codigo          VARCHAR(20)  NOT NULL,
    nombre          VARCHAR(200) NOT NULL,
    nivel           VARCHAR(20)  NOT NULL, -- PREGRADO, MAESTRIA, DOCTORADO, DIPLOMADO
    modalidad       VARCHAR(20)  NOT NULL DEFAULT 'PRESENCIAL',
    facultad_id     UUID         NOT NULL,
    area_id         UUID,        -- Departamento académico responsable
    duracion_ciclos SMALLINT,
    resolucion_creacion VARCHAR(100),
    fecha_creacion  DATE,
    estado_licenciamiento VARCHAR(30) DEFAULT 'LICENCIADO',
    esta_activo     BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    modificado_en   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_programas_academicos PRIMARY KEY (id),
    CONSTRAINT uq_programas_codigo UNIQUE (codigo),
    CONSTRAINT fk_pa_facultad FOREIGN KEY (facultad_id)
        REFERENCES sigc_unt.facultades (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_pa_area FOREIGN KEY (area_id)
        REFERENCES sigc_unt.areas (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_pa_nivel CHECK (nivel IN ('PREGRADO','MAESTRIA','DOCTORADO','DIPLOMADO','SEGUNDA_ESPECIALIDAD'))
);
COMMENT ON TABLE sigc_unt.programas_academicos IS 'Programas académicos de la UNT para seguimiento de acreditación por carrera.';

-- Tokens JWT de refresco (invalidación selectiva)
CREATE TABLE sigc_unt.tokens_refresco (
    id              BIGSERIAL    PRIMARY KEY,
    usuario_id      UUID         NOT NULL,
    token_hash      VARCHAR(255) NOT NULL,
    expira_en       TIMESTAMPTZ  NOT NULL,
    ip_origen       INET,
    user_agent      TEXT,
    revocado        BOOLEAN      NOT NULL DEFAULT FALSE,
    revocado_en     TIMESTAMPTZ,
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_tr_usuario FOREIGN KEY (usuario_id)
        REFERENCES sigc_unt.usuarios (id) ON DELETE CASCADE,
    CONSTRAINT uq_tokens_refresco_hash UNIQUE (token_hash)
);
COMMENT ON TABLE sigc_unt.tokens_refresco IS 'Tokens JWT de refresco para invalidación selectiva de sesiones.';

-- =============================================================================
-- SECCIÓN 4: MÓDULO GD - GESTIÓN DOCUMENTAL
-- =============================================================================

-- Documentos maestros (cabecera del documento, sin contenido por versión)
CREATE TABLE sigc_unt.documentos (
    id              UUID         NOT NULL DEFAULT uuid_generate_v4(),
    codigo          VARCHAR(30)  NOT NULL,       -- Ej: POL-GD-001, MAN-PRO-002
    tipo_documento_id SMALLINT   NOT NULL,
    titulo          VARCHAR(300) NOT NULL,
    descripcion     TEXT,
    area_id         UUID         NOT NULL,        -- Área propietaria
    proceso_id      UUID,                         -- Proceso al que pertenece (FK a procesos)
    palabras_clave  TEXT[],                       -- Array para búsqueda rápida
    aplica_a        TEXT[],                       -- Áreas/programas donde aplica
    estado_id       SMALLINT     NOT NULL,        -- FK a estados_flujo (módulo GD)
    version_actual  VARCHAR(10)  NOT NULL DEFAULT '1.0',
    esta_activo     BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    modificado_en   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    creado_por      UUID         NOT NULL,
    modificado_por  UUID,
    eliminado_en    TIMESTAMPTZ,
    eliminado_por   UUID,
    CONSTRAINT pk_documentos PRIMARY KEY (id),
    CONSTRAINT uq_documentos_codigo UNIQUE (codigo),
    CONSTRAINT fk_doc_tipo FOREIGN KEY (tipo_documento_id)
        REFERENCES sigc_unt.tipos_documento (id) ON DELETE RESTRICT,
    CONSTRAINT fk_doc_area FOREIGN KEY (area_id)
        REFERENCES sigc_unt.areas (id) ON DELETE RESTRICT,
    CONSTRAINT fk_doc_estado FOREIGN KEY (estado_id)
        REFERENCES sigc_unt.estados_flujo (id) ON DELETE RESTRICT,
    CONSTRAINT fk_doc_creado_por FOREIGN KEY (creado_por)
        REFERENCES sigc_unt.usuarios (id) ON DELETE RESTRICT
);
COMMENT ON TABLE sigc_unt.documentos IS 'Cabecera maestra de documentos del SGC. El contenido se gestiona por versión.';

-- Versiones de documentos (contenido real de cada versión)
CREATE TABLE sigc_unt.versiones_documento (
    id              UUID         NOT NULL DEFAULT uuid_generate_v4(),
    documento_id    UUID         NOT NULL,
    numero_version  VARCHAR(10)  NOT NULL,        -- 1.0, 1.1, 2.0
    contenido_url   VARCHAR(500),                 -- URL en MinIO/S3
    contenido_texto TEXT,                         -- Versión texto para indexación
    resumen_cambios TEXT         NOT NULL,
    estado_id       SMALLINT     NOT NULL,
    es_version_actual BOOLEAN    NOT NULL DEFAULT FALSE,
    elaborado_por   UUID         NOT NULL,
    revisado_por    UUID,
    aprobado_por    UUID,
    fecha_elaboracion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_revision  TIMESTAMPTZ,
    fecha_aprobacion TIMESTAMPTZ,
    fecha_publicacion TIMESTAMPTZ,
    fecha_vigencia_hasta TIMESTAMPTZ,
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_versiones_documento PRIMARY KEY (id),
    CONSTRAINT uq_versiones_doc_version UNIQUE (documento_id, numero_version),
    CONSTRAINT fk_vd_documento FOREIGN KEY (documento_id)
        REFERENCES sigc_unt.documentos (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_vd_estado FOREIGN KEY (estado_id)
        REFERENCES sigc_unt.estados_flujo (id) ON DELETE RESTRICT,
    CONSTRAINT fk_vd_elaborado FOREIGN KEY (elaborado_por)
        REFERENCES sigc_unt.usuarios (id) ON DELETE RESTRICT,
    CONSTRAINT fk_vd_revisado FOREIGN KEY (revisado_por)
        REFERENCES sigc_unt.usuarios (id) ON DELETE RESTRICT,
    CONSTRAINT fk_vd_aprobado FOREIGN KEY (aprobado_por)
        REFERENCES sigc_unt.usuarios (id) ON DELETE RESTRICT
);
COMMENT ON TABLE sigc_unt.versiones_documento IS 'Versiones de cada documento con URL al archivo en almacenamiento objeto.';

-- Flujo de aprobación de documentos (trazabilidad de cada paso)
CREATE TABLE sigc_unt.aprobaciones_documento (
    id              BIGSERIAL    PRIMARY KEY,
    version_id      UUID         NOT NULL,
    paso            SMALLINT     NOT NULL,        -- Número de paso en el flujo
    tipo_paso       VARCHAR(20)  NOT NULL,        -- REVISION, APROBACION, PUBLICACION
    usuario_id      UUID         NOT NULL,
    rol_requerido_id SMALLINT,
    accion          VARCHAR(20),                  -- APROBADO, RECHAZADO, SOLICITADO_CAMBIOS
    comentarios     TEXT,
    fecha_accion    TIMESTAMPTZ,
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_ad_version FOREIGN KEY (version_id)
        REFERENCES sigc_unt.versiones_documento (id) ON DELETE CASCADE,
    CONSTRAINT fk_ad_usuario FOREIGN KEY (usuario_id)
        REFERENCES sigc_unt.usuarios (id) ON DELETE RESTRICT,
    CONSTRAINT chk_ad_accion CHECK (accion IN ('APROBADO','RECHAZADO','SOLICITADO_CAMBIOS','PENDIENTE') OR accion IS NULL)
);
COMMENT ON TABLE sigc_unt.aprobaciones_documento IS 'Registro detallado de cada paso del flujo de aprobación documental.';

-- =============================================================================
-- SECCIÓN 5: MÓDULO MP - MAPA DE PROCESOS
-- =============================================================================

-- Macroprocesos (nivel más alto de la cadena de valor)
CREATE TABLE sigc_unt.macroprocesos (
    id              UUID         NOT NULL DEFAULT uuid_generate_v4(),
    codigo          VARCHAR(15)  NOT NULL,
    nombre          VARCHAR(150) NOT NULL,
    tipo            VARCHAR(20)  NOT NULL,        -- ESTRATEGICO, MISIONAL, SOPORTE
    descripcion     TEXT,
    orden           SMALLINT     NOT NULL DEFAULT 0,
    esta_activo     BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    modificado_en   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_macroprocesos PRIMARY KEY (id),
    CONSTRAINT uq_macroprocesos_codigo UNIQUE (codigo),
    CONSTRAINT chk_macroprocesos_tipo CHECK (tipo IN ('ESTRATEGICO','MISIONAL','SOPORTE'))
);
COMMENT ON TABLE sigc_unt.macroprocesos IS 'Nivel 1 del mapa de procesos: macroprocesos estratégicos, misionales y de soporte.';

-- Procesos (nivel 2, dentro de macroprocesos)
CREATE TABLE sigc_unt.procesos (
    id              UUID         NOT NULL DEFAULT uuid_generate_v4(),
    macroproceso_id UUID         NOT NULL,
    codigo          VARCHAR(20)  NOT NULL,
    nombre          VARCHAR(200) NOT NULL,
    objetivo        TEXT,
    alcance         TEXT,
    entradas        TEXT[],                       -- Entradas del proceso
    salidas         TEXT[],                       -- Salidas/productos del proceso
    area_responsable_id UUID     NOT NULL,
    estado_id       SMALLINT     NOT NULL,
    diagrama_bpmn_url VARCHAR(500),               -- URL al archivo BPMN 2.0
    diagrama_bpmn_json JSONB,                     -- Representación JSON del diagrama
    orden           SMALLINT     NOT NULL DEFAULT 0,
    esta_activo     BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    modificado_en   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    creado_por      UUID,
    modificado_por  UUID,
    CONSTRAINT pk_procesos PRIMARY KEY (id),
    CONSTRAINT uq_procesos_codigo UNIQUE (codigo),
    CONSTRAINT fk_proc_macroproceso FOREIGN KEY (macroproceso_id)
        REFERENCES sigc_unt.macroprocesos (id) ON DELETE RESTRICT,
    CONSTRAINT fk_proc_area FOREIGN KEY (area_responsable_id)
        REFERENCES sigc_unt.areas (id) ON DELETE RESTRICT,
    CONSTRAINT fk_proc_estado FOREIGN KEY (estado_id)
        REFERENCES sigc_unt.estados_flujo (id) ON DELETE RESTRICT
);
COMMENT ON TABLE sigc_unt.procesos IS 'Procesos del mapa de procesos UNT con referencia a diagramas BPMN.';

-- FK diferida: documentos -> procesos (ciclo de referencias)
ALTER TABLE sigc_unt.documentos
    ADD CONSTRAINT fk_doc_proceso FOREIGN KEY (proceso_id)
        REFERENCES sigc_unt.procesos (id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Subprocesos (nivel 3)
CREATE TABLE sigc_unt.subprocesos (
    id              UUID         NOT NULL DEFAULT uuid_generate_v4(),
    proceso_id      UUID         NOT NULL,
    codigo          VARCHAR(25)  NOT NULL,
    nombre          VARCHAR(200) NOT NULL,
    descripcion     TEXT,
    responsable_id  UUID,
    orden           SMALLINT     NOT NULL DEFAULT 0,
    esta_activo     BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    modificado_en   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_subprocesos PRIMARY KEY (id),
    CONSTRAINT uq_subprocesos_codigo UNIQUE (codigo),
    CONSTRAINT fk_sp_proceso FOREIGN KEY (proceso_id)
        REFERENCES sigc_unt.procesos (id) ON DELETE CASCADE,
    CONSTRAINT fk_sp_responsable FOREIGN KEY (responsable_id)
        REFERENCES sigc_unt.usuarios (id) ON DELETE SET NULL
);
COMMENT ON TABLE sigc_unt.subprocesos IS 'Nivel 3 del mapa: subprocesos con responsable asignado.';

-- Matriz RACI por proceso
CREATE TABLE sigc_unt.matriz_raci (
    id              BIGSERIAL    PRIMARY KEY,
    proceso_id      UUID         NOT NULL,
    subproceso_id   UUID,        -- Opcional, si la responsabilidad es por subproceso
    area_id         UUID         NOT NULL,
    usuario_id      UUID,        -- Persona específica (nullable para responsabilidad por área)
    rol_raci        CHAR(1)      NOT NULL,        -- R=Responsable, A=Autoridad, C=Consultado, I=Informado
    descripcion     TEXT,
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_raci_proceso FOREIGN KEY (proceso_id)
        REFERENCES sigc_unt.procesos (id) ON DELETE CASCADE,
    CONSTRAINT fk_raci_subproceso FOREIGN KEY (subproceso_id)
        REFERENCES sigc_unt.subprocesos (id) ON DELETE CASCADE,
    CONSTRAINT fk_raci_area FOREIGN KEY (area_id)
        REFERENCES sigc_unt.areas (id) ON DELETE CASCADE,
    CONSTRAINT fk_raci_usuario FOREIGN KEY (usuario_id)
        REFERENCES sigc_unt.usuarios (id) ON DELETE SET NULL,
    CONSTRAINT chk_raci_rol CHECK (rol_raci IN ('R','A','C','I'))
);
COMMENT ON TABLE sigc_unt.matriz_raci IS 'Matriz RACI de responsabilidades por proceso y subproceso.';

-- =============================================================================
-- SECCIÓN 6: MÓDULO IG - INDICADORES DE GESTIÓN
-- =============================================================================

-- Objetivos estratégicos (vinculados al PEI/POI de la UNT)
CREATE TABLE sigc_unt.objetivos_estrategicos (
    id              UUID         NOT NULL DEFAULT uuid_generate_v4(),
    codigo          VARCHAR(20)  NOT NULL,
    nombre          VARCHAR(300) NOT NULL,
    descripcion     TEXT,
    perspectiva     VARCHAR(40), -- Perspectiva BSC: Financiera, Clientes, Procesos, Aprendizaje
    anio_pei        SMALLINT,
    esta_activo     BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    modificado_en   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_objetivos_estrategicos PRIMARY KEY (id),
    CONSTRAINT uq_oe_codigo UNIQUE (codigo)
);
COMMENT ON TABLE sigc_unt.objetivos_estrategicos IS 'Objetivos estratégicos del PEI de la UNT para alineación de indicadores.';

-- Indicadores de gestión (KPIs)
CREATE TABLE sigc_unt.indicadores (
    id                  UUID         NOT NULL DEFAULT uuid_generate_v4(),
    codigo              VARCHAR(20)  NOT NULL,
    nombre              VARCHAR(200) NOT NULL,
    descripcion         TEXT,
    formula             TEXT         NOT NULL,    -- Fórmula de cálculo en texto
    unidad_medida       VARCHAR(30),
    tipo_tendencia      VARCHAR(10)  NOT NULL DEFAULT 'MAYOR', -- MAYOR=mejor si es alto, MENOR=mejor si es bajo
    meta_valor          DECIMAL(15,4),
    meta_descripcion    TEXT,
    frecuencia_id       SMALLINT     NOT NULL,
    proceso_id          UUID,
    area_responsable_id UUID         NOT NULL,
    responsable_id      UUID,        -- Usuario que reporta el indicador
    objetivo_estrategico_id UUID,
    fuente_datos        TEXT,
    esta_activo         BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    modificado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    creado_por          UUID,
    modificado_por      UUID,
    CONSTRAINT pk_indicadores PRIMARY KEY (id),
    CONSTRAINT uq_indicadores_codigo UNIQUE (codigo),
    CONSTRAINT fk_ind_frecuencia FOREIGN KEY (frecuencia_id)
        REFERENCES sigc_unt.frecuencias_medicion (id) ON DELETE RESTRICT,
    CONSTRAINT fk_ind_proceso FOREIGN KEY (proceso_id)
        REFERENCES sigc_unt.procesos (id) ON DELETE SET NULL,
    CONSTRAINT fk_ind_area FOREIGN KEY (area_responsable_id)
        REFERENCES sigc_unt.areas (id) ON DELETE RESTRICT,
    CONSTRAINT fk_ind_responsable FOREIGN KEY (responsable_id)
        REFERENCES sigc_unt.usuarios (id) ON DELETE SET NULL,
    CONSTRAINT fk_ind_objetivo FOREIGN KEY (objetivo_estrategico_id)
        REFERENCES sigc_unt.objetivos_estrategicos (id) ON DELETE SET NULL,
    CONSTRAINT chk_ind_tendencia CHECK (tipo_tendencia IN ('MAYOR','MENOR','NOMINAL'))
);
COMMENT ON TABLE sigc_unt.indicadores IS 'KPIs del SGC con fórmula, meta, frecuencia y vinculación estratégica.';

-- Mediciones de indicadores (valores registrados periódicamente)
CREATE TABLE sigc_unt.mediciones_indicador (
    id              BIGSERIAL    PRIMARY KEY,
    indicador_id    UUID         NOT NULL,
    periodo_inicio  DATE         NOT NULL,
    periodo_fin     DATE         NOT NULL,
    valor_real      DECIMAL(15,4) NOT NULL,
    valor_meta      DECIMAL(15,4),               -- Meta vigente en el momento de medición
    estado_semaforo VARCHAR(10)  NOT NULL DEFAULT 'VERDE', -- VERDE, AMARILLO, ROJO
    observaciones   TEXT,
    evidencia_url   VARCHAR(500),
    registrado_por  UUID         NOT NULL,
    validado_por    UUID,
    fecha_registro  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    fecha_validacion TIMESTAMPTZ,
    CONSTRAINT fk_mi_indicador FOREIGN KEY (indicador_id)
        REFERENCES sigc_unt.indicadores (id) ON DELETE RESTRICT,
    CONSTRAINT fk_mi_registrado FOREIGN KEY (registrado_por)
        REFERENCES sigc_unt.usuarios (id) ON DELETE RESTRICT,
    CONSTRAINT fk_mi_validado FOREIGN KEY (validado_por)
        REFERENCES sigc_unt.usuarios (id) ON DELETE SET NULL,
    CONSTRAINT chk_mi_semaforo CHECK (estado_semaforo IN ('VERDE','AMARILLO','ROJO')),
    CONSTRAINT chk_mi_periodo CHECK (periodo_fin >= periodo_inicio)
);
COMMENT ON TABLE sigc_unt.mediciones_indicador IS 'Valores medidos de KPIs por período con semáforo automático.';

-- =============================================================================
-- SECCIÓN 7: MÓDULO AA - ACREDITACIÓN Y AUTOEVALUACIÓN
-- =============================================================================

-- Procesos de acreditación por programa
CREATE TABLE sigc_unt.procesos_acreditacion (
    id                  UUID         NOT NULL DEFAULT uuid_generate_v4(),
    programa_id         UUID         NOT NULL,
    estandar_id         SMALLINT     NOT NULL,
    tipo_proceso        VARCHAR(20)  NOT NULL,    -- AUTOEVALUACION, EVALUACION_EXTERNA, ACREDITACION, REACREDITACION
    anio_inicio         SMALLINT     NOT NULL,
    fecha_inicio        DATE,
    fecha_visita_externa DATE,
    fecha_acreditacion  DATE,
    fecha_vencimiento   DATE,
    estado_id           SMALLINT     NOT NULL,
    resolucion_acreditacion VARCHAR(100),
    puntuacion_total    DECIMAL(5,2),
    observaciones       TEXT,
    creado_en           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    modificado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    creado_por          UUID,
    CONSTRAINT pk_procesos_acreditacion PRIMARY KEY (id),
    CONSTRAINT fk_pa_programa FOREIGN KEY (programa_id)
        REFERENCES sigc_unt.programas_academicos (id) ON DELETE RESTRICT,
    CONSTRAINT fk_pa_estandar FOREIGN KEY (estandar_id)
        REFERENCES sigc_unt.estandares_acreditacion (id) ON DELETE RESTRICT,
    CONSTRAINT fk_pa_estado FOREIGN KEY (estado_id)
        REFERENCES sigc_unt.estados_flujo (id) ON DELETE RESTRICT
);
COMMENT ON TABLE sigc_unt.procesos_acreditacion IS 'Procesos de acreditación por programa académico con cronograma.';

-- Factores del estándar de acreditación
CREATE TABLE sigc_unt.factores_estandar (
    id              UUID         NOT NULL DEFAULT uuid_generate_v4(),
    estandar_id     SMALLINT     NOT NULL,
    codigo          VARCHAR(20)  NOT NULL,
    nombre          VARCHAR(200) NOT NULL,
    descripcion     TEXT,
    ponderacion     DECIMAL(5,2),               -- % de peso en puntuación total
    orden           SMALLINT     NOT NULL DEFAULT 0,
    CONSTRAINT pk_factores_estandar PRIMARY KEY (id),
    CONSTRAINT uq_fe_estandar_codigo UNIQUE (estandar_id, codigo),
    CONSTRAINT fk_fe_estandar FOREIGN KEY (estandar_id)
        REFERENCES sigc_unt.estandares_acreditacion (id) ON DELETE CASCADE
);

-- Criterios por factor
CREATE TABLE sigc_unt.criterios_factor (
    id              UUID         NOT NULL DEFAULT uuid_generate_v4(),
    factor_id       UUID         NOT NULL,
    codigo          VARCHAR(25)  NOT NULL,
    nombre          VARCHAR(300) NOT NULL,
    descripcion     TEXT,
    indicadores_requeridos TEXT,                -- Descripción de evidencias esperadas
    ponderacion     DECIMAL(5,2),
    orden           SMALLINT     NOT NULL DEFAULT 0,
    CONSTRAINT pk_criterios_factor PRIMARY KEY (id),
    CONSTRAINT uq_cf_factor_codigo UNIQUE (factor_id, codigo),
    CONSTRAINT fk_cf_factor FOREIGN KEY (factor_id)
        REFERENCES sigc_unt.factores_estandar (id) ON DELETE CASCADE
);

-- Autoevaluación por criterio dentro de un proceso de acreditación
CREATE TABLE sigc_unt.autoevaluaciones (
    id                  UUID         NOT NULL DEFAULT uuid_generate_v4(),
    proceso_acreditacion_id UUID     NOT NULL,
    criterio_id         UUID         NOT NULL,
    puntuacion          DECIMAL(5,2),
    nivel_logro         VARCHAR(20), -- LOGRADO, PARCIALMENTE_LOGRADO, NO_LOGRADO
    fortalezas          TEXT,
    debilidades         TEXT,
    oportunidades       TEXT,
    plan_mejora         TEXT,
    responsable_id      UUID,
    estado_id           SMALLINT     NOT NULL,
    fecha_evaluacion    DATE,
    creado_en           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    modificado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_autoevaluaciones PRIMARY KEY (id),
    CONSTRAINT uq_autoevaluacion_unica UNIQUE (proceso_acreditacion_id, criterio_id),
    CONSTRAINT fk_ae_proceso FOREIGN KEY (proceso_acreditacion_id)
        REFERENCES sigc_unt.procesos_acreditacion (id) ON DELETE CASCADE,
    CONSTRAINT fk_ae_criterio FOREIGN KEY (criterio_id)
        REFERENCES sigc_unt.criterios_factor (id) ON DELETE RESTRICT,
    CONSTRAINT fk_ae_responsable FOREIGN KEY (responsable_id)
        REFERENCES sigc_unt.usuarios (id) ON DELETE SET NULL,
    CONSTRAINT fk_ae_estado FOREIGN KEY (estado_id)
        REFERENCES sigc_unt.estados_flujo (id) ON DELETE RESTRICT
);
COMMENT ON TABLE sigc_unt.autoevaluaciones IS 'Registro de autoevaluación por criterio dentro de un proceso de acreditación.';

-- Evidencias (tabla polimórfica para vincular archivos a múltiples entidades)
-- Justificación polimórfica: Una evidencia puede corresponder a autoevaluación,
-- auditoría, CAPA, inspección o indicador. Evita 5 tablas redundantes de evidencias.
CREATE TABLE sigc_unt.evidencias (
    id              UUID         NOT NULL DEFAULT uuid_generate_v4(),
    entidad_tipo    VARCHAR(30)  NOT NULL,  -- AUTOEVALUACION, HALLAZGO, CAPA, INSPECCION, MEDICION
    entidad_id      UUID         NOT NULL,  -- ID del registro en la tabla correspondiente
    nombre          VARCHAR(300) NOT NULL,
    descripcion     TEXT,
    archivo_url     VARCHAR(500),           -- URL en MinIO/S3
    tipo_mime       VARCHAR(100),
    tamano_bytes    BIGINT,
    codigo_evidencia VARCHAR(30),
    fecha_documento DATE,
    subido_por      UUID         NOT NULL,
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_evidencias PRIMARY KEY (id),
    CONSTRAINT fk_ev_subido FOREIGN KEY (subido_por)
        REFERENCES sigc_unt.usuarios (id) ON DELETE RESTRICT,
    CONSTRAINT chk_ev_tipo CHECK (entidad_tipo IN ('AUTOEVALUACION','HALLAZGO','CAPA_ACCION','INSPECCION','MEDICION','RIESGO','DOCUMENTO'))
);
COMMENT ON TABLE sigc_unt.evidencias IS 'Tabla polimórfica de evidencias: centraliza archivos adjuntos de múltiples módulos (autoevaluación, auditoría, CAPA, etc.). El campo entidad_tipo discrimina la tabla origen.';

-- =============================================================================
-- SECCIÓN 8: MÓDULO AI - AUDITORÍAS E INSPECCIONES
-- =============================================================================

-- Plan anual de auditorías
CREATE TABLE sigc_unt.planes_auditoria (
    id              UUID         NOT NULL DEFAULT uuid_generate_v4(),
    anio            SMALLINT     NOT NULL,
    nombre          VARCHAR(200) NOT NULL,
    descripcion     TEXT,
    area_responsable_id UUID     NOT NULL,
    estado_id       SMALLINT     NOT NULL,
    fecha_aprobacion DATE,
    aprobado_por    UUID,
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    modificado_en   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    creado_por      UUID,
    CONSTRAINT pk_planes_auditoria PRIMARY KEY (id),
    CONSTRAINT uq_planes_auditoria_anio_nombre UNIQUE (anio, nombre),
    CONSTRAINT fk_pla_area FOREIGN KEY (area_responsable_id)
        REFERENCES sigc_unt.areas (id) ON DELETE RESTRICT,
    CONSTRAINT fk_pla_estado FOREIGN KEY (estado_id)
        REFERENCES sigc_unt.estados_flujo (id) ON DELETE RESTRICT,
    CONSTRAINT fk_pla_aprobado FOREIGN KEY (aprobado_por)
        REFERENCES sigc_unt.usuarios (id) ON DELETE SET NULL
);

-- Auditorías individuales (dentro de un plan)
CREATE TABLE sigc_unt.auditorias (
    id              UUID         NOT NULL DEFAULT uuid_generate_v4(),
    plan_id         UUID         NOT NULL,
    tipo_id         SMALLINT     NOT NULL,
    codigo          VARCHAR(20)  NOT NULL,
    nombre          VARCHAR(200) NOT NULL,
    objetivo        TEXT,
    alcance         TEXT,
    area_auditada_id UUID        NOT NULL,
    proceso_auditado_id UUID,
    fecha_programada_inicio DATE NOT NULL,
    fecha_programada_fin    DATE NOT NULL,
    fecha_real_inicio DATE,
    fecha_real_fin   DATE,
    estado_id       SMALLINT     NOT NULL,
    observaciones   TEXT,
    informe_url     VARCHAR(500),
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    modificado_en   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    creado_por      UUID,
    CONSTRAINT pk_auditorias PRIMARY KEY (id),
    CONSTRAINT uq_auditorias_codigo UNIQUE (codigo),
    CONSTRAINT fk_aud_plan FOREIGN KEY (plan_id)
        REFERENCES sigc_unt.planes_auditoria (id) ON DELETE RESTRICT,
    CONSTRAINT fk_aud_tipo FOREIGN KEY (tipo_id)
        REFERENCES sigc_unt.tipos_auditoria (id) ON DELETE RESTRICT,
    CONSTRAINT fk_aud_area FOREIGN KEY (area_auditada_id)
        REFERENCES sigc_unt.areas (id) ON DELETE RESTRICT,
    CONSTRAINT fk_aud_proceso FOREIGN KEY (proceso_auditado_id)
        REFERENCES sigc_unt.procesos (id) ON DELETE SET NULL,
    CONSTRAINT fk_aud_estado FOREIGN KEY (estado_id)
        REFERENCES sigc_unt.estados_flujo (id) ON DELETE RESTRICT,
    CONSTRAINT chk_aud_fechas CHECK (fecha_programada_fin >= fecha_programada_inicio)
);
COMMENT ON TABLE sigc_unt.auditorias IS 'Auditorías programadas dentro del plan anual.';

-- Equipo auditor por auditoría
CREATE TABLE sigc_unt.auditores_asignados (
    id              BIGSERIAL    PRIMARY KEY,
    auditoria_id    UUID         NOT NULL,
    usuario_id      UUID         NOT NULL,
    rol_auditoria   VARCHAR(20)  NOT NULL,        -- LIDER, AUDITOR, OBSERVADOR, EXPERTO_TECNICO
    CONSTRAINT fk_aa_auditoria FOREIGN KEY (auditoria_id)
        REFERENCES sigc_unt.auditorias (id) ON DELETE CASCADE,
    CONSTRAINT fk_aa_usuario FOREIGN KEY (usuario_id)
        REFERENCES sigc_unt.usuarios (id) ON DELETE RESTRICT,
    CONSTRAINT uq_auditores_asignados UNIQUE (auditoria_id, usuario_id),
    CONSTRAINT chk_aa_rol CHECK (rol_auditoria IN ('LIDER','AUDITOR','OBSERVADOR','EXPERTO_TECNICO'))
);

-- Checklists (plantillas de lista de verificación por tipo de auditoría)
CREATE TABLE sigc_unt.checklists (
    id              UUID         NOT NULL DEFAULT uuid_generate_v4(),
    tipo_auditoria_id SMALLINT   NOT NULL,
    nombre          VARCHAR(200) NOT NULL,
    descripcion     TEXT,
    version         VARCHAR(10)  NOT NULL DEFAULT '1.0',
    esta_activo     BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    creado_por      UUID,
    CONSTRAINT pk_checklists PRIMARY KEY (id),
    CONSTRAINT fk_ck_tipo FOREIGN KEY (tipo_auditoria_id)
        REFERENCES sigc_unt.tipos_auditoria (id) ON DELETE RESTRICT
);

-- Ítems del checklist
CREATE TABLE sigc_unt.items_checklist (
    id              UUID         NOT NULL DEFAULT uuid_generate_v4(),
    checklist_id    UUID         NOT NULL,
    criterio_referencia VARCHAR(50),              -- Referencia al estándar (ISO, SINEACE...)
    pregunta        TEXT         NOT NULL,
    descripcion_ayuda TEXT,
    tipo_respuesta  VARCHAR(20)  NOT NULL DEFAULT 'SI_NO', -- SI_NO, ESCALA, TEXTO, MULTIPLE
    obligatorio     BOOLEAN      NOT NULL DEFAULT TRUE,
    orden           SMALLINT     NOT NULL DEFAULT 0,
    CONSTRAINT pk_items_checklist PRIMARY KEY (id),
    CONSTRAINT fk_ic_checklist FOREIGN KEY (checklist_id)
        REFERENCES sigc_unt.checklists (id) ON DELETE CASCADE
);

-- Respuestas al checklist por auditoría
CREATE TABLE sigc_unt.respuestas_checklist (
    id              UUID         NOT NULL DEFAULT uuid_generate_v4(),
    auditoria_id    UUID         NOT NULL,
    item_id         UUID         NOT NULL,
    respuesta       VARCHAR(10), -- SI, NO, N/A, valor numérico
    observacion     TEXT,
    genera_hallazgo BOOLEAN      NOT NULL DEFAULT FALSE,
    respondido_por  UUID,
    fecha_respuesta TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_respuestas_checklist PRIMARY KEY (id),
    CONSTRAINT uq_rc_auditoria_item UNIQUE (auditoria_id, item_id),
    CONSTRAINT fk_rc_auditoria FOREIGN KEY (auditoria_id)
        REFERENCES sigc_unt.auditorias (id) ON DELETE CASCADE,
    CONSTRAINT fk_rc_item FOREIGN KEY (item_id)
        REFERENCES sigc_unt.items_checklist (id) ON DELETE RESTRICT,
    CONSTRAINT fk_rc_respondido FOREIGN KEY (respondido_por)
        REFERENCES sigc_unt.usuarios (id) ON DELETE SET NULL
);

-- Hallazgos de auditoría
CREATE TABLE sigc_unt.hallazgos (
    id              UUID         NOT NULL DEFAULT uuid_generate_v4(),
    auditoria_id    UUID         NOT NULL,
    tipo_id         SMALLINT     NOT NULL,
    codigo          VARCHAR(30)  NOT NULL,
    descripcion     TEXT         NOT NULL,
    requisito_incumplido TEXT,                   -- Norma o procedimiento incumplido
    proceso_id      UUID,
    area_id         UUID         NOT NULL,
    estado_id       SMALLINT     NOT NULL,
    fecha_deteccion DATE         NOT NULL DEFAULT CURRENT_DATE,
    fecha_limite_cierre DATE,
    fecha_cierre_real DATE,
    cerrado_por     UUID,
    observacion_cierre TEXT,
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    modificado_en   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_hallazgos PRIMARY KEY (id),
    CONSTRAINT uq_hallazgos_codigo UNIQUE (auditoria_id, codigo),
    CONSTRAINT fk_hall_auditoria FOREIGN KEY (auditoria_id)
        REFERENCES sigc_unt.auditorias (id) ON DELETE RESTRICT,
    CONSTRAINT fk_hall_tipo FOREIGN KEY (tipo_id)
        REFERENCES sigc_unt.tipos_hallazgo (id) ON DELETE RESTRICT,
    CONSTRAINT fk_hall_proceso FOREIGN KEY (proceso_id)
        REFERENCES sigc_unt.procesos (id) ON DELETE SET NULL,
    CONSTRAINT fk_hall_area FOREIGN KEY (area_id)
        REFERENCES sigc_unt.areas (id) ON DELETE RESTRICT,
    CONSTRAINT fk_hall_estado FOREIGN KEY (estado_id)
        REFERENCES sigc_unt.estados_flujo (id) ON DELETE RESTRICT,
    CONSTRAINT fk_hall_cerrado FOREIGN KEY (cerrado_por)
        REFERENCES sigc_unt.usuarios (id) ON DELETE SET NULL
);
COMMENT ON TABLE sigc_unt.hallazgos IS 'Hallazgos de auditoría (NC mayores, menores, observaciones, oportunidades de mejora).';

-- =============================================================================
-- SECCIÓN 9: MÓDULO CAPA - ACCIONES CORRECTIVAS Y PREVENTIVAS
-- =============================================================================

-- No conformidades (origen de las acciones CAPA)
CREATE TABLE sigc_unt.no_conformidades (
    id              UUID         NOT NULL DEFAULT uuid_generate_v4(),
    codigo          VARCHAR(30)  NOT NULL,
    origen          VARCHAR(20)  NOT NULL,  -- AUDITORIA, INSPECCION, QUEJA, INDICADOR, REVISION_DIRECCION, AUTOEVALUACION
    hallazgo_id     UUID,                   -- Si viene de auditoría
    descripcion     TEXT         NOT NULL,
    requisito_afectado TEXT,
    proceso_id      UUID,
    area_id         UUID         NOT NULL,
    detectado_por   UUID,
    estado_id       SMALLINT     NOT NULL,
    fecha_deteccion DATE         NOT NULL DEFAULT CURRENT_DATE,
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    modificado_en   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    creado_por      UUID         NOT NULL,
    CONSTRAINT pk_no_conformidades PRIMARY KEY (id),
    CONSTRAINT uq_nc_codigo UNIQUE (codigo),
    CONSTRAINT fk_nc_hallazgo FOREIGN KEY (hallazgo_id)
        REFERENCES sigc_unt.hallazgos (id) ON DELETE SET NULL,
    CONSTRAINT fk_nc_proceso FOREIGN KEY (proceso_id)
        REFERENCES sigc_unt.procesos (id) ON DELETE SET NULL,
    CONSTRAINT fk_nc_area FOREIGN KEY (area_id)
        REFERENCES sigc_unt.areas (id) ON DELETE RESTRICT,
    CONSTRAINT fk_nc_estado FOREIGN KEY (estado_id)
        REFERENCES sigc_unt.estados_flujo (id) ON DELETE RESTRICT,
    CONSTRAINT chk_nc_origen CHECK (origen IN ('AUDITORIA','INSPECCION','QUEJA','INDICADOR','REVISION_DIRECCION','AUTOEVALUACION','OTRO'))
);
COMMENT ON TABLE sigc_unt.no_conformidades IS 'Registro centralizado de no conformidades de cualquier origen.';

-- Análisis de causa raíz por NC
CREATE TABLE sigc_unt.analisis_causa_raiz (
    id              UUID         NOT NULL DEFAULT uuid_generate_v4(),
    nc_id           UUID         NOT NULL,
    metodo_id       SMALLINT     NOT NULL,
    descripcion_causa TEXT        NOT NULL,
    causa_raiz      TEXT         NOT NULL,
    factores_contribuyentes TEXT[],
    analista_id     UUID,
    fecha_analisis  DATE         NOT NULL DEFAULT CURRENT_DATE,
    datos_metodo    JSONB,               -- Almacena la estructura del método (5 Porqués, ramas Ishikawa)
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_analisis_causa_raiz PRIMARY KEY (id),
    CONSTRAINT fk_acr_nc FOREIGN KEY (nc_id)
        REFERENCES sigc_unt.no_conformidades (id) ON DELETE CASCADE,
    CONSTRAINT fk_acr_metodo FOREIGN KEY (metodo_id)
        REFERENCES sigc_unt.metodos_causa_raiz (id) ON DELETE RESTRICT,
    CONSTRAINT fk_acr_analista FOREIGN KEY (analista_id)
        REFERENCES sigc_unt.usuarios (id) ON DELETE SET NULL
);
COMMENT ON TABLE sigc_unt.analisis_causa_raiz IS 'Análisis de causa raíz con soporte a múltiples metodologías (datos_metodo en JSONB).';

-- Acciones del plan CAPA
CREATE TABLE sigc_unt.acciones_capa (
    id              UUID         NOT NULL DEFAULT uuid_generate_v4(),
    nc_id           UUID         NOT NULL,
    tipo_accion     VARCHAR(20)  NOT NULL,        -- CORRECTIVA, PREVENTIVA, MEJORA, CONTENCION
    descripcion     TEXT         NOT NULL,
    responsable_id  UUID         NOT NULL,
    area_id         UUID         NOT NULL,
    fecha_compromiso DATE        NOT NULL,
    fecha_real_cierre DATE,
    porcentaje_avance SMALLINT   NOT NULL DEFAULT 0,
    estado_id       SMALLINT     NOT NULL,
    resultado_esperado TEXT,
    resultado_real  TEXT,
    verificacion_efectividad TEXT,
    verificado_por  UUID,
    fecha_verificacion DATE,
    recursos_requeridos TEXT,
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    modificado_en   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_acciones_capa PRIMARY KEY (id),
    CONSTRAINT fk_ac_nc FOREIGN KEY (nc_id)
        REFERENCES sigc_unt.no_conformidades (id) ON DELETE RESTRICT,
    CONSTRAINT fk_ac_responsable FOREIGN KEY (responsable_id)
        REFERENCES sigc_unt.usuarios (id) ON DELETE RESTRICT,
    CONSTRAINT fk_ac_area FOREIGN KEY (area_id)
        REFERENCES sigc_unt.areas (id) ON DELETE RESTRICT,
    CONSTRAINT fk_ac_estado FOREIGN KEY (estado_id)
        REFERENCES sigc_unt.estados_flujo (id) ON DELETE RESTRICT,
    CONSTRAINT fk_ac_verificado FOREIGN KEY (verificado_por)
        REFERENCES sigc_unt.usuarios (id) ON DELETE SET NULL,
    CONSTRAINT chk_ac_tipo CHECK (tipo_accion IN ('CORRECTIVA','PREVENTIVA','MEJORA','CONTENCION')),
    CONSTRAINT chk_ac_avance CHECK (porcentaje_avance BETWEEN 0 AND 100)
);
COMMENT ON TABLE sigc_unt.acciones_capa IS 'Acciones correctivas, preventivas y de mejora asociadas a no conformidades.';

-- =============================================================================
-- SECCIÓN 10: MÓDULO GR - GESTIÓN DE RIESGOS
-- =============================================================================

CREATE TABLE sigc_unt.riesgos (
    id              UUID         NOT NULL DEFAULT uuid_generate_v4(),
    codigo          VARCHAR(25)  NOT NULL,
    nombre          VARCHAR(200) NOT NULL,
    descripcion     TEXT         NOT NULL,
    tipo_riesgo     VARCHAR(20)  NOT NULL,        -- ESTRATEGICO, OPERACIONAL, FINANCIERO, LEGAL, REPUTACIONAL, TI
    area_id         UUID         NOT NULL,
    proceso_id      UUID,
    objetivo_estrategico_id UUID,
    causa           TEXT,
    consecuencia    TEXT,
    probabilidad    DECIMAL(3,1) NOT NULL,        -- 1-5
    impacto         DECIMAL(3,1) NOT NULL,        -- 1-5
    puntuacion      DECIMAL(5,2) GENERATED ALWAYS AS (probabilidad * impacto) STORED,
    nivel_riesgo_id SMALLINT     NOT NULL,
    responsable_id  UUID,
    estado_id       SMALLINT     NOT NULL,
    activo          BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    modificado_en   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    creado_por      UUID,
    CONSTRAINT pk_riesgos PRIMARY KEY (id),
    CONSTRAINT uq_riesgos_codigo UNIQUE (codigo),
    CONSTRAINT fk_ries_area FOREIGN KEY (area_id)
        REFERENCES sigc_unt.areas (id) ON DELETE RESTRICT,
    CONSTRAINT fk_ries_proceso FOREIGN KEY (proceso_id)
        REFERENCES sigc_unt.procesos (id) ON DELETE SET NULL,
    CONSTRAINT fk_ries_objetivo FOREIGN KEY (objetivo_estrategico_id)
        REFERENCES sigc_unt.objetivos_estrategicos (id) ON DELETE SET NULL,
    CONSTRAINT fk_ries_nivel FOREIGN KEY (nivel_riesgo_id)
        REFERENCES sigc_unt.niveles_riesgo (id) ON DELETE RESTRICT,
    CONSTRAINT fk_ries_responsable FOREIGN KEY (responsable_id)
        REFERENCES sigc_unt.usuarios (id) ON DELETE SET NULL,
    CONSTRAINT fk_ries_estado FOREIGN KEY (estado_id)
        REFERENCES sigc_unt.estados_flujo (id) ON DELETE RESTRICT,
    CONSTRAINT chk_ries_probabilidad CHECK (probabilidad BETWEEN 1 AND 5),
    CONSTRAINT chk_ries_impacto CHECK (impacto BETWEEN 1 AND 5),
    CONSTRAINT chk_ries_tipo CHECK (tipo_riesgo IN ('ESTRATEGICO','OPERACIONAL','FINANCIERO','LEGAL','REPUTACIONAL','TI','ACADEMICO'))
);
COMMENT ON TABLE sigc_unt.riesgos IS 'Matriz de riesgos institucional. Puntuación = probabilidad × impacto (campo generado).';

-- Planes de mitigación de riesgos
CREATE TABLE sigc_unt.planes_mitigacion (
    id              UUID         NOT NULL DEFAULT uuid_generate_v4(),
    riesgo_id       UUID         NOT NULL,
    tipo_respuesta  VARCHAR(20)  NOT NULL,        -- MITIGAR, ACEPTAR, TRANSFERIR, EVITAR
    descripcion     TEXT         NOT NULL,
    responsable_id  UUID,
    fecha_inicio    DATE,
    fecha_fin       DATE,
    estado_id       SMALLINT     NOT NULL,
    probabilidad_residual DECIMAL(3,1),
    impacto_residual      DECIMAL(3,1),
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    modificado_en   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_planes_mitigacion PRIMARY KEY (id),
    CONSTRAINT fk_pm_riesgo FOREIGN KEY (riesgo_id)
        REFERENCES sigc_unt.riesgos (id) ON DELETE CASCADE,
    CONSTRAINT fk_pm_responsable FOREIGN KEY (responsable_id)
        REFERENCES sigc_unt.usuarios (id) ON DELETE SET NULL,
    CONSTRAINT fk_pm_estado FOREIGN KEY (estado_id)
        REFERENCES sigc_unt.estados_flujo (id) ON DELETE RESTRICT,
    CONSTRAINT chk_pm_tipo CHECK (tipo_respuesta IN ('MITIGAR','ACEPTAR','TRANSFERIR','EVITAR'))
);

-- Seguimiento periódico de riesgos
CREATE TABLE sigc_unt.seguimientos_riesgo (
    id              BIGSERIAL    PRIMARY KEY,
    riesgo_id       UUID         NOT NULL,
    fecha_seguimiento DATE       NOT NULL DEFAULT CURRENT_DATE,
    probabilidad_actual DECIMAL(3,1) NOT NULL,
    impacto_actual     DECIMAL(3,1) NOT NULL,
    estado_control  VARCHAR(20)  NOT NULL,        -- EFECTIVO, PARCIALMENTE_EFECTIVO, INEFECTIVO
    observaciones   TEXT,
    registrado_por  UUID         NOT NULL,
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_sr_riesgo FOREIGN KEY (riesgo_id)
        REFERENCES sigc_unt.riesgos (id) ON DELETE RESTRICT,
    CONSTRAINT fk_sr_registrado FOREIGN KEY (registrado_por)
        REFERENCES sigc_unt.usuarios (id) ON DELETE RESTRICT
);

-- =============================================================================
-- SECCIÓN 11: MÓDULO GS - GESTIÓN DE LA SATISFACCIÓN
-- =============================================================================

-- Encuestas
CREATE TABLE sigc_unt.encuestas (
    id              UUID         NOT NULL DEFAULT uuid_generate_v4(),
    codigo          VARCHAR(20)  NOT NULL,
    titulo          VARCHAR(300) NOT NULL,
    descripcion     TEXT,
    poblacion_objetivo VARCHAR(30) NOT NULL,      -- ESTUDIANTE, DOCENTE, EGRESADO, ADMINISTRATIVO, EXTERNO
    programa_id     UUID,        -- NULL si aplica a toda la institución
    area_id         UUID,        -- Área responsable de la encuesta
    ciclo_academico VARCHAR(20),
    fecha_inicio    TIMESTAMPTZ,
    fecha_fin       TIMESTAMPTZ,
    estado_id       SMALLINT     NOT NULL,
    es_anonima      BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    modificado_en   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    creado_por      UUID,
    CONSTRAINT pk_encuestas PRIMARY KEY (id),
    CONSTRAINT uq_encuestas_codigo UNIQUE (codigo),
    CONSTRAINT fk_enc_programa FOREIGN KEY (programa_id)
        REFERENCES sigc_unt.programas_academicos (id) ON DELETE SET NULL,
    CONSTRAINT fk_enc_area FOREIGN KEY (area_id)
        REFERENCES sigc_unt.areas (id) ON DELETE SET NULL,
    CONSTRAINT fk_enc_estado FOREIGN KEY (estado_id)
        REFERENCES sigc_unt.estados_flujo (id) ON DELETE RESTRICT,
    CONSTRAINT chk_enc_poblacion CHECK (poblacion_objetivo IN ('ESTUDIANTE','DOCENTE','EGRESADO','ADMINISTRATIVO','EXTERNO','TODOS'))
);
COMMENT ON TABLE sigc_unt.encuestas IS 'Encuestas de satisfacción configurables por población objetivo.';

-- Secciones de encuesta
CREATE TABLE sigc_unt.secciones_encuesta (
    id              UUID         NOT NULL DEFAULT uuid_generate_v4(),
    encuesta_id     UUID         NOT NULL,
    titulo          VARCHAR(200) NOT NULL,
    descripcion     TEXT,
    orden           SMALLINT     NOT NULL DEFAULT 0,
    CONSTRAINT pk_secciones_encuesta PRIMARY KEY (id),
    CONSTRAINT fk_se_encuesta FOREIGN KEY (encuesta_id)
        REFERENCES sigc_unt.encuestas (id) ON DELETE CASCADE
);

-- Preguntas de encuesta
CREATE TABLE sigc_unt.preguntas_encuesta (
    id              UUID         NOT NULL DEFAULT uuid_generate_v4(),
    seccion_id      UUID         NOT NULL,
    tipo_id         SMALLINT     NOT NULL,
    texto           TEXT         NOT NULL,
    texto_ayuda     TEXT,
    obligatoria     BOOLEAN      NOT NULL DEFAULT TRUE,
    orden           SMALLINT     NOT NULL DEFAULT 0,
    configuracion   JSONB,                        -- Config según tipo: {min_escala, max_escala, etiquetas[], opciones[]}
    CONSTRAINT pk_preguntas_encuesta PRIMARY KEY (id),
    CONSTRAINT fk_pe_seccion FOREIGN KEY (seccion_id)
        REFERENCES sigc_unt.secciones_encuesta (id) ON DELETE CASCADE,
    CONSTRAINT fk_pe_tipo FOREIGN KEY (tipo_id)
        REFERENCES sigc_unt.tipos_pregunta (id) ON DELETE RESTRICT
);

-- Opciones para preguntas de selección múltiple
CREATE TABLE sigc_unt.opciones_pregunta (
    id              BIGSERIAL    PRIMARY KEY,
    pregunta_id     UUID         NOT NULL,
    texto           VARCHAR(300) NOT NULL,
    valor           VARCHAR(50),
    orden           SMALLINT     NOT NULL DEFAULT 0,
    CONSTRAINT fk_op_pregunta FOREIGN KEY (pregunta_id)
        REFERENCES sigc_unt.preguntas_encuesta (id) ON DELETE CASCADE
);

-- Participaciones en encuestas (trazabilidad sin violar anonimato)
CREATE TABLE sigc_unt.participaciones_encuesta (
    id              UUID         NOT NULL DEFAULT uuid_generate_v4(),
    encuesta_id     UUID         NOT NULL,
    usuario_id      UUID,        -- NULL si es anónima completamente
    token_anonimo   VARCHAR(64), -- Para encuestas anónimas: hash único sin usuario
    fecha_inicio    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    fecha_fin       TIMESTAMPTZ,
    completada      BOOLEAN      NOT NULL DEFAULT FALSE,
    ip_origen       INET,
    CONSTRAINT pk_participaciones_encuesta PRIMARY KEY (id),
    CONSTRAINT fk_part_encuesta FOREIGN KEY (encuesta_id)
        REFERENCES sigc_unt.encuestas (id) ON DELETE RESTRICT,
    CONSTRAINT fk_part_usuario FOREIGN KEY (usuario_id)
        REFERENCES sigc_unt.usuarios (id) ON DELETE SET NULL
);

-- Respuestas a preguntas (particionada por encuesta_id para escalabilidad)
-- Para alta volumen: considerar particionamiento por rango de fecha o hash de encuesta_id
CREATE TABLE sigc_unt.respuestas_encuesta (
    id              BIGSERIAL    PRIMARY KEY,
    participacion_id UUID        NOT NULL,
    pregunta_id     UUID         NOT NULL,
    valor_texto     TEXT,        -- Para preguntas abiertas
    valor_numerico  DECIMAL(10,2), -- Para Likert y escala
    opciones_seleccionadas JSONB, -- Para multiple choice: ["opcion_id1", "opcion_id2"]
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_re_participacion_pregunta UNIQUE (participacion_id, pregunta_id),
    CONSTRAINT fk_re_participacion FOREIGN KEY (participacion_id)
        REFERENCES sigc_unt.participaciones_encuesta (id) ON DELETE CASCADE,
    CONSTRAINT fk_re_pregunta FOREIGN KEY (pregunta_id)
        REFERENCES sigc_unt.preguntas_encuesta (id) ON DELETE RESTRICT
);
COMMENT ON TABLE sigc_unt.respuestas_encuesta IS 'Respuestas individuales. Diseñado para particionamiento futuro por año/ciclo.';

-- =============================================================================
-- SECCIÓN 12: TABLAS DE AUDITORÍA Y LOGS
-- =============================================================================

-- Log de auditoría del sistema (quién hizo qué, cuándo y desde dónde)
CREATE TABLE sigc_unt.log_auditoria_sistema (
    id              BIGSERIAL,
    usuario_id      UUID,
    accion          VARCHAR(20)  NOT NULL,        -- CREATE, UPDATE, DELETE, LOGIN, LOGOUT, APPROVE, REJECT
    entidad         VARCHAR(50)  NOT NULL,        -- Nombre de la tabla/entidad afectada
    entidad_id      TEXT,                         -- ID del registro (TEXT para soportar UUID y BIGINT)
    datos_anteriores JSONB,                       -- Valores antes del cambio (para UPDATE/DELETE)
    datos_nuevos    JSONB,                        -- Valores después del cambio
    ip_origen       INET,
    user_agent      TEXT,
    resultado       VARCHAR(10)  NOT NULL DEFAULT 'EXITO', -- EXITO, FALLIDO
    detalle_error   TEXT,
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_log_auditoria_sistema PRIMARY KEY (id, creado_en)
) PARTITION BY RANGE (creado_en);
COMMENT ON TABLE sigc_unt.log_auditoria_sistema IS 'Log de auditoría particionado por rango de fecha para gestión eficiente de volumen.';

-- Particiones del log de auditoría (crear anualmente o trimestralmente)
CREATE TABLE sigc_unt.log_auditoria_sistema_2025
    PARTITION OF sigc_unt.log_auditoria_sistema
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE sigc_unt.log_auditoria_sistema_2026
    PARTITION OF sigc_unt.log_auditoria_sistema
    FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

CREATE TABLE sigc_unt.log_auditoria_sistema_2027
    PARTITION OF sigc_unt.log_auditoria_sistema
    FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');

-- Log de sesiones de usuario
CREATE TABLE sigc_unt.log_sesiones (
    id              BIGSERIAL    PRIMARY KEY,
    usuario_id      UUID         NOT NULL,
    tipo_evento     VARCHAR(20)  NOT NULL,        -- LOGIN, LOGOUT, LOGIN_FALLIDO, BLOQUEO, DESBLOQUEO
    ip_origen       INET,
    user_agent      TEXT,
    duracion_minutos INTEGER,
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_ls_usuario FOREIGN KEY (usuario_id)
        REFERENCES sigc_unt.usuarios (id) ON DELETE RESTRICT
);

-- Notificaciones del sistema
CREATE TABLE sigc_unt.notificaciones (
    id              BIGSERIAL    PRIMARY KEY,
    usuario_id      UUID         NOT NULL,
    tipo            VARCHAR(30)  NOT NULL,        -- DOCUMENTO_APROBACION, CAPA_VENCIMIENTO, HALLAZGO_CIERRE, INDICADOR_ALERTA, etc.
    titulo          VARCHAR(200) NOT NULL,
    mensaje         TEXT         NOT NULL,
    url_accion      VARCHAR(500),
    leida           BOOLEAN      NOT NULL DEFAULT FALSE,
    fecha_lectura   TIMESTAMPTZ,
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_not_usuario FOREIGN KEY (usuario_id)
        REFERENCES sigc_unt.usuarios (id) ON DELETE CASCADE
);
COMMENT ON TABLE sigc_unt.notificaciones IS 'Centro de notificaciones in-app para alertas de workflows y vencimientos.';

-- =============================================================================
-- SECCIÓN 13: ÍNDICES ESTRATÉGICOS
-- =============================================================================

-- Usuarios
CREATE INDEX idx_usuarios_email ON sigc_unt.usuarios (email) WHERE eliminado_en IS NULL;
CREATE INDEX idx_usuarios_area ON sigc_unt.usuarios (area_id) WHERE esta_activo = TRUE;
CREATE INDEX idx_usuarios_tipo ON sigc_unt.usuarios (tipo_usuario) WHERE esta_activo = TRUE;

-- Documentos (búsqueda frecuente)
CREATE INDEX idx_documentos_codigo ON sigc_unt.documentos (codigo);
CREATE INDEX idx_documentos_tipo_estado ON sigc_unt.documentos (tipo_documento_id, estado_id);
CREATE INDEX idx_documentos_area ON sigc_unt.documentos (area_id) WHERE esta_activo = TRUE;
CREATE INDEX idx_documentos_palabras_clave ON sigc_unt.documentos USING GIN (palabras_clave);
-- Índice para búsqueda full-text en título
CREATE INDEX idx_documentos_titulo_trgm ON sigc_unt.documentos USING GIN (titulo gin_trgm_ops);

-- Procesos
CREATE INDEX idx_procesos_macroproceso ON sigc_unt.procesos (macroproceso_id);
CREATE INDEX idx_procesos_area ON sigc_unt.procesos (area_responsable_id);

-- Indicadores y mediciones
CREATE INDEX idx_mediciones_indicador_periodo ON sigc_unt.mediciones_indicador (indicador_id, periodo_fin DESC);
CREATE INDEX idx_mediciones_semaforo ON sigc_unt.mediciones_indicador (estado_semaforo) WHERE estado_semaforo <> 'VERDE';

-- Auditorías
CREATE INDEX idx_auditorias_plan_estado ON sigc_unt.auditorias (plan_id, estado_id);
CREATE INDEX idx_auditorias_area ON sigc_unt.auditorias (area_auditada_id);
CREATE INDEX idx_hallazgos_auditoria ON sigc_unt.hallazgos (auditoria_id);
CREATE INDEX idx_hallazgos_estado ON sigc_unt.hallazgos (estado_id) WHERE fecha_cierre_real IS NULL;

-- CAPA
CREATE INDEX idx_nc_estado ON sigc_unt.no_conformidades (estado_id);
CREATE INDEX idx_nc_area ON sigc_unt.no_conformidades (area_id);
CREATE INDEX idx_acciones_capa_responsable ON sigc_unt.acciones_capa (responsable_id, estado_id);
CREATE INDEX idx_acciones_capa_fecha_compromiso ON sigc_unt.acciones_capa (fecha_compromiso) WHERE fecha_real_cierre IS NULL;

-- Riesgos
CREATE INDEX idx_riesgos_area_nivel ON sigc_unt.riesgos (area_id, nivel_riesgo_id);
CREATE INDEX idx_riesgos_puntuacion ON sigc_unt.riesgos (puntuacion DESC) WHERE activo = TRUE;

-- Encuestas y respuestas
CREATE INDEX idx_encuestas_poblacion_estado ON sigc_unt.encuestas (poblacion_objetivo, estado_id);
CREATE INDEX idx_participaciones_encuesta ON sigc_unt.participaciones_encuesta (encuesta_id, completada);
CREATE INDEX idx_respuestas_encuesta_participacion ON sigc_unt.respuestas_encuesta (participacion_id);

-- Log de auditoría
CREATE INDEX idx_log_auditoria_usuario ON sigc_unt.log_auditoria_sistema (usuario_id, creado_en DESC);
CREATE INDEX idx_log_auditoria_entidad ON sigc_unt.log_auditoria_sistema (entidad, entidad_id);

-- Acreditación
CREATE INDEX idx_autoevaluaciones_proceso ON sigc_unt.autoevaluaciones (proceso_acreditacion_id);
CREATE INDEX idx_evidencias_entidad ON sigc_unt.evidencias (entidad_tipo, entidad_id);

-- Notificaciones
CREATE INDEX idx_notificaciones_usuario_leida ON sigc_unt.notificaciones (usuario_id, leida) WHERE leida = FALSE;

-- =============================================================================
-- SECCIÓN 14: TRIGGERS DE AUDITORÍA AUTOMÁTICA
-- =============================================================================

-- Trigger para usuarios
CREATE TRIGGER trg_usuarios_modificado_en
    BEFORE UPDATE ON sigc_unt.usuarios
    FOR EACH ROW EXECUTE FUNCTION sigc_unt.fn_actualizar_modificado_en();

-- Trigger para áreas
CREATE TRIGGER trg_areas_modificado_en
    BEFORE UPDATE ON sigc_unt.areas
    FOR EACH ROW EXECUTE FUNCTION sigc_unt.fn_actualizar_modificado_en();

-- Trigger para documentos
CREATE TRIGGER trg_documentos_modificado_en
    BEFORE UPDATE ON sigc_unt.documentos
    FOR EACH ROW EXECUTE FUNCTION sigc_unt.fn_actualizar_modificado_en();

-- Trigger para procesos
CREATE TRIGGER trg_procesos_modificado_en
    BEFORE UPDATE ON sigc_unt.procesos
    FOR EACH ROW EXECUTE FUNCTION sigc_unt.fn_actualizar_modificado_en();

-- Trigger para indicadores
CREATE TRIGGER trg_indicadores_modificado_en
    BEFORE UPDATE ON sigc_unt.indicadores
    FOR EACH ROW EXECUTE FUNCTION sigc_unt.fn_actualizar_modificado_en();

-- Trigger para acciones CAPA
CREATE TRIGGER trg_acciones_capa_modificado_en
    BEFORE UPDATE ON sigc_unt.acciones_capa
    FOR EACH ROW EXECUTE FUNCTION sigc_unt.fn_actualizar_modificado_en();

-- Trigger para riesgos
CREATE TRIGGER trg_riesgos_modificado_en
    BEFORE UPDATE ON sigc_unt.riesgos
    FOR EACH ROW EXECUTE FUNCTION sigc_unt.fn_actualizar_modificado_en();

-- Trigger para autoevaluaciones
CREATE TRIGGER trg_autoevaluaciones_modificado_en
    BEFORE UPDATE ON sigc_unt.autoevaluaciones
    FOR EACH ROW EXECUTE FUNCTION sigc_unt.fn_actualizar_modificado_en();

-- Trigger para encuestas
CREATE TRIGGER trg_encuestas_modificado_en
    BEFORE UPDATE ON sigc_unt.encuestas
    FOR EACH ROW EXECUTE FUNCTION sigc_unt.fn_actualizar_modificado_en();

-- Trigger para auditorías
CREATE TRIGGER trg_auditorias_modificado_en
    BEFORE UPDATE ON sigc_unt.auditorias
    FOR EACH ROW EXECUTE FUNCTION sigc_unt.fn_actualizar_modificado_en();

-- =============================================================================
-- SECCIÓN 15: FUNCIÓN DE SEMÁFORO AUTOMÁTICO PARA INDICADORES
-- =============================================================================

CREATE OR REPLACE FUNCTION sigc_unt.fn_calcular_semaforo_indicador()
RETURNS TRIGGER AS $$
DECLARE
    v_indicador sigc_unt.indicadores%ROWTYPE;
    v_porcentaje DECIMAL;
BEGIN
    SELECT * INTO v_indicador FROM sigc_unt.indicadores WHERE id = NEW.indicador_id;
    
    IF v_indicador.meta_valor IS NOT NULL AND v_indicador.meta_valor <> 0 THEN
        v_porcentaje := (NEW.valor_real / v_indicador.meta_valor) * 100;
        
        IF v_indicador.tipo_tendencia = 'MAYOR' THEN
            IF v_porcentaje >= 95 THEN NEW.estado_semaforo := 'VERDE';
            ELSIF v_porcentaje >= 80 THEN NEW.estado_semaforo := 'AMARILLO';
            ELSE NEW.estado_semaforo := 'ROJO';
            END IF;
        ELSIF v_indicador.tipo_tendencia = 'MENOR' THEN
            IF v_porcentaje <= 105 THEN NEW.estado_semaforo := 'VERDE';
            ELSIF v_porcentaje <= 120 THEN NEW.estado_semaforo := 'AMARILLO';
            ELSE NEW.estado_semaforo := 'ROJO';
            END IF;
        END IF;
    END IF;
    
    NEW.valor_meta := v_indicador.meta_valor;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_mediciones_semaforo
    BEFORE INSERT OR UPDATE ON sigc_unt.mediciones_indicador
    FOR EACH ROW EXECUTE FUNCTION sigc_unt.fn_calcular_semaforo_indicador();

-- =============================================================================
-- SECCIÓN 16: PROCEDIMIENTOS ALMACENADOS PARA REPORTES
-- =============================================================================

-- Reporte de resumen ejecutivo del SGC
CREATE OR REPLACE FUNCTION sigc_unt.fn_dashboard_ejecutivo(p_fecha DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    total_documentos        BIGINT,
    documentos_vigentes     BIGINT,
    documentos_por_aprobar  BIGINT,
    total_auditorias_anio   BIGINT,
    hallazgos_abiertos      BIGINT,
    nc_abiertas             BIGINT,
    acciones_vencidas       BIGINT,
    riesgos_criticos        BIGINT,
    indicadores_en_rojo     BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM sigc_unt.documentos WHERE esta_activo = TRUE)::BIGINT,
        (SELECT COUNT(*) FROM sigc_unt.documentos d
         JOIN sigc_unt.estados_flujo ef ON d.estado_id = ef.id
         WHERE ef.codigo = 'PUBLICADO' AND d.esta_activo = TRUE)::BIGINT,
        (SELECT COUNT(*) FROM sigc_unt.documentos d
         JOIN sigc_unt.estados_flujo ef ON d.estado_id = ef.id
         WHERE ef.codigo IN ('EN_REVISION','BORRADOR') AND d.esta_activo = TRUE)::BIGINT,
        (SELECT COUNT(*) FROM sigc_unt.auditorias a
         WHERE EXTRACT(YEAR FROM a.fecha_programada_inicio) = EXTRACT(YEAR FROM p_fecha))::BIGINT,
        (SELECT COUNT(*) FROM sigc_unt.hallazgos h
         JOIN sigc_unt.estados_flujo ef ON h.estado_id = ef.id
         WHERE ef.codigo NOT IN ('CERRADO') )::BIGINT,
        (SELECT COUNT(*) FROM sigc_unt.no_conformidades nc
         JOIN sigc_unt.estados_flujo ef ON nc.estado_id = ef.id
         WHERE ef.codigo NOT IN ('CERRADO'))::BIGINT,
        (SELECT COUNT(*) FROM sigc_unt.acciones_capa ac
         WHERE ac.fecha_compromiso < p_fecha AND ac.fecha_real_cierre IS NULL)::BIGINT,
        (SELECT COUNT(*) FROM sigc_unt.riesgos r
         JOIN sigc_unt.niveles_riesgo nr ON r.nivel_riesgo_id = nr.id
         WHERE nr.codigo = 'CRITICO' AND r.activo = TRUE)::BIGINT,
        (SELECT COUNT(*) FROM sigc_unt.mediciones_indicador mi
         WHERE mi.estado_semaforo = 'ROJO'
         AND mi.fecha_registro >= DATE_TRUNC('month', p_fecha))::BIGINT;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- SECCIÓN 17: DATOS SEMILLA (SEED DATA)
-- =============================================================================

-- Roles del sistema
INSERT INTO sigc_unt.roles (codigo, nombre, descripcion, nivel_jerarquia) VALUES
('SUPERADMIN',          'Super Administrador',          'Acceso total al sistema. Solo para TI institucional.', 1),
('ADMIN_CALIDAD',       'Administrador de Calidad',     'Gestión completa del SGC: módulos, usuarios, configuración.', 2),
('DIRECTOR_CALIDAD',    'Director de Calidad',          'Acceso estratégico, aprobaciones, revisión por la dirección.', 3),
('AUDITOR_LIDER',       'Auditor Líder',                'Planificación y ejecución de auditorías internas.', 4),
('AUDITOR',             'Auditor',                      'Ejecución de auditorías, registro de hallazgos.', 5),
('JEFE_AREA',           'Jefe de Área',                 'Gestión de documentos, indicadores y CAPA de su área.', 6),
('RESPONSABLE_PROCESO', 'Responsable de Proceso',       'Gestión del proceso asignado: documentos, indicadores.', 7),
('DIGITADOR',           'Digitador de Datos',           'Ingreso de mediciones, respuestas de formularios.', 8),
('CONSULTA',            'Usuario de Consulta',          'Solo lectura en módulos autorizados.', 9);

-- Estados de flujo para cada módulo
INSERT INTO sigc_unt.estados_flujo (modulo, codigo, nombre, color_hex, es_final, orden) VALUES
-- Módulo Gestión Documental
('GD', 'BORRADOR',      'Borrador',       '#94A3B8', FALSE, 1),
('GD', 'EN_REVISION',   'En Revisión',    '#F59E0B', FALSE, 2),
('GD', 'APROBADO',      'Aprobado',       '#3B82F6', FALSE, 3),
('GD', 'PUBLICADO',     'Publicado',      '#10B981', FALSE, 4),
('GD', 'OBSOLETO',      'Obsoleto',       '#EF4444', TRUE,  5),
('GD', 'ARCHIVADO',     'Archivado',      '#6B7280', TRUE,  6),
-- Módulo Auditorías
('AI', 'PROGRAMADA',    'Programada',     '#94A3B8', FALSE, 1),
('AI', 'EN_EJECUCION',  'En Ejecución',   '#F59E0B', FALSE, 2),
('AI', 'FINALIZADA',    'Finalizada',     '#3B82F6', FALSE, 3),
('AI', 'INFORME_EMITIDO','Informe Emitido','#10B981', FALSE, 4),
('AI', 'CERRADA',       'Cerrada',        '#6B7280', TRUE,  5),
('AI', 'CANCELADA',     'Cancelada',      '#EF4444', TRUE,  6),
-- Módulo Hallazgos
('HALL', 'ABIERTO',     'Abierto',        '#EF4444', FALSE, 1),
('HALL', 'EN_PROCESO',  'En Proceso',     '#F59E0B', FALSE, 2),
('HALL', 'CERRADO',     'Cerrado',        '#10B981', TRUE,  3),
('HALL', 'CERRADO_OBS', 'Cerrado con Observación', '#3B82F6', TRUE, 4),
-- Módulo CAPA
('CAPA', 'IDENTIFICADA', 'Identificada',  '#EF4444', FALSE, 1),
('CAPA', 'ANALISIS',    'En Análisis',    '#F97316', FALSE, 2),
('CAPA', 'PLAN_ACCION', 'Plan de Acción', '#F59E0B', FALSE, 3),
('CAPA', 'EN_EJECUCION','En Ejecución',   '#3B82F6', FALSE, 4),
('CAPA', 'VERIFICACION','En Verificación','#8B5CF6', FALSE, 5),
('CAPA', 'CERRADA',     'Cerrada',        '#10B981', TRUE,  6),
('CAPA', 'CERRADA_INEF','Cerrada Inefectiva','#EF4444', TRUE, 7),
-- Módulo Riesgos
('GR',  'IDENTIFICADO', 'Identificado',   '#F59E0B', FALSE, 1),
('GR',  'EN_TRATAMIENTO','En Tratamiento','#3B82F6', FALSE, 2),
('GR',  'CONTROLADO',   'Controlado',     '#10B981', FALSE, 3),
('GR',  'MATERIALIZADO','Materializado',  '#EF4444', FALSE, 4),
('GR',  'CERRADO',      'Cerrado',        '#6B7280', TRUE,  5),
-- Módulo Acreditación
('AA',  'PLANIFICACION','Planificación',  '#94A3B8', FALSE, 1),
('AA',  'AUTOEVALUACION','Autoevaluación','#F59E0B', FALSE, 2),
('AA',  'INFORME_PREVIO','Informe Previo','#3B82F6', FALSE, 3),
('AA',  'VISITA_EXTERNA','Visita Externa','#8B5CF6', FALSE, 4),
('AA',  'ACREDITADO',   'Acreditado',     '#10B981', TRUE,  5),
('AA',  'NO_ACREDITADO','No Acreditado',  '#EF4444', TRUE,  6),
-- Módulo Encuestas
('GS',  'DISENO',       'En Diseño',      '#94A3B8', FALSE, 1),
('GS',  'ACTIVA',       'Activa',         '#10B981', FALSE, 2),
('GS',  'CERRADA',      'Cerrada',        '#3B82F6', TRUE,  3),
('GS',  'ANULADA',      'Anulada',        '#EF4444', TRUE,  4),
-- Módulo Procesos
('MP',  'BORRADOR',     'Borrador',       '#94A3B8', FALSE, 1),
('MP',  'VIGENTE',      'Vigente',        '#10B981', FALSE, 2),
('MP',  'EN_REVISION',  'En Revisión',    '#F59E0B', FALSE, 3),
('MP',  'OBSOLETO',     'Obsoleto',       '#6B7280', TRUE,  4);

-- Tipos de documento
INSERT INTO sigc_unt.tipos_documento (codigo, nombre, descripcion, prefijo, requiere_aprobacion) VALUES
('POL', 'Política',               'Declaraciones de intención y dirección de la organización.',    'POL', TRUE),
('MAN', 'Manual',                 'Documentos que establecen el sistema de gestión.',              'MAN', TRUE),
('PRO', 'Procedimiento',          'Forma específica de llevar a cabo una actividad o proceso.',    'PRO', TRUE),
('INS', 'Instructivo',            'Descripción detallada de cómo realizar una tarea.',             'INS', TRUE),
('FOR', 'Formato/Formulario',     'Plantilla para el registro de datos.',                          'FOR', FALSE),
('REG', 'Registro',               'Evidencia de actividades realizadas o resultados obtenidos.',   'REG', FALSE),
('PLA', 'Plan',                   'Documentos de planificación de actividades o proyectos.',       'PLA', TRUE),
('GUI', 'Guía',                   'Orientaciones o recomendaciones no normativas.',                'GUI', FALSE),
('PER', 'Perfil',                 'Perfiles de puestos o competencias.',                           'PER', FALSE),
('EXT', 'Documento Externo',      'Normas, leyes, reglamentos externos referenciados.',            'EXT', FALSE);

-- Tipos de hallazgo
INSERT INTO sigc_unt.tipos_hallazgo (codigo, nombre, descripcion, severidad) VALUES
('OM',     'Oportunidad de Mejora',       'Mejora potencial sin incumplimiento.',                              1),
('OBS',    'Observación',                 'Situación que podría convertirse en NC si no se atiende.',         2),
('NC_MEN', 'No Conformidad Menor',        'Incumplimiento puntual o de baja frecuencia.',                     3),
('NC_MAY', 'No Conformidad Mayor',        'Incumplimiento sistemático o crítico del SGC.',                    4);

-- Niveles de riesgo
INSERT INTO sigc_unt.niveles_riesgo (codigo, nombre, rango_min, rango_max, color_hex, accion_requerida) VALUES
('BAJO',    'Bajo',     1.0,  4.9,  '#10B981', 'Monitoreo periódico anual.'),
('MEDIO',   'Medio',    5.0,  9.9,  '#F59E0B', 'Plan de tratamiento semestral. Monitoreo trimestral.'),
('ALTO',    'Alto',     10.0, 14.9, '#F97316', 'Plan de tratamiento inmediato. Monitoreo mensual.'),
('CRITICO', 'Crítico',  15.0, 25.0, '#EF4444', 'Acción urgente. Escalar a Rectorado. Monitoreo semanal.');

-- Tipos de auditoría
INSERT INTO sigc_unt.tipos_auditoria (codigo, nombre, descripcion) VALUES
('INT',     'Interna',             'Auditoría realizada por equipo interno de la UNT.'),
('EXT',     'Externa',            'Auditoría realizada por organismo externo o certificador.'),
('SEG',     'Seguimiento',        'Auditoría de seguimiento a hallazgos anteriores.'),
('CERT',    'Certificación',      'Auditoría para obtención/renovación de certificación.'),
('INIC',    'Inicial de Línea Base','Primera auditoría para establecer estado inicial del SGC.');

-- Tipos de pregunta para encuestas
INSERT INTO sigc_unt.tipos_pregunta (codigo, nombre, descripcion, tiene_opciones) VALUES
('LIKERT',    'Escala Likert',         'Escala de acuerdo (1-5 o 1-7).',              FALSE),
('ESCALA',    'Escala Numérica',       'Puntuación en rango numérico configurable.',  FALSE),
('OPCION_M',  'Opción Múltiple',       'Selección de una opción entre varias.',       TRUE),
('MULTI_SEL', 'Selección Múltiple',    'Selección de varias opciones.',               TRUE),
('TEXTO_C',   'Texto Corto',           'Respuesta de texto libre corto.',             FALSE),
('TEXTO_L',   'Texto Largo',           'Respuesta abierta extensa.',                  FALSE),
('MATRIZ',    'Matriz de Evaluación',  'Tabla con filas y escala de columnas.',       TRUE),
('BINARIA',   'Sí / No',              'Respuesta dicotómica.',                        FALSE),
('FECHA',     'Fecha',                 'Selección de fecha.',                          FALSE);

-- Métodos de análisis de causa raíz
INSERT INTO sigc_unt.metodos_causa_raiz (codigo, nombre, descripcion) VALUES
('5_PORQUES',  '5 Porqués',              'Técnica iterativa de preguntar "¿por qué?" 5 veces.'),
('ISHIKAWA',   'Diagrama de Ishikawa',   'Diagrama causa-efecto con categorías (6M).'),
('PARETO',     'Análisis de Pareto',     'Identificación del 20% de causas que generan el 80% del problema.'),
('FTA',        'Árbol de Fallas (FTA)',  'Análisis deductivo de causas en árbol lógico.'),
('8D',         'Metodología 8D',         '8 disciplinas para resolución sistemática de problemas.'),
('HIPOTESIS',  'Análisis de Hipótesis',  'Formulación y validación de hipótesis causales.');

-- Frecuencias de medición
INSERT INTO sigc_unt.frecuencias_medicion (codigo, nombre, dias_periodo) VALUES
('DIARIA',     'Diaria',       1),
('SEMANAL',    'Semanal',      7),
('QUINCENAL',  'Quincenal',    15),
('MENSUAL',    'Mensual',      30),
('BIMESTRAL',  'Bimestral',    60),
('TRIMESTRAL', 'Trimestral',   90),
('SEMESTRAL',  'Semestral',    180),
('ANUAL',      'Anual',        365);

-- Estándares de acreditación
INSERT INTO sigc_unt.estandares_acreditacion (codigo, nombre, organismo, version, descripcion) VALUES
('ISO_21001',  'ISO 21001:2018 - SGOE',                    'ISO',     '2018', 'Sistemas de Gestión para Organizaciones Educativas.'),
('ISO_9001',   'ISO 9001:2015 - SGC',                      'ISO',     '2015', 'Sistemas de Gestión de la Calidad - Requisitos.'),
('SINEACE_SUP','SINEACE - Modelo de Acreditación Superior', 'SINEACE', '2022', 'Modelo de acreditación para programas de educación superior universitaria del Perú.'),
('SINEACE_INST','SINEACE - Acreditación Institucional',     'SINEACE', '2022', 'Modelo de acreditación institucional para universidades peruanas.'),
('ABET_EAC',   'ABET EAC - Ingeniería',                    'ABET',    '2023', 'Acreditación para programas de ingeniería y tecnología.'),
('CNA_COL',    'CNA Colombia - Alta Calidad',               'CNA',     '2020', 'Consejo Nacional de Acreditación de Colombia.');

-- Facultades base de la UNT
INSERT INTO sigc_unt.facultades (codigo, nombre, nombre_corto) VALUES
('FAC-AGA',  'Facultad de Agronomía',                           'Agronomía'),
('FAC-AGB',  'Facultad de Agrobiotecnología',                   'Agrobiotecnología'),
('FAC-ART',  'Facultad de Arte y Diseño Gráfico',               'Arte'),
('FAC-BIO',  'Facultad de Ciencias Biológicas',                 'Biológicas'),
('FAC-CC',   'Facultad de Ciencias de la Comunicación',         'Comunicación'),
('FAC-CCF',  'Facultad de Ciencias Físico-Matemáticas',         'Físico-Mat.'),
('FAC-CCS',  'Facultad de Ciencias Sociales',                   'Sociales'),
('FAC-DER',  'Facultad de Derecho y Ciencias Políticas',        'Derecho'),
('FAC-ECO',  'Facultad de Ciencias Económicas',                 'Economía'),
('FAC-EDU',  'Facultad de Educación y Ciencias de la Comunicación','Educación'),
('FAC-ENF',  'Facultad de Enfermería',                          'Enfermería'),
('FAC-FAR',  'Facultad de Farmacia y Bioquímica',               'Farmacia'),
('FAC-IND',  'Facultad de Ingeniería Industrial',               'Ing. Industrial'),
('FAC-INF',  'Facultad de Ingeniería de Sistemas',              'Sistemas'),
('FAC-MED',  'Facultad de Medicina',                            'Medicina'),
('FAC-MET',  'Facultad de Ingeniería Metalúrgica',              'Metalurgia'),
('FAC-MIN',  'Facultad de Ingeniería de Minas',                 'Minas'),
('FAC-ODO',  'Facultad de Estomatología',                       'Estomatología'),
('FAC-PES',  'Facultad de Ingeniería Pesquera',                 'Pesquera'),
('FAC-PSI',  'Facultad de Psicología',                          'Psicología'),
('FAC-QUI',  'Facultad de Ingeniería Química',                  'Ing. Química'),
('FAC-ZOO',  'Facultad de Ciencias Veterinarias',               'Veterinaria'),
('EPG',      'Escuela de Postgrado',                            'Postgrado');

-- Áreas organizacionales centrales de la UNT
INSERT INTO sigc_unt.areas (codigo, nombre, nombre_corto, tipo_area) VALUES
('REC',    'Rectorado',                                   'Rectorado',           'RECTORADO'),
('VRA',    'Vicerrectorado Académico',                    'Vicerrector. Acad.',  'VICERRECTORADO'),
('VRI',    'Vicerrectorado de Investigación',             'Vicerrector. Inv.',   'VICERRECTORADO'),
('DGA',    'Dirección General de Administración',         'D.G.Adm.',            'DIRECCION'),
('OCAL',   'Oficina Central de Calidad Universitaria',   'Of.Calidad',          'OFICINA'),
('OAI',    'Oficina de Auditoría Interna',                'Aud.Interna',         'OFICINA'),
('OACT',   'Oficina de Acreditación y Certificación',    'Acreditación',        'OFICINA'),
('DTIC',   'Dirección de Tecnologías de Información',    'DTIC',                'DIRECCION'),
('DRRHH',  'Dirección de Recursos Humanos',               'RRHH',                'DIRECCION'),
('DBI',    'Dirección de Bienestar Universitario',        'Bienestar',           'DIRECCION'),
('DMAT',   'Dirección de Infraestructura y Mantenimiento','Infraestructura',     'DIRECCION'),
('DSE',    'Dirección de Servicios Estudiantiles',        'Serv.Estudiantiles',  'DIRECCION');

-- Usuario superadmin inicial (password: 'Admin@UNT2025!' hasheado con bcrypt rounds=12)
-- IMPORTANTE: Cambiar inmediatamente después del primer login
INSERT INTO sigc_unt.usuarios (
    codigo_usuario, username, email, password_hash,
    nombres, apellidos, tipo_usuario, cargo, esta_activo
) VALUES (
    'SIGC-001',
    'superadmin',
    'calidad@unitru.edu.pe',
    '$2b$12$RBOrsKwUiJ43tIyUOrzKxefsvcJlSOjqlfZbTeglC48R/FTup/60m',
    'Administrador',
    'Sistema SIGC-UNT',
    'ADMINISTRATIVO',
    'Administrador del Sistema de Gestión de Calidad',
    TRUE
);

-- Asignar rol superadmin al usuario inicial
INSERT INTO sigc_unt.usuarios_roles (usuario_id, rol_id)
SELECT u.id, r.id
FROM sigc_unt.usuarios u, sigc_unt.roles r
WHERE u.username = 'superadmin' AND r.codigo = 'SUPERADMIN';

-- Macroprocesos base de la UNT
INSERT INTO sigc_unt.macroprocesos (codigo, nombre, tipo, orden) VALUES
('MP-EST-01', 'Dirección Estratégica y Gobierno Universitario',   'ESTRATEGICO', 1),
('MP-EST-02', 'Planificación y Aseguramiento de la Calidad',      'ESTRATEGICO', 2),
('MP-MIS-01', 'Formación Académica de Pregrado',                  'MISIONAL',    1),
('MP-MIS-02', 'Formación Académica de Postgrado',                 'MISIONAL',    2),
('MP-MIS-03', 'Investigación, Desarrollo e Innovación',           'MISIONAL',    3),
('MP-MIS-04', 'Responsabilidad Social y Extensión Universitaria', 'MISIONAL',    4),
('MP-SOP-01', 'Gestión del Talento Humano',                       'SOPORTE',     1),
('MP-SOP-02', 'Gestión Administrativa y Financiera',              'SOPORTE',     2),
('MP-SOP-03', 'Gestión de Tecnologías de Información',            'SOPORTE',     3),
('MP-SOP-04', 'Gestión de Infraestructura y Mantenimiento',       'SOPORTE',     4),
('MP-SOP-05', 'Gestión Documentaria y Archivística',              'SOPORTE',     5);

-- =============================================================================
-- SECCIÓN 18: VISTAS ÚTILES PARA CONSULTAS FRECUENTES
-- =============================================================================

-- Vista de documentos vigentes con información completa
CREATE OR REPLACE VIEW sigc_unt.v_documentos_vigentes AS
SELECT
    d.id,
    d.codigo,
    d.titulo,
    td.nombre AS tipo_documento,
    a.nombre AS area_propietaria,
    p.nombre AS proceso,
    d.version_actual,
    ef.nombre AS estado,
    d.palabras_clave,
    d.creado_en,
    d.modificado_en,
    u.nombres || ' ' || u.apellidos AS creado_por
FROM sigc_unt.documentos d
JOIN sigc_unt.tipos_documento td ON d.tipo_documento_id = td.id
JOIN sigc_unt.areas a ON d.area_id = a.id
JOIN sigc_unt.estados_flujo ef ON d.estado_id = ef.id
LEFT JOIN sigc_unt.procesos p ON d.proceso_id = p.id
LEFT JOIN sigc_unt.usuarios u ON d.creado_por = u.id
WHERE ef.codigo = 'PUBLICADO' AND d.esta_activo = TRUE AND d.eliminado_en IS NULL;

-- Vista de resumen de riesgos por área
CREATE OR REPLACE VIEW sigc_unt.v_resumen_riesgos AS
SELECT
    a.nombre AS area,
    nr.nombre AS nivel_riesgo,
    COUNT(r.id) AS cantidad,
    AVG(r.puntuacion) AS puntuacion_promedio
FROM sigc_unt.riesgos r
JOIN sigc_unt.areas a ON r.area_id = a.id
JOIN sigc_unt.niveles_riesgo nr ON r.nivel_riesgo_id = nr.id
WHERE r.activo = TRUE
GROUP BY a.nombre, nr.nombre, nr.rango_min
ORDER BY a.nombre, nr.rango_min DESC;

-- Vista de acciones CAPA vencidas o próximas a vencer
CREATE OR REPLACE VIEW sigc_unt.v_capa_alertas AS
SELECT
    ac.id,
    nc.codigo AS codigo_nc,
    nc.descripcion AS descripcion_nc,
    ac.tipo_accion,
    ac.descripcion AS descripcion_accion,
    a.nombre AS area,
    u.nombres || ' ' || u.apellidos AS responsable,
    ac.fecha_compromiso,
    CURRENT_DATE - ac.fecha_compromiso AS dias_vencido,
    ac.porcentaje_avance,
    ef.nombre AS estado
FROM sigc_unt.acciones_capa ac
JOIN sigc_unt.no_conformidades nc ON ac.nc_id = nc.id
JOIN sigc_unt.areas a ON ac.area_id = a.id
JOIN sigc_unt.usuarios u ON ac.responsable_id = u.id
JOIN sigc_unt.estados_flujo ef ON ac.estado_id = ef.id
WHERE ac.fecha_real_cierre IS NULL
  AND ac.fecha_compromiso <= CURRENT_DATE + INTERVAL '15 days'
ORDER BY ac.fecha_compromiso ASC;

-- =============================================================================
-- FIN DEL SCRIPT
-- SIGC-UNT v1.0.0 | Universidad Nacional de Trujillo
-- Total de tablas: ~45 tablas + particiones
-- Total de índices: ~25 índices estratégicos
-- Esquema: sigc_unt
-- =============================================================================
