// prisma/seed.ts
// Datos semilla del SIGC-UNT
// Ejecutar con: npx ts-node prisma/seed.ts

import { Prisma, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed del SIGC-UNT...\n');
  const now = new Date();
  const anioActual = now.getFullYear();

  // ═══════════════════════════════════════
  // 1. ROLES
  // ═══════════════════════════════════════
  console.log('→ Roles...');
  const rolesData = [
    { codigo: 'SUPERADMIN',          nombre: 'Super Administrador',        nivel_jerarquia: 1 },
    { codigo: 'ADMIN_CALIDAD',       nombre: 'Administrador de Calidad',   nivel_jerarquia: 2 },
    { codigo: 'DIRECTOR_CALIDAD',    nombre: 'Director de Calidad',        nivel_jerarquia: 3 },
    { codigo: 'AUDITOR_LIDER',       nombre: 'Auditor Líder',              nivel_jerarquia: 4 },
    { codigo: 'AUDITOR',             nombre: 'Auditor',                    nivel_jerarquia: 5 },
    { codigo: 'JEFE_AREA',           nombre: 'Jefe de Área',               nivel_jerarquia: 6 },
    { codigo: 'RESPONSABLE_PROCESO', nombre: 'Responsable de Proceso',     nivel_jerarquia: 7 },
    { codigo: 'DIGITADOR',           nombre: 'Digitador de Datos',         nivel_jerarquia: 8 },
    { codigo: 'CONSULTA',            nombre: 'Usuario de Consulta',        nivel_jerarquia: 9 },
  ];
  for (const r of rolesData) {
    await prisma.roles.upsert({
      where: { codigo: r.codigo },
      update: {},
      create: r,
    });
  }

  // ═══════════════════════════════════════
  // 2. ESTADOS DE FLUJO
  // ═══════════════════════════════════════
  console.log('→ Estados de flujo...');
  const estadosData = [
    // GD
    { modulo: 'GD', codigo: 'BORRADOR',       nombre: 'Borrador',           color_hex: '#94A3B8', es_final: false, orden: 1 },
    { modulo: 'GD', codigo: 'EN_REVISION',    nombre: 'En Revisión',        color_hex: '#F59E0B', es_final: false, orden: 2 },
    { modulo: 'GD', codigo: 'APROBADO',       nombre: 'Aprobado',           color_hex: '#3B82F6', es_final: false, orden: 3 },
    { modulo: 'GD', codigo: 'PUBLICADO',      nombre: 'Publicado',          color_hex: '#10B981', es_final: false, orden: 4 },
    { modulo: 'GD', codigo: 'OBSOLETO',       nombre: 'Obsoleto',           color_hex: '#EF4444', es_final: true,  orden: 5 },
    { modulo: 'GD', codigo: 'ARCHIVADO',      nombre: 'Archivado',          color_hex: '#6B7280', es_final: true,  orden: 6 },
    // AI
    { modulo: 'AI', codigo: 'PROGRAMADA',     nombre: 'Programada',         color_hex: '#94A3B8', es_final: false, orden: 1 },
    { modulo: 'AI', codigo: 'EN_EJECUCION',   nombre: 'En Ejecución',       color_hex: '#F59E0B', es_final: false, orden: 2 },
    { modulo: 'AI', codigo: 'FINALIZADA',     nombre: 'Finalizada',         color_hex: '#3B82F6', es_final: false, orden: 3 },
    { modulo: 'AI', codigo: 'INFORME_EMITIDO',nombre: 'Informe Emitido',    color_hex: '#10B981', es_final: false, orden: 4 },
    { modulo: 'AI', codigo: 'CERRADA',        nombre: 'Cerrada',            color_hex: '#6B7280', es_final: true,  orden: 5 },
    { modulo: 'AI', codigo: 'CANCELADA',      nombre: 'Cancelada',          color_hex: '#EF4444', es_final: true,  orden: 6 },
    // HALL
    { modulo: 'HALL', codigo: 'ABIERTO',      nombre: 'Abierto',            color_hex: '#EF4444', es_final: false, orden: 1 },
    { modulo: 'HALL', codigo: 'EN_PROCESO',   nombre: 'En Proceso',         color_hex: '#F59E0B', es_final: false, orden: 2 },
    { modulo: 'HALL', codigo: 'CERRADO',      nombre: 'Cerrado',            color_hex: '#10B981', es_final: true,  orden: 3 },
    { modulo: 'HALL', codigo: 'CERRADO_OBS',  nombre: 'Cerrado c/Obs.',     color_hex: '#3B82F6', es_final: true,  orden: 4 },
    // CAPA
    { modulo: 'CAPA', codigo: 'IDENTIFICADA', nombre: 'Identificada',       color_hex: '#EF4444', es_final: false, orden: 1 },
    { modulo: 'CAPA', codigo: 'ANALISIS',     nombre: 'En Análisis',        color_hex: '#F97316', es_final: false, orden: 2 },
    { modulo: 'CAPA', codigo: 'PLAN_ACCION',  nombre: 'Plan de Acción',     color_hex: '#F59E0B', es_final: false, orden: 3 },
    { modulo: 'CAPA', codigo: 'EN_EJECUCION', nombre: 'En Ejecución',       color_hex: '#3B82F6', es_final: false, orden: 4 },
    { modulo: 'CAPA', codigo: 'VERIFICACION', nombre: 'En Verificación',    color_hex: '#8B5CF6', es_final: false, orden: 5 },
    { modulo: 'CAPA', codigo: 'CERRADA',      nombre: 'Cerrada',            color_hex: '#10B981', es_final: true,  orden: 6 },
    { modulo: 'CAPA', codigo: 'CERRADA_INEF', nombre: 'Cerrada Inefectiva', color_hex: '#EF4444', es_final: true,  orden: 7 },
    // GR
    { modulo: 'GR', codigo: 'IDENTIFICADO',   nombre: 'Identificado',       color_hex: '#F59E0B', es_final: false, orden: 1 },
    { modulo: 'GR', codigo: 'EN_TRATAMIENTO', nombre: 'En Tratamiento',     color_hex: '#3B82F6', es_final: false, orden: 2 },
    { modulo: 'GR', codigo: 'CONTROLADO',     nombre: 'Controlado',         color_hex: '#10B981', es_final: false, orden: 3 },
    { modulo: 'GR', codigo: 'MATERIALIZADO',  nombre: 'Materializado',      color_hex: '#EF4444', es_final: false, orden: 4 },
    { modulo: 'GR', codigo: 'CERRADO',        nombre: 'Cerrado',            color_hex: '#6B7280', es_final: true,  orden: 5 },
    // AA
    { modulo: 'AA', codigo: 'PLANIFICACION',  nombre: 'Planificación',      color_hex: '#94A3B8', es_final: false, orden: 1 },
    { modulo: 'AA', codigo: 'AUTOEVALUACION', nombre: 'Autoevaluación',     color_hex: '#F59E0B', es_final: false, orden: 2 },
    { modulo: 'AA', codigo: 'INFORME_PREVIO', nombre: 'Informe Previo',     color_hex: '#3B82F6', es_final: false, orden: 3 },
    { modulo: 'AA', codigo: 'VISITA_EXTERNA', nombre: 'Visita Externa',     color_hex: '#8B5CF6', es_final: false, orden: 4 },
    { modulo: 'AA', codigo: 'ACREDITADO',     nombre: 'Acreditado',         color_hex: '#10B981', es_final: true,  orden: 5 },
    { modulo: 'AA', codigo: 'NO_ACREDITADO',  nombre: 'No Acreditado',      color_hex: '#EF4444', es_final: true,  orden: 6 },
    // GS
    { modulo: 'GS', codigo: 'DISENO',         nombre: 'En Diseño',          color_hex: '#94A3B8', es_final: false, orden: 1 },
    { modulo: 'GS', codigo: 'ACTIVA',         nombre: 'Activa',             color_hex: '#10B981', es_final: false, orden: 2 },
    { modulo: 'GS', codigo: 'CERRADA',        nombre: 'Cerrada',            color_hex: '#3B82F6', es_final: true,  orden: 3 },
    { modulo: 'GS', codigo: 'ANULADA',        nombre: 'Anulada',            color_hex: '#EF4444', es_final: true,  orden: 4 },
    // MP
    { modulo: 'MP', codigo: 'BORRADOR',       nombre: 'Borrador',           color_hex: '#94A3B8', es_final: false, orden: 1 },
    { modulo: 'MP', codigo: 'VIGENTE',        nombre: 'Vigente',            color_hex: '#10B981', es_final: false, orden: 2 },
    { modulo: 'MP', codigo: 'EN_REVISION',    nombre: 'En Revisión',        color_hex: '#F59E0B', es_final: false, orden: 3 },
    { modulo: 'MP', codigo: 'OBSOLETO',       nombre: 'Obsoleto',           color_hex: '#6B7280', es_final: true,  orden: 4 },
  ];
  for (const e of estadosData) {
    await prisma.estados_flujo.upsert({
      where: { modulo_codigo: { modulo: e.modulo, codigo: e.codigo } },
      update: {},
      create: e,
    });
  }

  // ═══════════════════════════════════════
  // 3. CATÁLOGOS
  // ═══════════════════════════════════════
  console.log('→ Tipos de documento...');
  const tiposDoc = [
    { codigo: 'POL', nombre: 'Política',            prefijo: 'POL', requiere_aprobacion: true  },
    { codigo: 'MAN', nombre: 'Manual',              prefijo: 'MAN', requiere_aprobacion: true  },
    { codigo: 'PRO', nombre: 'Procedimiento',       prefijo: 'PRO', requiere_aprobacion: true  },
    { codigo: 'INS', nombre: 'Instructivo',         prefijo: 'INS', requiere_aprobacion: true  },
    { codigo: 'FOR', nombre: 'Formato/Formulario',  prefijo: 'FOR', requiere_aprobacion: false },
    { codigo: 'REG', nombre: 'Registro',            prefijo: 'REG', requiere_aprobacion: false },
    { codigo: 'PLA', nombre: 'Plan',                prefijo: 'PLA', requiere_aprobacion: true  },
    { codigo: 'GUI', nombre: 'Guía',                prefijo: 'GUI', requiere_aprobacion: false },
    { codigo: 'EXT', nombre: 'Documento Externo',   prefijo: 'EXT', requiere_aprobacion: false },
  ];
  for (const t of tiposDoc) {
    await prisma.tipos_documento.upsert({ where: { codigo: t.codigo }, update: {}, create: t });
  }

  console.log('→ Tipos de hallazgo...');
  const tiposHallazgo = [
    { codigo: 'OM',     nombre: 'Oportunidad de Mejora',  severidad: 1 },
    { codigo: 'OBS',    nombre: 'Observación',            severidad: 2 },
    { codigo: 'NC_MEN', nombre: 'No Conformidad Menor',   severidad: 3 },
    { codigo: 'NC_MAY', nombre: 'No Conformidad Mayor',   severidad: 4 },
  ];
  for (const t of tiposHallazgo) {
    await prisma.tipos_hallazgo.upsert({ where: { codigo: t.codigo }, update: {}, create: t });
  }

  console.log('→ Niveles de riesgo...');
  const nivelesRiesgo = [
    { codigo: 'BAJO',    nombre: 'Bajo',     rango_min: 1.0,  rango_max: 4.9,  color_hex: '#10B981' },
    { codigo: 'MEDIO',   nombre: 'Medio',    rango_min: 5.0,  rango_max: 9.9,  color_hex: '#F59E0B' },
    { codigo: 'ALTO',    nombre: 'Alto',     rango_min: 10.0, rango_max: 14.9, color_hex: '#F97316' },
    { codigo: 'CRITICO', nombre: 'Crítico',  rango_min: 15.0, rango_max: 25.0, color_hex: '#EF4444' },
  ];
  for (const n of nivelesRiesgo) {
    await prisma.niveles_riesgo.upsert({ where: { codigo: n.codigo }, update: {}, create: n });
  }

  console.log('→ Tipos de auditoría...');
  const tiposAuditoria = [
    { codigo: 'INT',  nombre: 'Interna'          },
    { codigo: 'EXT',  nombre: 'Externa'          },
    { codigo: 'SEG',  nombre: 'Seguimiento'      },
    { codigo: 'CERT', nombre: 'Certificación'    },
    { codigo: 'INIC', nombre: 'Inicial/Línea Base'},
  ];
  for (const t of tiposAuditoria) {
    await prisma.tipos_auditoria.upsert({ where: { codigo: t.codigo }, update: {}, create: t });
  }

  console.log('→ Tipos de pregunta...');
  const tiposPregunta = [
    { codigo: 'LIKERT',    nombre: 'Escala Likert',       tiene_opciones: false },
    { codigo: 'ESCALA',    nombre: 'Escala Numérica',     tiene_opciones: false },
    { codigo: 'OPCION_M',  nombre: 'Opción Múltiple',     tiene_opciones: true  },
    { codigo: 'MULTI_SEL', nombre: 'Selección Múltiple',  tiene_opciones: true  },
    { codigo: 'TEXTO_C',   nombre: 'Texto Corto',         tiene_opciones: false },
    { codigo: 'TEXTO_L',   nombre: 'Texto Largo',         tiene_opciones: false },
    { codigo: 'BINARIA',   nombre: 'Sí / No',             tiene_opciones: false },
    { codigo: 'MATRIZ',    nombre: 'Matriz de Evaluación',tiene_opciones: true  },
  ];
  for (const t of tiposPregunta) {
    await prisma.tipos_pregunta.upsert({ where: { codigo: t.codigo }, update: {}, create: t });
  }

  console.log('→ Métodos de causa raíz...');
  const metodosACR = [
    { codigo: '5_PORQUES', nombre: '5 Porqués'              },
    { codigo: 'ISHIKAWA',  nombre: 'Diagrama de Ishikawa'   },
    { codigo: 'PARETO',    nombre: 'Análisis de Pareto'     },
    { codigo: 'FTA',       nombre: 'Árbol de Fallas (FTA)'  },
    { codigo: '8D',        nombre: 'Metodología 8D'         },
    { codigo: 'HIPOTESIS', nombre: 'Análisis de Hipótesis'  },
  ];
  for (const m of metodosACR) {
    await prisma.metodos_causa_raiz.upsert({ where: { codigo: m.codigo }, update: {}, create: m });
  }

  console.log('→ Frecuencias de medición...');
  const frecuencias = [
    { codigo: 'DIARIA',     nombre: 'Diaria',      dias_periodo: 1   },
    { codigo: 'SEMANAL',    nombre: 'Semanal',     dias_periodo: 7   },
    { codigo: 'QUINCENAL',  nombre: 'Quincenal',   dias_periodo: 15  },
    { codigo: 'MENSUAL',    nombre: 'Mensual',     dias_periodo: 30  },
    { codigo: 'BIMESTRAL',  nombre: 'Bimestral',   dias_periodo: 60  },
    { codigo: 'TRIMESTRAL', nombre: 'Trimestral',  dias_periodo: 90  },
    { codigo: 'SEMESTRAL',  nombre: 'Semestral',   dias_periodo: 180 },
    { codigo: 'ANUAL',      nombre: 'Anual',       dias_periodo: 365 },
  ];
  for (const f of frecuencias) {
    await prisma.frecuencias_medicion.upsert({ where: { codigo: f.codigo }, update: {}, create: f });
  }

  console.log('→ Estándares de acreditación...');
  const estandares = [
    { codigo: 'ISO_21001',   nombre: 'ISO 21001:2018 - SGOE',                     organismo: 'ISO',     version: '2018' },
    { codigo: 'ISO_9001',    nombre: 'ISO 9001:2015 - SGC',                        organismo: 'ISO',     version: '2015' },
    { codigo: 'SINEACE_SUP', nombre: 'SINEACE - Modelo de Acreditación Superior',  organismo: 'SINEACE', version: '2022' },
    { codigo: 'SINEACE_INST',nombre: 'SINEACE - Acreditación Institucional',       organismo: 'SINEACE', version: '2022' },
    { codigo: 'ABET_EAC',    nombre: 'ABET EAC - Ingeniería',                      organismo: 'ABET',    version: '2023' },
  ];
  for (const e of estandares) {
    await prisma.estandares_acreditacion.upsert({ where: { codigo: e.codigo }, update: {}, create: e });
  }

  // ═══════════════════════════════════════
  // 4. FACULTADES
  // ═══════════════════════════════════════
  console.log('→ Facultades UNT...');
  const facultadesData = [
    { codigo: 'FAC-AGA', nombre: 'Facultad de Agronomía',                          nombre_corto: 'Agronomía'      },
    { codigo: 'FAC-ART', nombre: 'Facultad de Arte y Diseño Gráfico',              nombre_corto: 'Arte'           },
    { codigo: 'FAC-BIO', nombre: 'Facultad de Ciencias Biológicas',               nombre_corto: 'Biológicas'     },
    { codigo: 'FAC-CCF', nombre: 'Facultad de Ciencias Físico-Matemáticas',       nombre_corto: 'Físico-Mat.'    },
    { codigo: 'FAC-CCS', nombre: 'Facultad de Ciencias Sociales',                 nombre_corto: 'Sociales'       },
    { codigo: 'FAC-DER', nombre: 'Facultad de Derecho y Ciencias Políticas',      nombre_corto: 'Derecho'        },
    { codigo: 'FAC-ECO', nombre: 'Facultad de Ciencias Económicas',               nombre_corto: 'Economía'       },
    { codigo: 'FAC-EDU', nombre: 'Facultad de Educación',                         nombre_corto: 'Educación'      },
    { codigo: 'FAC-ENF', nombre: 'Facultad de Enfermería',                        nombre_corto: 'Enfermería'     },
    { codigo: 'FAC-FAR', nombre: 'Facultad de Farmacia y Bioquímica',             nombre_corto: 'Farmacia'       },
    { codigo: 'FAC-IND', nombre: 'Facultad de Ingeniería Industrial',             nombre_corto: 'Ing. Industrial'},
    { codigo: 'FAC-INF', nombre: 'Facultad de Ingeniería de Sistemas',            nombre_corto: 'Sistemas'       },
    { codigo: 'FAC-MED', nombre: 'Facultad de Medicina',                          nombre_corto: 'Medicina'       },
    { codigo: 'FAC-MIN', nombre: 'Facultad de Ingeniería de Minas',               nombre_corto: 'Minas'          },
    { codigo: 'FAC-ODO', nombre: 'Facultad de Estomatología',                     nombre_corto: 'Estomatología'  },
    { codigo: 'FAC-PSI', nombre: 'Facultad de Psicología',                        nombre_corto: 'Psicología'     },
    { codigo: 'FAC-QUI', nombre: 'Facultad de Ingeniería Química',                nombre_corto: 'Ing. Química'   },
    { codigo: 'FAC-ZOO', nombre: 'Facultad de Ciencias Veterinarias',             nombre_corto: 'Veterinaria'    },
    { codigo: 'EPG',     nombre: 'Escuela de Postgrado',                          nombre_corto: 'Postgrado'      },
  ];
  for (const f of facultadesData) {
    await prisma.facultades.upsert({ where: { codigo: f.codigo }, update: {}, create: f });
  }

  // ═══════════════════════════════════════
  // 5. ÁREAS CENTRALES
  // ═══════════════════════════════════════
  console.log('→ Áreas organizacionales centrales...');
  const areasData = [
    { codigo: 'REC',   nombre: 'Rectorado',                                  tipo_area: 'RECTORADO'      },
    { codigo: 'VRA',   nombre: 'Vicerrectorado Académico',                   tipo_area: 'VICERRECTORADO' },
    { codigo: 'VRI',   nombre: 'Vicerrectorado de Investigación',            tipo_area: 'VICERRECTORADO' },
    { codigo: 'DGA',   nombre: 'Dirección General de Administración',        tipo_area: 'DIRECCION'      },
    { codigo: 'OCAL',  nombre: 'Oficina Central de Calidad Universitaria',   tipo_area: 'OFICINA'        },
    { codigo: 'OAI',   nombre: 'Oficina de Auditoría Interna',               tipo_area: 'OFICINA'        },
    { codigo: 'OACT',  nombre: 'Oficina de Acreditación y Certificación',    tipo_area: 'OFICINA'        },
    { codigo: 'DTIC',  nombre: 'Dirección de Tecnologías de Información',    tipo_area: 'DIRECCION'      },
    { codigo: 'DRRHH', nombre: 'Dirección de Recursos Humanos',              tipo_area: 'DIRECCION'      },
    { codigo: 'DBI',   nombre: 'Dirección de Bienestar Universitario',       tipo_area: 'DIRECCION'      },
  ];
  for (const a of areasData) {
    await prisma.areas.upsert({ where: { codigo: a.codigo }, update: {}, create: a });
  }

  // ═══════════════════════════════════════
  // 6. USUARIO SUPERADMIN
  // ═══════════════════════════════════════
  console.log('→ Usuario superadmin...');
  const areaOcal = await prisma.areas.findUnique({ where: { codigo: 'OCAL' } });
  const passwordHash = await bcrypt.hash('Admin@UNT2025!', 12);

  const superadmin = await prisma.usuarios.upsert({
    where: { username: 'superadmin' },
    update: {},
    create: {
      codigo_usuario:  'SIGC-001',
      username:        'superadmin',
      email:           'calidad@unitru.edu.pe',
      password_hash:   passwordHash,
      nombres:         'Administrador',
      apellidos:       'Sistema SIGC-UNT',
      tipo_usuario:    'ADMINISTRATIVO',
      area_id:         areaOcal?.id,
      cargo:           'Administrador del Sistema de Gestión de Calidad',
      esta_activo:     true,
    },
  });

  const rolSuperadmin = await prisma.roles.findUnique({ where: { codigo: 'SUPERADMIN' } });
  if (rolSuperadmin) {
    const asignacionExistente = await prisma.usuarios_roles.findFirst({
      where: {
        usuario_id: superadmin.id,
        rol_id: rolSuperadmin.id,
        area_id: null,
      },
    });

    if (!asignacionExistente) {
      await prisma.usuarios_roles.create({
        data: {
          usuario_id: superadmin.id,
          rol_id: rolSuperadmin.id,
        },
      });
    }
  }

  // ═══════════════════════════════════════
  // 7. MACROPROCESOS
  // ═══════════════════════════════════════
  console.log('→ Macroprocesos UNT...');
  const macroprocesos = [
    // ── ESTRATÉGICOS ──────────────────────────────────────
    { codigo: 'E01', nombre: 'Gestión Institucional',                  tipo: 'ESTRATEGICO', orden: 1,
      descripcion: 'Define las directrices políticas y la gobernanza liderada por el Rectorado.' },
    { codigo: 'E02', nombre: 'Planeamiento y Presupuesto',             tipo: 'ESTRATEGICO', orden: 2,
      descripcion: 'Administra la asignación eficiente de recursos financieros e inversiones.' },
    { codigo: 'E03', nombre: 'Gestión de la Calidad Universitaria',    tipo: 'ESTRATEGICO', orden: 3,
      descripcion: 'Conduce la autoevaluación, licenciamiento ante SUNEDU y la acreditación de programas.' },
    { codigo: 'E04', nombre: 'Relaciones Interinstitucionales',        tipo: 'ESTRATEGICO', orden: 4,
      descripcion: 'Coordina convenios nacionales, internacionales y la movilidad académica.' },
    { codigo: 'E05', nombre: 'Comunicación e Imagen Institucional',    tipo: 'ESTRATEGICO', orden: 5,
      descripcion: 'Gestiona la difusión y el posicionamiento de la marca universitaria.' },
    { codigo: 'E06', nombre: 'Asesoramiento Jurídico',                 tipo: 'ESTRATEGICO', orden: 6,
      descripcion: 'Asegura el soporte legal de las resoluciones y convenios de la entidad.' },
    // ── MISIONALES ─────────────────────────────────────────
    { codigo: 'M01', nombre: 'Formación Integral',                     tipo: 'MISIONAL',    orden: 1,
      descripcion: 'Coordina los subprocesos esenciales para la vida del estudiante en las 13 facultades de la UNT.' },
    { codigo: 'M02', nombre: 'Investigación, Desarrollo e Innovación', tipo: 'MISIONAL',    orden: 2,
      descripcion: 'Fomenta la producción científica, la gestión de institutos de investigación y la publicación en revistas indizadas.' },
    { codigo: 'M03', nombre: 'Responsabilidad Social Universitaria',   tipo: 'MISIONAL',    orden: 3,
      descripcion: 'Vincula a la universidad con la comunidad a través de proyectos de extensión cultural, proyección social y cuidado ambiental.' },
    // ── SOPORTE ────────────────────────────────────────────
    { codigo: 'A01', nombre: 'Gestión de Recursos Humanos',            tipo: 'SOPORTE',     orden: 1,
      descripcion: 'Administra la contratación, planillas y capacitación del personal docente y administrativo.' },
    { codigo: 'A02', nombre: 'Abastecimiento y Logística',             tipo: 'SOPORTE',     orden: 2,
      descripcion: 'Encargado de las compras públicas, licitaciones de bienes y servicios.' },
    { codigo: 'A03', nombre: 'Gestión Financiera y Contabilidad',      tipo: 'SOPORTE',     orden: 3,
      descripcion: 'Ejecuta los pagos, balances financieros y control de tesorería.' },
    { codigo: 'A04', nombre: 'Tecnologías de la Información',          tipo: 'SOPORTE',     orden: 4,
      descripcion: 'Soporte técnico y desarrollo de software como el Sistema de Gestión Académica (SGA).' },
    { codigo: 'A05', nombre: 'Mantenimiento e Infraestructura',        tipo: 'SOPORTE',     orden: 5,
      descripcion: 'Asegura el óptimo estado de laboratorios, aulas y campus universitarios.' },
    { codigo: 'A06', nombre: 'Gestión Documental y Archivo',           tipo: 'SOPORTE',     orden: 6,
      descripcion: 'Administra la mesa de partes, trámite documentario y acervo histórico.' },
    { codigo: 'A07', nombre: 'Bienestar Universitario',                tipo: 'SOPORTE',     orden: 7,
      descripcion: 'Ofrece servicios de salud, comedor estudiantil, deporte y recreación.' },
  ];
  for (const m of macroprocesos) {
    await prisma.macroprocesos.upsert({ where: { codigo: m.codigo }, update: {}, create: m });
  }

  // ═══════════════════════════════════════
  // 8. OBJETIVO ESTRATÉGICO DEMO
  // ═══════════════════════════════════════
  console.log('→ Objetivos estratégicos de ejemplo...');
  const objetivos = [
    { codigo: 'OE-01', nombre: 'Incrementar la tasa de acreditación de programas académicos al 80% para 2027', perspectiva: 'Clientes', anio_pei: 2025 },
    { codigo: 'OE-02', nombre: 'Fortalecer la cultura de calidad en todas las dependencias institucionales',    perspectiva: 'Procesos', anio_pei: 2025 },
    { codigo: 'OE-03', nombre: 'Alcanzar una satisfacción estudiantil ≥ 85% en todos los programas',           perspectiva: 'Clientes', anio_pei: 2025 },
    { codigo: 'OE-04', nombre: 'Reducir el tiempo de resolución de NC al 90% dentro del plazo comprometido',   perspectiva: 'Procesos', anio_pei: 2025 },
  ];
  for (const o of objetivos) {
    await prisma.objetivos_estrategicos.upsert({ where: { codigo: o.codigo }, update: {}, create: o });
  }

  // ═══════════════════════════════════════
  // 9. DATOS DE EJEMPLO (para ver funcionalidad)
  // ═══════════════════════════════════════
  console.log('→ Datos de ejemplo (procesos, documentos, indicadores, auditorías, CAPA, riesgos, encuestas)...');

  const estadoMpVigente = await prisma.estados_flujo.findUnique({
    where: { modulo_codigo: { modulo: 'MP', codigo: 'VIGENTE' } },
  });
  const estadoGdPublicado = await prisma.estados_flujo.findUnique({
    where: { modulo_codigo: { modulo: 'GD', codigo: 'PUBLICADO' } },
  });
  const estadoAiProgramada = await prisma.estados_flujo.findUnique({
    where: { modulo_codigo: { modulo: 'AI', codigo: 'PROGRAMADA' } },
  });
  const estadoCapaIdentificada = await prisma.estados_flujo.findUnique({
    where: { modulo_codigo: { modulo: 'CAPA', codigo: 'IDENTIFICADA' } },
  });
  const estadoCapaPlanAccion = await prisma.estados_flujo.findUnique({
    where: { modulo_codigo: { modulo: 'CAPA', codigo: 'PLAN_ACCION' } },
  });
  const estadoGrIdentificado = await prisma.estados_flujo.findUnique({
    where: { modulo_codigo: { modulo: 'GR', codigo: 'IDENTIFICADO' } },
  });
  const estadoGrEnTratamiento = await prisma.estados_flujo.findUnique({
    where: { modulo_codigo: { modulo: 'GR', codigo: 'EN_TRATAMIENTO' } },
  });
  const estadoGsActiva = await prisma.estados_flujo.findUnique({
    where: { modulo_codigo: { modulo: 'GS', codigo: 'ACTIVA' } },
  });

  const macroCalidad = await prisma.macroprocesos.findUnique({ where: { codigo: 'E03' } });
  const objetivoOe02 = await prisma.objetivos_estrategicos.findUnique({ where: { codigo: 'OE-02' } });

  if (macroCalidad && areaOcal && estadoMpVigente) {
    // ── Proceso demo principal (Gestión de Calidad) ──────────
    const procesoDemo = await prisma.procesos.upsert({
      where: { codigo: 'PR-CAL-01' },
      update: {},
      create: {
        macroproceso_id: macroCalidad.id,
        codigo: 'PR-CAL-01',
        nombre: 'Gestión Documental del SGC',
        objetivo: 'Asegurar que la documentación del SGC se encuentre controlada, vigente y disponible.',
        alcance: 'Aplica a documentos del SGC en todas las dependencias de la UNT.',
        entradas: ['Necesidad de documento', 'Requisitos normativos', 'Cambios en procesos'],
        salidas: ['Documentos vigentes', 'Registros de aprobación', 'Historial de versiones'],
        area_responsable_id: areaOcal.id,
        estado_id: estadoMpVigente.id,
        orden: 1,
        creado_por: superadmin.id,
      },
    });

    await prisma.subprocesos.upsert({
      where: { codigo: 'SPR-CAL-01-01' },
      update: {},
      create: {
        proceso_id: procesoDemo.id,
        codigo: 'SPR-CAL-01-01',
        nombre: 'Elaboración y control de documentos',
        descripcion: 'Registro, elaboración, revisión, aprobación y publicación de documentos.',
        responsable_id: superadmin.id,
        orden: 1,
      },
    });

    // ── Procesos demo para todos los macroprocesos ──────────
    const procesosDemo = [
      // Estratégicos
      { mp: 'E01', cod: 'PR-REC-01', nom: 'Conducción y Gobierno Universitario', ord: 1 },
      { mp: 'E02', cod: 'PR-PLA-01', nom: 'Formulación y Ejecución Presupuestal', ord: 1 },
      { mp: 'E03', cod: 'PR-CAL-02', nom: 'Autoevaluación y Licenciamiento',     ord: 2 },
      { mp: 'E04', cod: 'PR-RII-01', nom: 'Gestión de Convenios Nacionales',     ord: 1 },
      { mp: 'E05', cod: 'PR-COM-01', nom: 'Difusión y Comunicación Institucional',ord: 1 },
      { mp: 'E06', cod: 'PR-JUR-01', nom: 'Asesoría Legal y Emisión de Resoluciones', ord: 1 },
      // Misionales
      { mp: 'M02', cod: 'PR-INV-01', nom: 'Gestión de Proyectos de Investigación', ord: 1 },
      { mp: 'M03', cod: 'PR-RSU-01', nom: 'Proyectos de Extensión y Proyección Social', ord: 1 },
      // Soporte
      { mp: 'A01', cod: 'PR-RH-01',  nom: 'Contratación y Capacitación de Personal', ord: 1 },
      { mp: 'A02', cod: 'PR-LOG-01', nom: 'Compras y Licitaciones',              ord: 1 },
      { mp: 'A03', cod: 'PR-FIN-01', nom: 'Ejecución Financiera y Tesorería',    ord: 1 },
      { mp: 'A04', cod: 'PR-TI-01',  nom: 'Soporte y Desarrollo de Software',    ord: 1 },
      { mp: 'A05', cod: 'PR-MAN-01', nom: 'Mantenimiento de Infraestructura',    ord: 1 },
      { mp: 'A06', cod: 'PR-DOC-01', nom: 'Trámite Documentario y Archivo',      ord: 1 },
      { mp: 'A07', cod: 'PR-BIE-01', nom: 'Servicios de Bienestar Universitario', ord: 1 },
    ];

    const areasPorCodigo: Record<string, any> = {};
    for (const a of ['REC', 'VRA', 'VRI', 'DGA', 'OCAL', 'OACT', 'DTIC', 'DRRHH', 'DBI']) {
      const area = await prisma.areas.findUnique({ where: { codigo: a } });
      if (area) areasPorCodigo[a] = area;
    }

    for (const pd of procesosDemo) {
      const mp = await prisma.macroprocesos.findUnique({ where: { codigo: pd.mp } });
      if (!mp) continue;
      const areaId = pd.mp === 'E01' ? (areasPorCodigo['REC']?.id ?? areaOcal.id)
        : pd.mp === 'E02' ? (areasPorCodigo['DGA']?.id ?? areaOcal.id)
        : pd.mp === 'E04' ? (areasPorCodigo['VRI']?.id ?? areaOcal.id)
        : pd.mp === 'M02' ? (areasPorCodigo['VRI']?.id ?? areaOcal.id)
        : pd.mp === 'A01' ? (areasPorCodigo['DRRHH']?.id ?? areaOcal.id)
        : pd.mp === 'A04' ? (areasPorCodigo['DTIC']?.id ?? areaOcal.id)
        : pd.mp === 'A07' ? (areasPorCodigo['DBI']?.id ?? areaOcal.id)
        : areaOcal.id;

      await prisma.procesos.upsert({
        where: { codigo: pd.cod },
        update: {},
        create: {
          macroproceso_id: mp.id,
          codigo: pd.cod,
          nombre: pd.nom,
          entradas: ['Requisito interno', 'Plan operativo'],
          salidas: ['Informe de gestión', 'Registro actualizado'],
          area_responsable_id: areaId,
          estado_id: estadoMpVigente.id,
          orden: pd.ord,
          creado_por: superadmin.id,
        },
      });
    }

    // ── Subprocesos para M01 — Formación Integral ───────────
    const macroM01 = await prisma.macroprocesos.findUnique({ where: { codigo: 'M01' } });
    if (macroM01) {
      const procM01 = await prisma.procesos.upsert({
        where: { codigo: 'PR-FOR-01' },
        update: {},
        create: {
          macroproceso_id: macroM01.id,
          codigo: 'PR-FOR-01',
          nombre: 'Gestión de la Formación Profesional',
          objetivo: 'Coordinar los procesos académicos esenciales para la formación del estudiante en las 13 facultades de la UNT.',
          alcance: 'Aplica a todas las facultades y programas de pregrado de la UNT.',
          entradas: ['Plan de estudios', 'Calendario académico', 'Recursos educativos'],
          salidas: ['Profesionales competentes', 'Registros académicos', 'Graduados'],
          area_responsable_id: areasPorCodigo['VRA']?.id ?? areaOcal.id,
          estado_id: estadoMpVigente.id,
          orden: 1,
          creado_por: superadmin.id,
        },
      });

      const subprocesosM01 = [
        { cod: 'SPR-FOR-01', nom: 'Gestión Curricular', desc: 'Diseño y actualización de mallas de estudio.' },
        { cod: 'SPR-FOR-02', nom: 'Admisión', desc: 'Concursos y modalidades de ingreso a pregrado y posgrado.' },
        { cod: 'SPR-FOR-03', nom: 'Formación Profesional', desc: 'Desarrollo de clases, talleres y evaluaciones de asignaturas.' },
        { cod: 'SPR-FOR-04', nom: 'Tutoría Académica', desc: 'Acompañamiento psicopedagógico y consejería al estudiante.' },
        { cod: 'SPR-FOR-05', nom: 'Seguimiento al Graduado', desc: 'Monitoreo de la inserción laboral y bolsas de trabajo.' },
      ];
      for (const sp of subprocesosM01) {
        await prisma.subprocesos.upsert({
          where: { codigo: sp.cod },
          update: {},
          create: {
            proceso_id: procM01.id,
            codigo: sp.cod,
            nombre: sp.nom,
            descripcion: sp.desc,
            responsable_id: superadmin.id,
            orden: subprocesosM01.indexOf(sp) + 1,
          },
        });
      }
    }

    // ── Documento demo ───────────────────────────────────────
    if (estadoGdPublicado) {
      const tipoPro = await prisma.tipos_documento.findUnique({ where: { codigo: 'PRO' } });
      if (tipoPro) {
        const docDemo = await prisma.documentos.upsert({
          where: { codigo: 'PRO-SIGC-001' },
          update: {},
          create: {
            codigo: 'PRO-SIGC-001',
            tipo_documento_id: tipoPro.id,
            titulo: 'Procedimiento de Control de Documentos',
            descripcion: 'Define el flujo de elaboración, revisión, aprobación y publicación de documentos del SGC.',
            area_id: areaOcal.id,
            proceso_id: procesoDemo.id,
            palabras_clave: ['control', 'documentos', 'sgc', 'versiones'],
            aplica_a: ['Oficina Central de Calidad', 'Todas las áreas'],
            estado_id: estadoGdPublicado.id,
            version_actual: '1.0',
            creado_por: superadmin.id,
          },
        });

        const versionExistente = await prisma.versiones_documento.findFirst({
          where: { documento_id: docDemo.id, numero_version: '1.0' },
        });
        if (!versionExistente) {
          await prisma.versiones_documento.create({
            data: {
              documento_id: docDemo.id,
              numero_version: '1.0',
              contenido_texto:
                '1. Objetivo\nEstablecer el control de documentos.\n\n2. Alcance\nAplica a todas las dependencias.\n\n3. Responsables\nOficina Central de Calidad.\n',
              resumen_cambios: 'Versión inicial de demostración.',
              estado_id: estadoGdPublicado.id,
              es_version_actual: true,
              elaborado_por: superadmin.id,
              aprobado_por: superadmin.id,
              fecha_publicacion: now,
            },
          });
        }
      }
    }
  }

  const freqMensual = await prisma.frecuencias_medicion.findUnique({ where: { codigo: 'MENSUAL' } });
  if (freqMensual && areaOcal) {
    const indicadorDemo = await prisma.indicadores.upsert({
      where: { codigo: 'IND-SIGC-01' },
      update: {},
      create: {
        codigo: 'IND-SIGC-01',
        nombre: 'Cumplimiento de publicación de documentos',
        descripcion: 'Porcentaje de documentos publicados dentro del plazo objetivo.',
        formula: '(Documentos publicados en plazo / Documentos generados) * 100',
        unidad_medida: '%',
        tipo_tendencia: 'MAYOR',
        meta_valor: new Prisma.Decimal('85.0'),
        meta_descripcion: 'Meta mensual ≥ 85%',
        frecuencia_id: freqMensual.id,
        area_responsable_id: areaOcal.id,
        responsable_id: superadmin.id,
        objetivo_estrategico_id: objetivoOe02?.id ?? null,
        fuente_datos: 'Registros del módulo de Gestión Documental',
        creado_por: superadmin.id,
      },
    });

    const periodoInicio = new Date(anioActual, now.getMonth(), 1);
    const periodoFin = new Date(anioActual, now.getMonth() + 1, 0);
    const medicionExistente = await prisma.mediciones_indicador.findFirst({
      where: { indicador_id: indicadorDemo.id, periodo_inicio: periodoInicio, periodo_fin: periodoFin },
    });
    if (!medicionExistente) {
      await prisma.mediciones_indicador.create({
        data: {
          indicador_id: indicadorDemo.id,
          periodo_inicio: periodoInicio,
          periodo_fin: periodoFin,
          valor_real: new Prisma.Decimal('78.0'),
          valor_meta: new Prisma.Decimal('85.0'),
          estado_semaforo: 'AMARILLO',
          observaciones: 'Datos de ejemplo para visualizar la gráfica y semáforo.',
          registrado_por: superadmin.id,
        },
      });
    }
  }

  const tipoAuditoriaInt = await prisma.tipos_auditoria.findUnique({ where: { codigo: 'INT' } });
  if (areaOcal && tipoAuditoriaInt && estadoAiProgramada) {
    const plan = await prisma.planes_auditoria.upsert({
      where: { id: `00000000-0000-0000-0000-000000000000` },
      update: {},
      create: {
        id: `00000000-0000-0000-0000-000000000000`,
        anio: anioActual,
        nombre: `Plan Anual de Auditorías ${anioActual}`,
        descripcion: 'Plan de auditorías de ejemplo para validar el módulo.',
        area_responsable_id: areaOcal.id,
        estado_id: estadoAiProgramada.id,
        creado_por: superadmin.id,
      },
    });

    const auditoriaExistente = await prisma.auditorias.findUnique({ where: { codigo: `AI-${anioActual}-001` } });
    if (!auditoriaExistente) {
      const auditoria = await prisma.auditorias.create({
        data: {
          plan_id: plan.id,
          tipo_id: tipoAuditoriaInt.id,
          codigo: `AI-${anioActual}-001`,
          nombre: 'Auditoría Interna al Control de Documentos',
          objetivo: 'Verificar el cumplimiento del procedimiento de control documental.',
          alcance: 'Revisión de registros, versiones y evidencias de aprobación.',
          area_auditada_id: areaOcal.id,
          fecha_programada_inicio: new Date(anioActual, now.getMonth(), Math.min(15, new Date(anioActual, now.getMonth() + 1, 0).getDate())),
          fecha_programada_fin: new Date(anioActual, now.getMonth(), Math.min(16, new Date(anioActual, now.getMonth() + 1, 0).getDate())),
          estado_id: estadoAiProgramada.id,
          observaciones: 'Auditoría de ejemplo.',
          creado_por: superadmin.id,
        },
      });

      await prisma.auditores_asignados.create({
        data: {
          auditoria_id: auditoria.id,
          usuario_id: superadmin.id,
          rol_auditoria: 'LIDER',
        },
      });
    }
  }

  if (areaOcal && estadoCapaIdentificada && estadoCapaPlanAccion) {
    const nc = await prisma.no_conformidades.upsert({
      where: { codigo: 'NC-DEM-001' },
      update: {},
      create: {
        codigo: 'NC-DEM-001',
        origen: 'AUDITORIA',
        descripcion: 'Se identificó un documento sin evidencia de aprobación formal.',
        requisito_afectado: 'ISO 9001: Control de la información documentada.',
        area_id: areaOcal.id,
        detectado_por: superadmin.id,
        estado_id: estadoCapaIdentificada.id,
        fecha_deteccion: new Date(anioActual, now.getMonth(), Math.min(10, new Date(anioActual, now.getMonth() + 1, 0).getDate())),
        creado_por: superadmin.id,
      },
    });

    const metodo5 = await prisma.metodos_causa_raiz.findUnique({ where: { codigo: '5_PORQUES' } });
    if (metodo5) {
      const acrExistente = await prisma.analisis_causa_raiz.findFirst({ where: { nc_id: nc.id, metodo_id: metodo5.id } });
      if (!acrExistente) {
        await prisma.analisis_causa_raiz.create({
          data: {
            nc_id: nc.id,
            metodo_id: metodo5.id,
            descripcion_causa: 'No se adjuntó evidencia porque el flujo no estaba formalizado para todos los casos.',
            causa_raiz: 'Falta de estandarización del flujo de aprobación y capacitación de usuarios.',
            factores_contribuyentes: ['Falta de checklist', 'No existe validación previa a publicación'],
            analista_id: superadmin.id,
            fecha_analisis: new Date(anioActual, now.getMonth(), Math.min(11, new Date(anioActual, now.getMonth() + 1, 0).getDate())),
          },
        });
      }
    }

    const accionExistente = await prisma.acciones_capa.findFirst({ where: { nc_id: nc.id } });
    if (!accionExistente) {
      await prisma.acciones_capa.create({
        data: {
          nc_id: nc.id,
          tipo_accion: 'CORRECTIVA',
          descripcion: 'Implementar checklist de aprobación y capacitaciones para responsables de documentos.',
          responsable_id: superadmin.id,
          area_id: areaOcal.id,
          fecha_compromiso: new Date(anioActual, now.getMonth(), Math.min(30, new Date(anioActual, now.getMonth() + 1, 0).getDate())),
          porcentaje_avance: 35,
          estado_id: estadoCapaPlanAccion.id,
          resultado_esperado: 'Todos los documentos publicados con evidencia de aprobación.',
          recursos_requeridos: 'Capacitación + ajustes de flujo en el sistema.',
        },
      });
    }
  }

  const nivelMedio = await prisma.niveles_riesgo.findUnique({ where: { codigo: 'MEDIO' } });
  if (areaOcal && nivelMedio && estadoGrIdentificado && estadoGrEnTratamiento) {
    try {
      const prob = new Prisma.Decimal('3.0');
      const imp = new Prisma.Decimal('3.0');
      const riesgo = await prisma.riesgos.upsert({
        where: { codigo: 'RIE-DEM-001' },
        update: {},
        create: {
          codigo: 'RIE-DEM-001',
          nombre: 'Pérdida de trazabilidad documental',
          descripcion: 'Riesgo de no poder demostrar versiones y aprobaciones ante una auditoría externa.',
          tipo_riesgo: 'OPERACIONAL',
          area_id: areaOcal.id,
          objetivo_estrategico_id: objetivoOe02?.id ?? null,
          causa: 'Procesos manuales / falta de controles en el sistema.',
          consecuencia: 'Observaciones y no conformidades por falta de evidencia.',
          probabilidad: prob,
          impacto: imp,
          nivel_riesgo_id: nivelMedio.id,
          responsable_id: superadmin.id,
          estado_id: estadoGrIdentificado.id,
          creado_por: superadmin.id,
        },
      });

      const planMitExistente = await prisma.planes_mitigacion.findFirst({ where: { riesgo_id: riesgo.id } });
      if (!planMitExistente) {
        await prisma.planes_mitigacion.create({
          data: {
            riesgo_id: riesgo.id,
            tipo_respuesta: 'MITIGAR',
            descripcion: 'Definir y aplicar controles de aprobación y auditoría de cambios.',
            responsable_id: superadmin.id,
            fecha_inicio: new Date(anioActual, now.getMonth(), 1),
            fecha_fin: new Date(anioActual, now.getMonth() + 1, 0),
            estado_id: estadoGrEnTratamiento.id,
            probabilidad_residual: new Prisma.Decimal('2.0'),
            impacto_residual: new Prisma.Decimal('2.0'),
          },
        });
      }

      const segExistente = await prisma.seguimientos_riesgo.findFirst({
        where: {
          riesgo_id: riesgo.id,
          fecha_seguimiento: new Date(anioActual, now.getMonth(), Math.min(20, new Date(anioActual, now.getMonth() + 1, 0).getDate())),
        },
      });
      if (!segExistente) {
        await prisma.seguimientos_riesgo.create({
          data: {
            riesgo_id: riesgo.id,
            fecha_seguimiento: new Date(anioActual, now.getMonth(), Math.min(20, new Date(anioActual, now.getMonth() + 1, 0).getDate())),
            probabilidad_actual: new Prisma.Decimal('3.0'),
            impacto_actual: new Prisma.Decimal('3.0'),
            estado_control: 'EN_SEGUIMIENTO',
            observaciones: 'Seguimiento de ejemplo.',
            registrado_por: superadmin.id,
          },
        });
      }
    } catch (e: any) {
      console.log('⚠️ Se omitió el demo de Riesgos por incompatibilidad con el esquema actual:', e?.code ?? e?.message ?? e);
    }
  }

  if (estadoGsActiva) {
    const encuestaExistente = await prisma.encuestas.findUnique({ where: { codigo: `ENC-${anioActual}-001` } });
    if (!encuestaExistente) {
      const encuesta = await prisma.encuestas.create({
        data: {
          codigo: `ENC-${anioActual}-001`,
          titulo: 'Encuesta de satisfacción del servicio de calidad',
          descripcion: 'Encuesta de ejemplo para validar el módulo de satisfacción.',
          poblacion_objetivo: 'ADMINISTRATIVO',
          area_id: areaOcal?.id ?? null,
          ciclo_academico: `${anioActual}-I`,
          fecha_inicio: now,
          fecha_fin: new Date(anioActual, now.getMonth() + 1, now.getDate()),
          estado_id: estadoGsActiva.id,
          es_anonima: true,
          creado_por: superadmin.id,
        },
      });

      const seccion = await prisma.secciones_encuesta.create({
        data: {
          encuesta_id: encuesta.id,
          titulo: 'Calidad del servicio',
          descripcion: 'Preguntas generales de satisfacción.',
          orden: 1,
        },
      });

      const tipoLikert = await prisma.tipos_pregunta.findUnique({ where: { codigo: 'LIKERT' } });
      const tipoTextoL = await prisma.tipos_pregunta.findUnique({ where: { codigo: 'TEXTO_L' } });
      const tipoOpcionM = await prisma.tipos_pregunta.findUnique({ where: { codigo: 'OPCION_M' } });

      if (tipoLikert) {
        await prisma.preguntas_encuesta.create({
          data: {
            seccion_id: seccion.id,
            tipo_id: tipoLikert.id,
            texto: '¿Qué tan satisfecho está con la gestión de calidad?',
            texto_ayuda: '1 = Muy insatisfecho, 5 = Muy satisfecho',
            obligatoria: true,
            orden: 1,
          },
        });
      }

      if (tipoOpcionM) {
        const p = await prisma.preguntas_encuesta.create({
          data: {
            seccion_id: seccion.id,
            tipo_id: tipoOpcionM.id,
            texto: '¿Con qué frecuencia utiliza el sistema SIGC?',
            obligatoria: true,
            orden: 2,
          },
        });

        await prisma.opciones_pregunta.createMany({
          data: [
            { pregunta_id: p.id, texto: 'Diariamente', valor: 'DIARIA', orden: 1 },
            { pregunta_id: p.id, texto: 'Semanalmente', valor: 'SEMANAL', orden: 2 },
            { pregunta_id: p.id, texto: 'Mensualmente', valor: 'MENSUAL', orden: 3 },
            { pregunta_id: p.id, texto: 'Rara vez', valor: 'RARA', orden: 4 },
          ],
        });
      }

      if (tipoTextoL) {
        await prisma.preguntas_encuesta.create({
          data: {
            seccion_id: seccion.id,
            tipo_id: tipoTextoL.id,
            texto: 'Sugerencias de mejora para el sistema SIGC:',
            obligatoria: false,
            orden: 3,
          },
        });
      }
    }
  }

  console.log('\n✅ Seed completado exitosamente.');
  console.log('─────────────────────────────────────────');
  console.log('👤 Superadmin:   username=superadmin');
  console.log('🔑 Password:     Admin@UNT2025!');
  console.log('⚠️  IMPORTANTE: Cambiar la contraseña inmediatamente.');
  console.log('─────────────────────────────────────────\n');
}

main()
  .catch((e) => { console.error('❌ Error en seed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
