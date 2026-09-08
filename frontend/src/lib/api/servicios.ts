// src/lib/api/servicios.ts
// Todos los servicios API del SIGC-UNT organizados por módulo
import { api, extraerDatos, type RespuestaPaginada } from './cliente';
import type {
  Usuario, Documento, Proceso, Indicador, Medicion,
  NoConformidad, AccionCapa, Auditoria, Hallazgo, PlanAuditoria,
  Riesgo, Encuesta, ProcesoAcreditacion, Autoevaluacion,
  BscPerspectiva, DashboardEjecutivo, DashboardTactico, DashboardOperativo,
  Area, Facultad, Notificacion,
} from '../types';

// ══════════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════════
export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }).then(
      extraerDatos<{
        access_token: string;
        refresh_token: string;
        usuario: Usuario & { roles?: string[] };
      }>,
    ),

  logout: () =>
    api.post('/auth/logout').then((r) => r.data),

  refrescarToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refresh_token: refreshToken }).then((r) => r.data),

  perfil: () =>
    api.get('/auth/perfil').then(extraerDatos),

  cambiarPassword: (passwordActual: string, passwordNuevo: string) =>
    api.post('/auth/cambiar-password', {
      password_actual: passwordActual,
      password_nuevo: passwordNuevo,
    }).then(extraerDatos),
};

// ══════════════════════════════════════════════════════════════
// USUARIOS
// ══════════════════════════════════════════════════════════════
export const usuariosApi = {
  listar: (params?: Record<string, any>) =>
    api.get<{ datos: RespuestaPaginada<Usuario> }>('/usuarios', { params })
      .then((r) => {
        // #region debug-point A:usuarios-listar-shape
        fetch('http://127.0.0.1:7777/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: 'maintainers-failure',
            runId: 'pre-fix',
            hypothesisId: 'A',
            location: 'frontend/src/lib/api/servicios.ts:usuariosApi.listar',
            msg: '[DEBUG] usuarios listar response shape captured',
            data: {
              topLevelKeys: r.data && typeof r.data === 'object' ? Object.keys(r.data as Record<string, unknown>) : null,
              hasDatos: Boolean((r.data as any)?.datos),
              nestedDatosKeys: (r.data as any)?.datos && typeof (r.data as any).datos === 'object'
                ? Object.keys((r.data as any).datos)
                : null,
              metaKeys: (r.data as any)?.datos?.meta && typeof (r.data as any).datos.meta === 'object'
                ? Object.keys((r.data as any).datos.meta)
                : null,
            },
            ts: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
        return r.data.datos;
      })
      .catch((error) => {
        // #region debug-point B:usuarios-listar-error
        fetch('http://127.0.0.1:7777/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: 'maintainers-failure',
            runId: 'pre-fix',
            hypothesisId: 'B',
            location: 'frontend/src/lib/api/servicios.ts:usuariosApi.listar',
            msg: '[DEBUG] usuarios listar request failed',
            data: {
              status: error?.response?.status ?? null,
              mensaje: error?.response?.data?.mensaje ?? error?.message ?? null,
              ruta: error?.response?.data?.ruta ?? null,
            },
            ts: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
        return Promise.reject(error);
      }),

  obtener: (id: string) =>
    api.get(`/usuarios/${id}`).then(extraerDatos<Usuario>),

  crear: (data: Partial<Usuario> & { password: string }) =>
    api.post('/usuarios', data).then(extraerDatos<Usuario>),

  actualizar: (id: string, data: Partial<Usuario>) =>
    api.put(`/usuarios/${id}`, data).then(extraerDatos<Usuario>),

  toggleActivo: (id: string) =>
    api.patch(`/usuarios/${id}/toggle-activo`).then(extraerDatos),

  eliminar: (id: string) =>
    api.delete(`/usuarios/${id}`).then(extraerDatos),

  obtenerRoles: (id: string) =>
    api.get(`/usuarios/${id}/roles`).then(extraerDatos),

  asignarRol: (id: string, rolId: number, areaId?: string) =>
    api.post(`/usuarios/${id}/roles`, { rol_id: rolId, area_id: areaId }).then(extraerDatos),

  revocarRol: (id: string, rolAsignacionId: number) =>
    api.delete(`/usuarios/${id}/roles/${rolAsignacionId}`).then(extraerDatos),
};

// ══════════════════════════════════════════════════════════════
// ÁREAS
// ══════════════════════════════════════════════════════════════
export const areasApi = {
  listar: (soloActivos = true) =>
    api.get('/areas', { params: { soloActivos } }).then(extraerDatos<Area[]>),

  arbol: () =>
    api.get('/areas/arbol').then(extraerDatos),

  obtener: (id: string) =>
    api.get(`/areas/${id}`).then(extraerDatos<Area>),

  crear: (data: Partial<Area>) =>
    api.post('/areas', data).then(extraerDatos<Area>),

  actualizar: (id: string, data: Partial<Area>) =>
    api.put(`/areas/${id}`, data).then(extraerDatos<Area>),
};

// ══════════════════════════════════════════════════════════════
// CATALOGOS
// ══════════════════════════════════════════════════════════════
export const catalogosApi = {
  tiposDocumento: () => api.get('/catalogos/tipos-documento').then(extraerDatos),
  crearTipoDocumento: (data: any) => api.post('/catalogos/tipos-documento', data).then(extraerDatos),
  actualizarTipoDocumento: (id: number, data: any) => api.patch(`/catalogos/tipos-documento/${id}`, data).then(extraerDatos),
  eliminarTipoDocumento: (id: number) => api.delete(`/catalogos/tipos-documento/${id}`).then(extraerDatos),

  frecuenciasMedicion: () => api.get('/catalogos/frecuencias-medicion').then(extraerDatos),
  crearFrecuencia: (data: any) => api.post('/catalogos/frecuencias-medicion', data).then(extraerDatos),
  actualizarFrecuencia: (id: number, data: any) => api.patch(`/catalogos/frecuencias-medicion/${id}`, data).then(extraerDatos),
  eliminarFrecuencia: (id: number) => api.delete(`/catalogos/frecuencias-medicion/${id}`).then(extraerDatos),

  tiposAuditoria: () => api.get('/catalogos/tipos-auditoria').then(extraerDatos<any[]>),
  crearTipoAuditoria: (data: any) => api.post('/catalogos/tipos-auditoria', data).then(extraerDatos),
  actualizarTipoAuditoria: (id: number, data: any) => api.patch(`/catalogos/tipos-auditoria/${id}`, data).then(extraerDatos),
  eliminarTipoAuditoria: (id: number) => api.delete(`/catalogos/tipos-auditoria/${id}`).then(extraerDatos),

  estandaresAcreditacion: () => api.get('/catalogos/estandares-acreditacion').then(extraerDatos),
  crearEstandar: (data: any) => api.post('/catalogos/estandares-acreditacion', data).then(extraerDatos),
  actualizarEstandar: (id: number, data: any) => api.patch(`/catalogos/estandares-acreditacion/${id}`, data).then(extraerDatos),
  eliminarEstandar: (id: number) => api.delete(`/catalogos/estandares-acreditacion/${id}`).then(extraerDatos),

  objetivosEstrategicos: () => api.get('/catalogos/objetivos-estrategicos').then(extraerDatos),
  crearObjetivo: (data: any) => api.post('/catalogos/objetivos-estrategicos', data).then(extraerDatos),
  actualizarObjetivo: (id: string, data: any) => api.patch(`/catalogos/objetivos-estrategicos/${id}`, data).then(extraerDatos),
  eliminarObjetivo: (id: string) => api.delete(`/catalogos/objetivos-estrategicos/${id}`).then(extraerDatos),

  roles: () => api.get('/catalogos/roles').then(extraerDatos),
  crearRol: (data: any) => api.post('/catalogos/roles', data).then(extraerDatos),
  actualizarRol: (id: number, data: any) => api.patch(`/catalogos/roles/${id}`, data).then(extraerDatos),
  eliminarRol: (id: number) => api.delete(`/catalogos/roles/${id}`).then(extraerDatos),

  programasAcademicos: () => api.get('/catalogos/programas-academicos').then(extraerDatos),
};

// ══════════════════════════════════════════════════════════════
// FACULTADES
// ══════════════════════════════════════════════════════════════
export const facultadesApi = {
  listar: (soloActivos = true) =>
    api.get('/facultades', { params: { soloActivos } }).then(extraerDatos<Facultad[]>),

  obtener: (id: string) =>
    api.get(`/facultades/${id}`).then(extraerDatos<Facultad>),

  crear: (data: Partial<Facultad>) =>
    api.post('/facultades', data).then(extraerDatos<Facultad>),

  actualizar: (id: string, data: Partial<Facultad>) =>
    api.put(`/facultades/${id}`, data).then(extraerDatos<Facultad>),
};

// ══════════════════════════════════════════════════════════════
// PROGRAMAS ACADEMICOS
// ══════════════════════════════════════════════════════════════
export interface ProgramaAcademicoRow {
  id: string; codigo: string; nombre: string; nivel: string;
  modalidad: string; facultad_id: string; esta_activo: boolean;
  facultades?: { nombre: string; nombre_corto: string };
}
export const programasAcademicosApi = {
  listar: (soloActivos = true) =>
    api.get('/programas-academicos', { params: { soloActivos } }).then(extraerDatos<ProgramaAcademicoRow[]>),

  obtener: (id: string) =>
    api.get(`/programas-academicos/${id}`).then(extraerDatos),

  crear: (data: any) =>
    api.post('/programas-academicos', data).then(extraerDatos),

  actualizar: (id: string, data: any) =>
    api.put(`/programas-academicos/${id}`, data).then(extraerDatos),

  toggleActivo: (id: string) =>
    api.patch(`/programas-academicos/${id}/toggle-activo`).then(extraerDatos),
};

// ══════════════════════════════════════════════════════════════
// DOCUMENTOS
// ══════════════════════════════════════════════════════════════
export const documentosApi = {
  listar: (params?: Record<string, any>) =>
    api.get<{ datos: RespuestaPaginada<Documento> }>('/documentos', { params })
      .then((r) => r.data.datos),

  buscar: (q: string) =>
    api.get('/documentos/buscar', { params: { q } }).then(extraerDatos<Documento[]>),

  obtener: (id: string) =>
    api.get(`/documentos/${id}`).then(extraerDatos<Documento>),

  crear: (data: Partial<Documento>) =>
    api.post('/documentos', data).then(extraerDatos<Documento>),

  actualizar: (id: string, data: Partial<Documento>) =>
    api.put(`/documentos/${id}`, data).then(extraerDatos<Documento>),

  eliminar: (id: string) =>
    api.delete(`/documentos/${id}`).then(extraerDatos),

  cambiarEstado: (id: string, nuevoEstado: string, comentarios?: string, versionId?: string) =>
    api.patch(`/documentos/${id}/estado`, {
      nuevo_estado: nuevoEstado,
      comentarios,
      version_id: versionId,
    }).then(extraerDatos),

  obtenerVersiones: (id: string) =>
    api.get(`/documentos/${id}/versiones`).then(extraerDatos),

  crearVersion: (id: string, formData: FormData) =>
    api.post(`/documentos/${id}/versiones`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(extraerDatos),

  generarUrlDescarga: (id: string, versionId?: string) =>
    api.get(`/documentos/${id}/descargar`, { params: { version_id: versionId } })
      .then(extraerDatos<{ url: string }>),
};

// ══════════════════════════════════════════════════════════════
// PROCESOS
// ══════════════════════════════════════════════════════════════
export const procesosApi = {
  mapa: () =>
    api.get('/procesos/mapa').then(extraerDatos),

  listarMacroprocesos: () =>
    api.get('/procesos/macroprocesos').then(extraerDatos),

  listar: (params?: Record<string, any>) =>
    api.get('/procesos', { params }).then(extraerDatos<Proceso[]>),

  obtener: (id: string) =>
    api.get(`/procesos/${id}`).then(extraerDatos<Proceso>),

  crear: (data: Partial<Proceso>) =>
    api.post('/procesos', data).then(extraerDatos<Proceso>),

  actualizar: (id: string, data: Partial<Proceso>) =>
    api.put(`/procesos/${id}`, data).then(extraerDatos<Proceso>),

  crearSubproceso: (id: string, data: any) =>
    api.post(`/procesos/${id}/subprocesos`, data).then(extraerDatos),

  actualizarRaci: (id: string, items: any[]) =>
    api.put(`/procesos/${id}/raci`, items).then(extraerDatos),

  cambiarEstado: (id: string, estadoCodigo: string) =>
    api.patch(`/procesos/${id}/estado`, { estado_codigo: estadoCodigo }).then(extraerDatos),
};

// ══════════════════════════════════════════════════════════════
// BSC
// ══════════════════════════════════════════════════════════════
export const bscApi = {
  obtenerTablero: () =>
    api.get('/bsc').then(extraerDatos<{ perspectivas: BscPerspectiva[] }>),
  factoresEstandar: () =>
    api.get('/catalogos/factores-estandar').then(extraerDatos),
  factoresPorEstandar: (estandarId: number) =>
    api.get(`/catalogos/factores-estandar/${estandarId}`).then(extraerDatos),
};

// ══════════════════════════════════════════════════════════════
// INDICADORES
// ══════════════════════════════════════════════════════════════
export const indicadoresApi = {
  listar: (params?: Record<string, any>) =>
    api.get<{ datos: RespuestaPaginada<Indicador> }>('/indicadores', { params })
      .then((r) => r.data.datos),

  resumenSemaforos: () =>
    api.get('/indicadores/semaforos').then(extraerDatos<Record<'verde' | 'amarillo' | 'rojo', number>>),

  obtener: (id: string) =>
    api.get(`/indicadores/${id}`).then(extraerDatos<Indicador>),

  crear: (data: Partial<Indicador>) =>
    api.post('/indicadores', data).then(extraerDatos<Indicador>),

  actualizar: (id: string, data: Partial<Indicador>) =>
    api.put(`/indicadores/${id}`, data).then(extraerDatos<Indicador>),

  registrarMedicion: (id: string, data: Partial<Medicion>) =>
    api.post(`/indicadores/${id}/mediciones`, data).then(extraerDatos<Medicion>),

  validarMedicion: (medicionId: number) =>
    api.patch(`/indicadores/mediciones/${medicionId}/validar`).then(extraerDatos),

  historial: (id: string, meses = 12) =>
    api.get(`/indicadores/${id}/historial`, { params: { meses } }).then(extraerDatos),
};

// ══════════════════════════════════════════════════════════════
// AUDITORÍAS
// ══════════════════════════════════════════════════════════════
export const auditoriasApi = {
  listarPlanes: (anio?: number) =>
    api.get('/auditorias/planes', { params: { anio } }).then(extraerDatos<PlanAuditoria[]>),

  crearPlan: (data: any) =>
    api.post('/auditorias/planes', data).then(extraerDatos),

  aprobarPlan: (id: string) =>
    api.patch(`/auditorias/planes/${id}/aprobar`).then(extraerDatos),

  listar: (params?: Record<string, any>) =>
    api.get<{ datos: RespuestaPaginada<Auditoria> }>('/auditorias', { params })
      .then((r) => r.data.datos),

  obtener: (id: string) =>
    api.get(`/auditorias/${id}`).then(extraerDatos<Auditoria>),

  crear: (data: any) =>
    api.post('/auditorias', data).then(extraerDatos<Auditoria>),

  cambiarEstado: (id: string, estadoCodigo: string) =>
    api.patch(`/auditorias/${id}/estado`, { estado_codigo: estadoCodigo }).then(extraerDatos),

  asignarAuditor: (id: string, data: any) =>
    api.post(`/auditorias/${id}/auditores`, data).then(extraerDatos),

  responderChecklist: (id: string, data: any) =>
    api.post(`/auditorias/${id}/checklist`, data).then(extraerDatos),

  obtenerChecklist: (id: string) =>
    api.get(`/auditorias/${id}/checklist`).then(extraerDatos),

  crearHallazgo: (id: string, data: any) =>
    api.post(`/auditorias/${id}/hallazgos`, data).then(extraerDatos<Hallazgo>),

  hallazgosAbiertos: () =>
    api.get('/auditorias/hallazgos/abiertos').then(extraerDatos<Hallazgo[]>),

  cerrarHallazgo: (hallazgoId: string, data: any) =>
    api.patch(`/auditorias/hallazgos/${hallazgoId}/cerrar`, data).then(extraerDatos),
};

// ══════════════════════════════════════════════════════════════
// CAPA
// ══════════════════════════════════════════════════════════════
export const capaApi = {
  listarNC: (params?: Record<string, any>) =>
    api.get<{ datos: RespuestaPaginada<NoConformidad> }>('/capa/no-conformidades', { params })
      .then((r) => r.data.datos),

  estadisticas: () =>
    api.get('/capa/no-conformidades/estadisticas').then(extraerDatos<any>),

  alertas: () =>
    api.get('/capa/no-conformidades/alertas').then(extraerDatos<any[]>),

  obtenerNC: (id: string) =>
    api.get(`/capa/no-conformidades/${id}`).then(extraerDatos<NoConformidad>),

  crearNC: (data: any) =>
    api.post('/capa/no-conformidades', data).then(extraerDatos<NoConformidad>),

  cambiarEstadoNC: (id: string, estadoCodigo: string) =>
    api.patch(`/capa/no-conformidades/${id}/estado`, { estado_codigo: estadoCodigo })
      .then(extraerDatos),

  crearAnalisis: (ncId: string, data: any) =>
    api.post(`/capa/no-conformidades/${ncId}/analisis`, data).then(extraerDatos),

  crearAccion: (ncId: string, data: any) =>
    api.post(`/capa/no-conformidades/${ncId}/acciones`, data).then(extraerDatos<AccionCapa>),

  actualizarAccion: (accionId: string, data: any) =>
    api.put(`/capa/acciones/${accionId}`, data).then(extraerDatos),

  verificarEfectividad: (accionId: string, data: any) =>
    api.patch(`/capa/acciones/${accionId}/verificar`, data).then(extraerDatos),
};

// ══════════════════════════════════════════════════════════════
// RIESGOS
// ══════════════════════════════════════════════════════════════
export const riesgosApi = {
  listar: (params?: Record<string, any>) =>
    api.get<{ datos: RespuestaPaginada<Riesgo> }>('/riesgos', { params })
      .then((r) => r.data.datos),

  mapaCalor: () =>
    api.get('/riesgos/mapa-calor').then(extraerDatos),

  obtener: (id: string) =>
    api.get(`/riesgos/${id}`).then(extraerDatos<Riesgo>),

  crear: (data: any) =>
    api.post('/riesgos', data).then(extraerDatos<Riesgo>),

  actualizar: (id: string, data: any) =>
    api.put(`/riesgos/${id}`, data).then(extraerDatos<Riesgo>),

  crearMitigacion: (id: string, data: any) =>
    api.post(`/riesgos/${id}/mitigaciones`, data).then(extraerDatos),

  registrarSeguimiento: (id: string, data: any) =>
    api.post(`/riesgos/${id}/seguimientos`, data).then(extraerDatos),
};

// ══════════════════════════════════════════════════════════════
// ENCUESTAS
// ══════════════════════════════════════════════════════════════
export const encuestasApi = {
  listar: (params?: Record<string, any>) =>
    api.get<{ datos: RespuestaPaginada<Encuesta> }>('/encuestas', { params })
      .then((r) => r.data.datos),

  obtener: (id: string) =>
    api.get(`/encuestas/${id}`).then(extraerDatos<Encuesta>),

  crear: (data: any) =>
    api.post('/encuestas', data).then(extraerDatos<Encuesta>),

  publicar: (id: string) =>
    api.patch(`/encuestas/${id}/publicar`).then(extraerDatos),

  cerrar: (id: string) =>
    api.patch(`/encuestas/${id}/cerrar`).then(extraerDatos),

  crearSeccion: (id: string, data: any) =>
    api.post(`/encuestas/${id}/secciones`, data).then(extraerDatos),

  crearPregunta: (seccionId: string, data: any) =>
    api.post(`/encuestas/secciones/${seccionId}/preguntas`, data).then(extraerDatos),

  generarToken: (id: string) =>
    api.post(`/encuestas/${id}/token`).then(extraerDatos),

  responder: (participacionId: string, data: any) =>
    api.post(`/encuestas/participaciones/${participacionId}/responder`, data).then(extraerDatos),

  resultados: (id: string) =>
    api.get(`/encuestas/${id}/resultados`).then(extraerDatos),
};

// ══════════════════════════════════════════════════════════════
// ACREDITACIÓN
// ══════════════════════════════════════════════════════════════
export const acreditacionApi = {
  listarProcesos: (params?: Record<string, any>) =>
    api.get<{ datos: RespuestaPaginada<ProcesoAcreditacion> }>('/acreditacion/procesos', { params })
      .then((r) => r.data.datos),

  cronograma: () =>
    api.get('/acreditacion/procesos/cronograma').then(extraerDatos),

  obtenerProceso: (id: string) =>
    api.get(`/acreditacion/procesos/${id}`).then(extraerDatos<ProcesoAcreditacion>),

  iniciarProceso: (data: any) =>
    api.post('/acreditacion/procesos', data).then(extraerDatos<ProcesoAcreditacion>),

  cambiarEstado: (id: string, estadoCodigo: string) =>
    api.patch(`/acreditacion/procesos/${id}/estado`, { estado_codigo: estadoCodigo })
      .then(extraerDatos),

  registrarAutoevaluacion: (procesoId: string, criterioId: string, data: any) =>
    api.post(`/acreditacion/procesos/${procesoId}/autoevaluacion/${criterioId}`, data)
      .then(extraerDatos),

  matrizCumplimiento: (id: string) =>
    api.get(`/acreditacion/procesos/${id}/matriz-cumplimiento`).then(extraerDatos),

  registrarEvidencia: (data: any) =>
    api.post('/acreditacion/evidencias', data).then(extraerDatos),

  obtenerEvidencias: (entidadTipo: string, entidadId: string) =>
    api.get(`/acreditacion/evidencias/${entidadTipo}/${entidadId}`).then(extraerDatos),
};

// ══════════════════════════════════════════════════════════════
// CHECKLISTS (MANTENEDOR DE PLANTILLAS)
// ══════════════════════════════════════════════════════════════
export const checklistsApi = {
  listar: () =>
    api.get('/checklists').then(extraerDatos<any[]>),

  obtener: (id: string) =>
    api.get(`/checklists/${id}`).then(extraerDatos),

  crear: (data: any) =>
    api.post('/checklists', data).then(extraerDatos),

  actualizar: (id: string, data: any) =>
    api.patch(`/checklists/${id}`, data).then(extraerDatos),

  eliminar: (id: string) =>
    api.delete(`/checklists/${id}`).then(extraerDatos),

  agregarItem: (id: string, data: any) =>
    api.post(`/checklists/${id}/items`, data).then(extraerDatos),

  actualizarItem: (itemId: string, data: any) =>
    api.patch(`/checklists/items/${itemId}`, data).then(extraerDatos),

  eliminarItem: (itemId: string) =>
    api.delete(`/checklists/items/${itemId}`).then(extraerDatos),
};

// ── Download helper ────────────────────────────────────────────
export const descargarArchivo = async (url: string, nombre: string) => {
  const response = await api.get(url, { responseType: 'blob' });
  const blob = new Blob([response.data]);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = nombre;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

// ══════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════
export const dashboardApi = {
  ejecutivo: () =>
    api.get('/dashboard/ejecutivo').then(extraerDatos<DashboardEjecutivo>),

  tactico: (areaId?: string) =>
    api.get('/dashboard/tactico', { params: { area_id: areaId } })
      .then(extraerDatos<DashboardTactico>),

  operativo: () =>
    api.get('/dashboard/operativo').then(extraerDatos<DashboardOperativo>),

  acreditacion: () =>
    api.get('/dashboard/acreditacion').then(extraerDatos),

  notificaciones: (soloNoLeidas = false) =>
    api.get('/dashboard/notificaciones', { params: { soloNoLeidas } })
      .then(extraerDatos<Notificacion[]>),

  marcarLeida: (id: number) =>
    api.patch(`/dashboard/notificaciones/${id}/leer`).then(extraerDatos),

  marcarTodasLeidas: () =>
    api.patch('/dashboard/notificaciones/leer-todas').then(extraerDatos),
};
