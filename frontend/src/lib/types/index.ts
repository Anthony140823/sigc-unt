// src/lib/types/index.ts
// Tipos TypeScript completos para el SIGC-UNT

// ══════════════════════════════════════════════════════════════
// CATÁLOGOS
// ══════════════════════════════════════════════════════════════
export interface Rol {
  id: number;
  codigo: string;
  nombre: string;
  nivel_jerarquia: number;
  esta_activo: boolean;
}

export interface EstadoFlujo {
  id: number;
  modulo: string;
  codigo: string;
  nombre: string;
  color_hex?: string;
  es_final: boolean;
  orden: number;
}

export interface TipoDocumento {
  id: number;
  codigo: string;
  nombre: string;
  prefijo?: string;
  requiere_aprobacion: boolean;
}

export interface TipoHallazgo {
  id: number;
  codigo: string;
  nombre: string;
  severidad: number;
}

export interface NivelRiesgo {
  id: number;
  codigo: string;
  nombre: string;
  rango_min: number;
  rango_max: number;
  color_hex?: string;
}

export interface FrecuenciaMedicion {
  id: number;
  codigo: string;
  nombre: string;
  dias_periodo?: number;
}

export interface EstandarAcreditacion {
  id: number;
  codigo: string;
  nombre: string;
  organismo: string;
  version?: string;
}

// ══════════════════════════════════════════════════════════════
// MAESTRAS
// ══════════════════════════════════════════════════════════════
export interface Facultad {
  id: string;
  codigo: string;
  nombre: string;
  nombre_corto?: string;
  decano_nombre?: string;
  email?: string;
  esta_activo: boolean;
}

export interface Area {
  id: string;
  codigo: string;
  nombre: string;
  nombre_corto?: string;
  facultad_id?: string;
  area_padre_id?: string;
  tipo_area: string;
  responsable_nombre?: string;
  email?: string;
  esta_activo: boolean;
  facultades?: Facultad;
  areas?: Area; // padre
  other_areas?: Area[]; // hijos
  _count?: { usuarios: number; procesos: number; documentos: number };
}

export interface UsuarioRol {
  id: number;
  usuario_id: string;
  rol_id: number;
  area_id?: string;
  fecha_inicio: string;
  fecha_fin?: string;
  roles: Rol;
  areas?: Area;
}

export interface Usuario {
  id: string;
  codigo_usuario: string;
  username: string;
  email: string;
  nombres: string;
  apellidos: string;
  nombre_completo?: string; // computado en frontend
  tipo_usuario: 'DOCENTE' | 'ADMINISTRATIVO' | 'AUTORIDAD' | 'EXTERNO';
  area_id?: string;
  cargo?: string;
  telefono?: string;
  avatar_url?: string;
  esta_activo: boolean;
  ultimo_login?: string;
  creado_en: string;
  areas?: Area;
  usuarios_roles?: UsuarioRol[];
}

export interface ProgramaAcademico {
  id: string;
  codigo: string;
  nombre: string;
  nivel: 'PREGRADO' | 'MAESTRIA' | 'DOCTORADO' | 'DIPLOMADO' | 'SEGUNDA_ESPECIALIDAD';
  modalidad: string;
  facultad_id: string;
  esta_activo: boolean;
  facultades?: Facultad;
}

export interface Notificacion {
  id: number;
  usuario_id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  url_accion?: string;
  leida: boolean;
  fecha_lectura?: string;
  creado_en: string;
}

// ══════════════════════════════════════════════════════════════
// MÓDULO GD — DOCUMENTOS
// ══════════════════════════════════════════════════════════════
export interface VersionDocumento {
  id: string;
  documento_id: string;
  numero_version: string;
  contenido_url?: string;
  resumen_cambios: string;
  es_version_actual: boolean;
  elaborado_por: string;
  revisado_por?: string;
  aprobado_por?: string;
  fecha_elaboracion: string;
  fecha_aprobacion?: string;
  fecha_publicacion?: string;
  estados_flujo?: EstadoFlujo;
}

export interface Documento {
  id: string;
  codigo: string;
  tipo_documento_id: number;
  titulo: string;
  descripcion?: string;
  area_id: string;
  proceso_id?: string;
  palabras_clave: string[];
  aplica_a: string[];
  estado_id: number;
  version_actual: string;
  esta_activo: boolean;
  creado_en: string;
  modificado_en: string;
  creado_por: string;
  tipos_documento?: TipoDocumento;
  areas?: Area;
  estados_flujo?: EstadoFlujo;
  procesos?: { id: string; nombre: string; codigo: string };
  versiones_documento?: VersionDocumento[];
}

// ══════════════════════════════════════════════════════════════
// MÓDULO MP — PROCESOS
// ══════════════════════════════════════════════════════════════
export interface Macroproceso {
  id: string;
  codigo: string;
  nombre: string;
  tipo: 'ESTRATEGICO' | 'MISIONAL' | 'SOPORTE';
  descripcion?: string;
  orden: number;
  esta_activo: boolean;
  procesos?: Proceso[];
  _count?: { procesos: number };
}

export interface Subproceso {
  id: string;
  proceso_id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  responsable_id?: string;
  orden: number;
  usuarios?: Pick<Usuario, 'nombres' | 'apellidos'>;
}

export interface MatrizRaci {
  id: number;
  proceso_id: string;
  subproceso_id?: string;
  area_id: string;
  usuario_id?: string;
  rol_raci: 'R' | 'A' | 'C' | 'I';
  descripcion?: string;
  areas?: Area;
  usuarios?: Pick<Usuario, 'nombres' | 'apellidos'>;
}

export interface Proceso {
  id: string;
  macroproceso_id: string;
  codigo: string;
  nombre: string;
  objetivo?: string;
  alcance?: string;
  entradas: string[];
  salidas: string[];
  area_responsable_id: string;
  estado_id: number;
  diagrama_bpmn_url?: string;
  diagrama_bpmn_json?: Record<string, any>;
  esta_activo: boolean;
  macroprocesos?: Macroproceso;
  areas?: Area;
  estados_flujo?: EstadoFlujo;
  subprocesos?: Subproceso[];
  documentos?: Documento[];
  indicadores?: Indicador[];
  matriz_raci?: MatrizRaci[];
  _count?: { subprocesos: number; documentos: number; indicadores: number };
}

// ══════════════════════════════════════════════════════════════
// MÓDULO IG — INDICADORES
// ══════════════════════════════════════════════════════════════
export interface Medicion {
  id: number;
  indicador_id: string;
  periodo_inicio: string;
  periodo_fin: string;
  valor_real: number;
  valor_meta?: number;
  estado_semaforo: 'VERDE' | 'AMARILLO' | 'ROJO';
  observaciones?: string;
  evidencia_url?: string;
  registrado_por: string;
  validado_por?: string;
  fecha_registro: string;
  fecha_validacion?: string;
}

export interface ObjetivoEstrategico {
  id: string;
  codigo: string;
  nombre: string;
  perspectiva?: string;
  anio_pei?: number;
  esta_activo: boolean;
}

export interface Indicador {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  formula: string;
  unidad_medida?: string;
  tipo_tendencia: 'MAYOR' | 'MENOR' | 'NOMINAL';
  meta_valor?: number;
  meta_descripcion?: string;
  frecuencia_id: number;
  proceso_id?: string;
  area_responsable_id: string;
  responsable_id?: string;
  objetivo_estrategico_id?: string;
  fuente_datos?: string;
  esta_activo: boolean;
  creado_en: string;
  areas?: Area;
  frecuencias_medicion?: FrecuenciaMedicion;
  procesos?: Pick<Proceso, 'nombre' | 'codigo'>;
  objetivos_estrategicos?: ObjetivoEstrategico;
  mediciones_indicador?: Medicion[]; // últimas N mediciones
}

// ══════════════════════════════════════════════════════════════
// MÓDULO AA — ACREDITACIÓN
// ══════════════════════════════════════════════════════════════
export interface CriterioFactor {
  id: string;
  factor_id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  ponderacion?: number;
  autoevaluaciones?: Autoevaluacion[];
}

export interface FactorEstandar {
  id: string;
  estandar_id: number;
  codigo: string;
  nombre: string;
  ponderacion?: number;
  criterios_factor?: CriterioFactor[];
}

export interface Autoevaluacion {
  id: string;
  proceso_acreditacion_id: string;
  criterio_id: string;
  puntuacion?: number;
  nivel_logro?: 'LOGRADO' | 'PARCIALMENTE_LOGRADO' | 'NO_LOGRADO';
  fortalezas?: string;
  debilidades?: string;
  oportunidades?: string;
  plan_mejora?: string;
  responsable_id?: string;
  estado_id: number;
  fecha_evaluacion?: string;
  criterios_factor?: CriterioFactor;
  estados_flujo?: EstadoFlujo;
}

export interface ProcesoAcreditacion {
  id: string;
  programa_id: string;
  estandar_id: number;
  tipo_proceso: 'AUTOEVALUACION' | 'EVALUACION_EXTERNA' | 'ACREDITACION' | 'REACREDITACION';
  anio_inicio: number;
  fecha_inicio?: string;
  fecha_visita_externa?: string;
  fecha_acreditacion?: string;
  fecha_vencimiento?: string;
  estado_id: number;
  puntuacion_total?: number;
  programas_academicos?: ProgramaAcademico;
  estandares_acreditacion?: EstandarAcreditacion;
  estados_flujo?: EstadoFlujo;
  autoevaluaciones?: Autoevaluacion[];
  alerta_visita?: boolean;
  alerta_vencimiento?: boolean;
}

export interface Evidencia {
  id: string;
  entidad_tipo: string;
  entidad_id: string;
  nombre: string;
  descripcion?: string;
  archivo_url?: string;
  tipo_mime?: string;
  tamano_bytes?: number;
  codigo_evidencia?: string;
  fecha_documento?: string;
  subido_por: string;
  creado_en: string;
  usuarios?: Pick<Usuario, 'nombres' | 'apellidos'>;
}

// ══════════════════════════════════════════════════════════════
// MÓDULO AI — AUDITORÍAS
// ══════════════════════════════════════════════════════════════
export interface AuditorAsignado {
  id: number;
  auditoria_id: string;
  usuario_id: string;
  rol_auditoria: 'LIDER' | 'AUDITOR' | 'OBSERVADOR' | 'EXPERTO_TECNICO';
  usuarios?: Pick<Usuario, 'nombres' | 'apellidos' | 'email' | 'cargo'>;
}

export interface Hallazgo {
  id: string;
  auditoria_id: string;
  tipo_id: number;
  codigo: string;
  descripcion: string;
  requisito_incumplido?: string;
  proceso_id?: string;
  area_id: string;
  estado_id: number;
  fecha_deteccion: string;
  fecha_limite_cierre?: string;
  fecha_cierre_real?: string;
  tipos_hallazgo?: TipoHallazgo;
  areas?: Area;
  estados_flujo?: EstadoFlujo;
}

export interface PlanAuditoria {
  id: string;
  anio: number;
  nombre: string;
  descripcion?: string;
  area_responsable_id: string;
  estado_id: number;
  fecha_aprobacion?: string;
  areas?: Area;
  estados_flujo?: EstadoFlujo;
  _count?: { auditorias: number };
}

export interface Auditoria {
  id: string;
  plan_id: string;
  tipo_id: number;
  codigo: string;
  nombre: string;
  objetivo?: string;
  alcance?: string;
  area_auditada_id: string;
  proceso_auditado_id?: string;
  fecha_programada_inicio: string;
  fecha_programada_fin: string;
  fecha_real_inicio?: string;
  fecha_real_fin?: string;
  estado_id: number;
  planes_auditoria?: PlanAuditoria;
  tipos_auditoria?: { nombre: string };
  areas?: Area;
  estados_flujo?: EstadoFlujo;
  auditores_asignados?: AuditorAsignado[];
  hallazgos?: Hallazgo[];
  _count?: { hallazgos: number; auditores_asignados: number };
}

// ══════════════════════════════════════════════════════════════
// MÓDULO CAPA
// ══════════════════════════════════════════════════════════════
export interface AnalisisCausaRaiz {
  id: string;
  nc_id: string;
  metodo_id: number;
  descripcion_causa: string;
  causa_raiz: string;
  factores_contribuyentes: string[];
  analista_id?: string;
  fecha_analisis: string;
  datos_metodo?: Record<string, any>;
  metodos_causa_raiz?: { codigo: string; nombre: string };
  usuarios_analisis_causa_raiz_analista_idTousuarios?: Pick<Usuario, 'nombres' | 'apellidos'>;
}

export interface AccionCapa {
  id: string;
  nc_id: string;
  tipo_accion: 'CORRECTIVA' | 'PREVENTIVA' | 'MEJORA' | 'CONTENCION';
  descripcion: string;
  responsable_id: string;
  area_id: string;
  fecha_compromiso: string;
  fecha_real_cierre?: string;
  porcentaje_avance: number;
  estado_id: number;
  resultado_esperado?: string;
  resultado_real?: string;
  verificacion_efectividad?: string;
  verificado_por?: string;
  fecha_verificacion?: string;
  areas?: Area;
  estados_flujo?: EstadoFlujo;
  usuarios_acciones_capa_responsable_idTousuarios?: Pick<Usuario, 'nombres' | 'apellidos'>;
}

export interface NoConformidad {
  id: string;
  codigo: string;
  origen: 'AUDITORIA' | 'INSPECCION' | 'QUEJA' | 'INDICADOR' | 'REVISION_DIRECCION' | 'AUTOEVALUACION' | 'OTRO';
  hallazgo_id?: string;
  descripcion: string;
  requisito_afectado?: string;
  proceso_id?: string;
  area_id: string;
  detectado_por?: string;
  estado_id: number;
  fecha_deteccion: string;
  creado_en: string;
  areas?: Area;
  procesos?: Pick<Proceso, 'nombre' | 'codigo'>;
  estados_flujo?: EstadoFlujo;
  hallazgos?: Pick<Hallazgo, 'codigo' | 'descripcion'>;
  analisis_causa_raiz?: AnalisisCausaRaiz[];
  acciones_capa?: AccionCapa[];
  _count?: { acciones_capa: number; analisis_causa_raiz: number };
}

// ══════════════════════════════════════════════════════════════
// MÓDULO GR — RIESGOS
// ══════════════════════════════════════════════════════════════
export interface PlanMitigacion {
  id: string;
  riesgo_id: string;
  tipo_respuesta: 'MITIGAR' | 'ACEPTAR' | 'TRANSFERIR' | 'EVITAR';
  descripcion: string;
  responsable_id?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  estado_id: number;
  probabilidad_residual?: number;
  impacto_residual?: number;
  estados_flujo?: EstadoFlujo;
}

export interface SeguimientoRiesgo {
  id: number;
  riesgo_id: string;
  fecha_seguimiento: string;
  probabilidad_actual: number;
  impacto_actual: number;
  estado_control: 'EFECTIVO' | 'PARCIALMENTE_EFECTIVO' | 'INEFECTIVO';
  observaciones?: string;
  registrado_por: string;
}

export interface Riesgo {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  tipo_riesgo: string;
  area_id: string;
  proceso_id?: string;
  objetivo_estrategico_id?: string;
  causa?: string;
  consecuencia?: string;
  probabilidad: number;
  impacto: number;
  puntuacion?: number;
  nivel_riesgo_id: number;
  responsable_id?: string;
  estado_id: number;
  activo: boolean;
  creado_en: string;
  areas?: Area;
  niveles_riesgo?: NivelRiesgo;
  estados_flujo?: EstadoFlujo;
  procesos?: Pick<Proceso, 'nombre'>;
  objetivos_estrategicos?: Pick<ObjetivoEstrategico, 'codigo' | 'nombre'>;
  planes_mitigacion?: PlanMitigacion[];
  seguimientos_riesgo?: SeguimientoRiesgo[];
  _count?: { planes_mitigacion: number; seguimientos_riesgo: number };
}

// ══════════════════════════════════════════════════════════════
// MÓDULO GS — ENCUESTAS
// ══════════════════════════════════════════════════════════════
export interface OpcionPregunta {
  id: number;
  pregunta_id: string;
  texto: string;
  valor?: string;
  orden: number;
}

export interface Pregunta {
  id: string;
  seccion_id: string;
  tipo_id: number;
  texto: string;
  texto_ayuda?: string;
  obligatoria: boolean;
  orden: number;
  configuracion?: Record<string, any>;
  tipos_pregunta?: { codigo: string; nombre: string };
  opciones_pregunta?: OpcionPregunta[];
}

export interface SeccionEncuesta {
  id: string;
  encuesta_id: string;
  titulo: string;
  descripcion?: string;
  orden: number;
  preguntas_encuesta?: Pregunta[];
}

export interface Encuesta {
  id: string;
  codigo: string;
  titulo: string;
  descripcion?: string;
  poblacion_objetivo: 'ESTUDIANTE' | 'DOCENTE' | 'EGRESADO' | 'ADMINISTRATIVO' | 'EXTERNO' | 'TODOS';
  programa_id?: string;
  area_id?: string;
  ciclo_academico?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  estado_id: number;
  es_anonima: boolean;
  creado_en: string;
  estados_flujo?: EstadoFlujo;
  programas_academicos?: Pick<ProgramaAcademico, 'nombre'>;
  secciones_encuesta?: SeccionEncuesta[];
  _count?: { secciones_encuesta: number; participaciones_encuesta: number };
}

// ══════════════════════════════════════════════════════════════
// DASHBOARDS
// ══════════════════════════════════════════════════════════════
export interface DashboardEjecutivo {
  kpis: {
    documentos_vigentes: number;
    documentos_por_aprobar: number;
    auditorias_anio: number;
    hallazgos_abiertos: number;
    nc_abiertas: number;
    acciones_vencidas: number;
    riesgos_criticos: number;
    indicadores_rojo: number;
    encuestas_activas: number;
    satisfaccion_promedio: number;
    procesos_acreditacion: number;
  };
  distribucion_semaforo: {
    verde: number;
    amarillo: number;
    rojo: number;
  };
  fecha_calculo: string;
}

export interface DashboardTactico {
  nc_por_estado: any[];
  hallazgos_por_tipo: any[];
  indicadores_semaforo: any[];
  acciones_proximas_vencer: number;
  riesgos_por_nivel: any[];
  area_id: string;
}

export interface DashboardOperativo {
  documentos_pendientes_aprobacion: number;
  mis_acciones_capa: AccionCapa[];
  indicadores_pendientes_registro: number;
  notificaciones_sin_leer: number;
  usuario_id: string;
}

// ══════════════════════════════════════════════════════════════
// UTILIDADES
// ══════════════════════════════════════════════════════════════
export interface Paginacion<T> {
  datos: T[];
  meta: {
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
    tieneSiguiente: boolean;
    tieneAnterior: boolean;
  };
}

export type ColorSemaforo = 'VERDE' | 'AMARILLO' | 'ROJO';

// ══════════════════════════════════════════════════════════════
// BSC
// ══════════════════════════════════════════════════════════════
export interface BscIndicador {
  id: string;
  codigo: string;
  nombre: string;
  unidad_medida?: string;
  tipo_tendencia: string;
  meta_valor?: number;
  frecuencia?: string;
  ultima_medicion?: {
    valor_real: number;
    valor_meta: number;
    estado_semaforo: 'VERDE' | 'AMARILLO' | 'ROJO';
    periodo: string;
  } | null;
}

export interface BscObjetivo {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  anio_pei?: number;
  total_indicadores: number;
  indicadores: BscIndicador[];
}

export interface BscPerspectiva {
  nombre: string;
  objetivos: BscObjetivo[];
}

export interface FiltroBase {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
  busqueda?: string;
}
