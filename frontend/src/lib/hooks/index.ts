// src/lib/hooks/index.ts
// Hooks React Query centralizados para todos los módulos SIGC-UNT
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  authApi, usuariosApi, areasApi, documentosApi, procesosApi,
  indicadoresApi, auditoriasApi, capaApi, riesgosApi,
  encuestasApi, acreditacionApi, dashboardApi, catalogosApi,
  facultadesApi, programasAcademicosApi, checklistsApi, bscApi,
} from '../api/servicios';
import type { FiltroBase } from '../types';

// ── Claves de query centralizadas ─────────────────────────────
export const QK = {
  auth:          { perfil: ['auth', 'perfil'] },
  usuarios:      { lista: (p: any) => ['usuarios', p], uno: (id: string) => ['usuarios', id] },
  areas:         { lista: () => ['areas'], arbol: () => ['areas', 'arbol'], una: (id: string) => ['areas', id] },
  documentos:    { lista: (p: any) => ['documentos', p], uno: (id: string) => ['documentos', id], versiones: (id: string) => ['documentos', id, 'versiones'] },
  procesos:      { mapa: () => ['procesos', 'mapa'], lista: (p: any) => ['procesos', p], uno: (id: string) => ['procesos', id] },
  indicadores:   { lista: (p: any) => ['indicadores', p], uno: (id: string) => ['indicadores', id], semaforos: () => ['indicadores', 'semaforos'], historial: (id: string, m: number) => ['indicadores', id, 'historial', m] },
  auditorias:    { planes: (a?: number) => ['auditorias', 'planes', a], lista: (p: any) => ['auditorias', p], una: (id: string) => ['auditorias', id], checklist: (id: string) => ['auditorias', id, 'checklist'], hallazgosAbiertos: () => ['auditorias', 'hallazgos', 'abiertos'] },
  capa:          { lista: (p: any) => ['capa', 'nc', p], una: (id: string) => ['capa', 'nc', id], alertas: () => ['capa', 'alertas'], estadisticas: () => ['capa', 'estadisticas'] },
  riesgos:       { lista: (p: any) => ['riesgos', p], uno: (id: string) => ['riesgos', id], mapa: () => ['riesgos', 'mapa'] },
  encuestas:     { lista: (p: any) => ['encuestas', p], una: (id: string) => ['encuestas', id], resultados: (id: string) => ['encuestas', id, 'resultados'] },
  acreditacion:  { lista: (p: any) => ['acreditacion', p], uno: (id: string) => ['acreditacion', id], cronograma: () => ['acreditacion', 'cronograma'], matriz: (id: string) => ['acreditacion', id, 'matriz'] },
  dashboard:     { ejecutivo: () => ['dashboard', 'ejecutivo'], tactico: (a?: string) => ['dashboard', 'tactico', a], operativo: () => ['dashboard', 'operativo'], notificaciones: (s: boolean) => ['dashboard', 'notificaciones', s] },
  facultades:    { lista: (a?: boolean) => ['facultades', a], una: (id: string) => ['facultades', id] },
  programasAcad: { lista: (a?: boolean) => ['programas-academicos', a], una: (id: string) => ['programas-academicos', id] },
  checklists:    { lista: () => ['checklists'], uno: (id: string) => ['checklists', id] },
};

// ══════════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════════
export const usePerfil = () =>
  useQuery({ queryKey: QK.auth.perfil, queryFn: authApi.perfil, staleTime: 5 * 60_000 });

// ══════════════════════════════════════════════════════════════
// ÁREAS
// ══════════════════════════════════════════════════════════════
export const useAreas = (soloActivos = true) =>
  useQuery({ queryKey: QK.areas.lista(), queryFn: () => areasApi.listar(soloActivos), staleTime: 10 * 60_000 });

export const useArbolAreas = () =>
  useQuery({ queryKey: QK.areas.arbol(), queryFn: areasApi.arbol, staleTime: 10 * 60_000 });

export const useArea = (id: string) =>
  useQuery({ queryKey: QK.areas.una(id), queryFn: () => areasApi.obtener(id), enabled: !!id });

// ══════════════════════════════════════════════════════════════
// USUARIOS
// ══════════════════════════════════════════════════════════════
export const useUsuarios = (params?: FiltroBase & Record<string, any>) =>
  useQuery({
    queryKey: QK.usuarios.lista(params),
    queryFn: () => usuariosApi.listar(params),
    placeholderData: keepPreviousData,
  });

export const useUsuario = (id: string) =>
  useQuery({ queryKey: QK.usuarios.uno(id), queryFn: () => usuariosApi.obtener(id), enabled: !!id });

export const useCrearUsuario = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: usuariosApi.crear,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios'] }),
  });
};

export const useActualizarUsuario = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => usuariosApi.actualizar(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.usuarios.uno(id) });
      qc.invalidateQueries({ queryKey: ['usuarios'] });
    },
  });
};

// ══════════════════════════════════════════════════════════════
// DOCUMENTOS
// ══════════════════════════════════════════════════════════════
export const useDocumentos = (params?: FiltroBase & Record<string, any>) =>
  useQuery({
    queryKey: QK.documentos.lista(params),
    queryFn: () => documentosApi.listar(params),
    placeholderData: keepPreviousData,
  });

export const useDocumento = (id: string) =>
  useQuery({ queryKey: QK.documentos.uno(id), queryFn: () => documentosApi.obtener(id), enabled: !!id });

export const useVersionesDocumento = (id: string) =>
  useQuery({ queryKey: QK.documentos.versiones(id), queryFn: () => documentosApi.obtenerVersiones(id), enabled: !!id });

export const useCrearDocumento = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: documentosApi.crear,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documentos'] }),
  });
};

export const useCambiarEstadoDocumento = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ estado, comentarios, versionId }: { estado: string; comentarios?: string; versionId?: string }) =>
      documentosApi.cambiarEstado(id, estado, comentarios, versionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.documentos.uno(id) });
      qc.invalidateQueries({ queryKey: ['documentos'] });
    },
  });
};

// ══════════════════════════════════════════════════════════════
// PROCESOS
// ══════════════════════════════════════════════════════════════
export const useMapaProcesos = () =>
  useQuery({ queryKey: QK.procesos.mapa(), queryFn: procesosApi.mapa, staleTime: 5 * 60_000 });

export const useProcesos = (params?: Record<string, any>) =>
  useQuery({ queryKey: QK.procesos.lista(params), queryFn: () => procesosApi.listar(params) });

export const useProceso = (id: string) =>
  useQuery({ queryKey: QK.procesos.uno(id), queryFn: () => procesosApi.obtener(id), enabled: !!id });

// ══════════════════════════════════════════════════════════════
// INDICADORES
// ══════════════════════════════════════════════════════════════
export const useIndicadores = (params?: FiltroBase & Record<string, any>) =>
  useQuery({
    queryKey: QK.indicadores.lista(params),
    queryFn: () => indicadoresApi.listar(params),
    placeholderData: keepPreviousData,
  });

export const useIndicador = (id: string) =>
  useQuery({ queryKey: QK.indicadores.uno(id), queryFn: () => indicadoresApi.obtener(id), enabled: !!id });

export const useResumenSemaforos = () =>
  useQuery({ queryKey: QK.indicadores.semaforos(), queryFn: indicadoresApi.resumenSemaforos, staleTime: 2 * 60_000 });

export const useHistorialIndicador = (id: string, meses = 12) =>
  useQuery({ queryKey: QK.indicadores.historial(id, meses), queryFn: () => indicadoresApi.historial(id, meses), enabled: !!id });

export const useRegistrarMedicion = (indicadorId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => indicadoresApi.registrarMedicion(indicadorId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.indicadores.uno(indicadorId) });
      qc.invalidateQueries({ queryKey: QK.indicadores.semaforos() });
      qc.invalidateQueries({ queryKey: QK.dashboard.ejecutivo() });
    },
  });
};

// ══════════════════════════════════════════════════════════════
// AUDITORÍAS
// ══════════════════════════════════════════════════════════════
export const usePlanesAuditoria = (anio?: number) =>
  useQuery({ queryKey: QK.auditorias.planes(anio), queryFn: () => auditoriasApi.listarPlanes(anio) });

export const useAuditorias = (params?: FiltroBase & Record<string, any>) =>
  useQuery({
    queryKey: QK.auditorias.lista(params),
    queryFn: () => auditoriasApi.listar(params),
    placeholderData: keepPreviousData,
  });

export const useAuditoria = (id: string) =>
  useQuery({ queryKey: QK.auditorias.una(id), queryFn: () => auditoriasApi.obtener(id), enabled: !!id });

export const useHallazgosAbiertos = () =>
  useQuery({ queryKey: QK.auditorias.hallazgosAbiertos(), queryFn: auditoriasApi.hallazgosAbiertos, staleTime: 3 * 60_000 });

export const useChecklist = (auditoriaId: string) =>
  useQuery({ queryKey: QK.auditorias.checklist(auditoriaId), queryFn: () => auditoriasApi.obtenerChecklist(auditoriaId), enabled: !!auditoriaId });

export const useResponderChecklist = (auditoriaId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => auditoriasApi.responderChecklist(auditoriaId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.auditorias.checklist(auditoriaId) });
      qc.invalidateQueries({ queryKey: QK.auditorias.una(auditoriaId) });
    },
  });
};

export const useAsignarAuditor = (auditoriaId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => auditoriasApi.asignarAuditor(auditoriaId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.auditorias.una(auditoriaId) });
    },
  });
};

export const useCambiarEstadoAuditoria = (auditoriaId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (estadoCodigo: string) => auditoriasApi.cambiarEstado(auditoriaId, estadoCodigo),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.auditorias.una(auditoriaId) });
    },
  });
};

export const useCerrarHallazgo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ hallazgoId, data }: { hallazgoId: string; data: any }) =>
      auditoriasApi.cerrarHallazgo(hallazgoId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.auditorias.hallazgosAbiertos() });
    },
  });
};

export const useCrearHallazgo = (auditoriaId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => auditoriasApi.crearHallazgo(auditoriaId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.auditorias.una(auditoriaId) });
      qc.invalidateQueries({ queryKey: QK.auditorias.hallazgosAbiertos() });
    },
  });
};

// ══════════════════════════════════════════════════════════════
// CAPA
// ══════════════════════════════════════════════════════════════
export const useNoConformidades = (params?: FiltroBase & Record<string, any>) =>
  useQuery({
    queryKey: QK.capa.lista(params),
    queryFn: () => capaApi.listarNC(params),
    placeholderData: keepPreviousData,
  });

export const useNoConformidad = (id: string) =>
  useQuery({ queryKey: QK.capa.una(id), queryFn: () => capaApi.obtenerNC(id), enabled: !!id });

export const useAlertasCapa = () =>
  useQuery({ queryKey: QK.capa.alertas(), queryFn: capaApi.alertas, staleTime: 5 * 60_000 });

export const useEstadisticasCapa = () =>
  useQuery({ queryKey: QK.capa.estadisticas(), queryFn: capaApi.estadisticas, staleTime: 5 * 60_000 });

export const useCrearNC = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: capaApi.crearNC,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['capa'] });
      qc.invalidateQueries({ queryKey: QK.dashboard.ejecutivo() });
    },
  });
};

export const useCrearAccionCapa = (ncId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => capaApi.crearAccion(ncId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.capa.una(ncId) }),
  });
};

// ══════════════════════════════════════════════════════════════
// RIESGOS
// ══════════════════════════════════════════════════════════════
export const useRiesgos = (params?: FiltroBase & Record<string, any>) =>
  useQuery({
    queryKey: QK.riesgos.lista(params),
    queryFn: () => riesgosApi.listar(params),
    placeholderData: keepPreviousData,
  });

export const useRiesgo = (id: string) =>
  useQuery({ queryKey: QK.riesgos.uno(id), queryFn: () => riesgosApi.obtener(id), enabled: !!id });

export const useMapaCalorRiesgos = () =>
  useQuery({ queryKey: QK.riesgos.mapa(), queryFn: riesgosApi.mapaCalor, staleTime: 5 * 60_000 });

export const useCrearRiesgo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: riesgosApi.crear,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['riesgos'] }),
  });
};

// ══════════════════════════════════════════════════════════════
// ENCUESTAS
// ══════════════════════════════════════════════════════════════
export const useEncuestas = (params?: FiltroBase & Record<string, any>) =>
  useQuery({ queryKey: QK.encuestas.lista(params), queryFn: () => encuestasApi.listar(params), placeholderData: keepPreviousData });

export const useEncuesta = (id: string) =>
  useQuery({ queryKey: QK.encuestas.una(id), queryFn: () => encuestasApi.obtener(id), enabled: !!id });

export const useResultadosEncuesta = (id: string) =>
  useQuery({ queryKey: QK.encuestas.resultados(id), queryFn: () => encuestasApi.resultados(id), enabled: !!id });

// ══════════════════════════════════════════════════════════════
// ACREDITACIÓN
// ══════════════════════════════════════════════════════════════
export const useProcesosAcreditacion = (params?: Record<string, any>) =>
  useQuery({ queryKey: QK.acreditacion.lista(params), queryFn: () => acreditacionApi.listarProcesos(params), placeholderData: keepPreviousData });

export const useCronogramaAcreditacion = () =>
  useQuery({ queryKey: QK.acreditacion.cronograma(), queryFn: acreditacionApi.cronograma, staleTime: 10 * 60_000 });

export const useProcesoAcreditacion = (id: string) =>
  useQuery({ queryKey: QK.acreditacion.uno(id), queryFn: () => acreditacionApi.obtenerProceso(id), enabled: !!id });

export const useMatrizCumplimiento = (id: string) =>
  useQuery({ queryKey: QK.acreditacion.matriz(id), queryFn: () => acreditacionApi.matrizCumplimiento(id), enabled: !!id });

// ══════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════
export const useDashboardEjecutivo = () =>
  useQuery({ queryKey: QK.dashboard.ejecutivo(), queryFn: dashboardApi.ejecutivo, staleTime: 2 * 60_000, refetchInterval: 5 * 60_000 });

export const useDashboardTactico = (areaId?: string) =>
  useQuery({ queryKey: QK.dashboard.tactico(areaId), queryFn: () => dashboardApi.tactico(areaId), staleTime: 2 * 60_000 });

export const useDashboardOperativo = () =>
  useQuery({ queryKey: QK.dashboard.operativo(), queryFn: dashboardApi.operativo, staleTime: 60_000, refetchInterval: 2 * 60_000 });

export const useNotificaciones = (soloNoLeidas = false) =>
  useQuery({ queryKey: QK.dashboard.notificaciones(soloNoLeidas), queryFn: () => dashboardApi.notificaciones(soloNoLeidas), staleTime: 30_000, refetchInterval: 60_000 });

export const useMarcarNotificacionLeida = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: dashboardApi.marcarLeida,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dashboard', 'notificaciones'] }),
  });
};

// ══════════════════════════════════════════════════════════════
// ROLES
// ══════════════════════════════════════════════════════════════
export const useRoles = () =>
  useQuery({ queryKey: ['roles'], queryFn: catalogosApi.roles, staleTime: 30 * 60_000 });

// ══════════════════════════════════════════════════════════════
// FACULTADES
// ══════════════════════════════════════════════════════════════
export const useFacultades = (soloActivos = true) =>
  useQuery({ queryKey: QK.facultades.lista(soloActivos), queryFn: () => facultadesApi.listar(soloActivos), staleTime: 10 * 60_000 });

export const useFacultad = (id: string) =>
  useQuery({ queryKey: QK.facultades.una(id), queryFn: () => facultadesApi.obtener(id), enabled: !!id });

export const useCrearFacultad = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: facultadesApi.crear,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['facultades'] }),
  });
};

export const useActualizarFacultad = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => facultadesApi.actualizar(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.facultades.una(id) });
      qc.invalidateQueries({ queryKey: ['facultades'] });
    },
  });
};

// ══════════════════════════════════════════════════════════════
// PROGRAMAS ACADEMICOS
// ══════════════════════════════════════════════════════════════
export const useProgramasAcademicos = (soloActivos = true) =>
  useQuery({ queryKey: QK.programasAcad.lista(soloActivos), queryFn: () => programasAcademicosApi.listar(soloActivos), staleTime: 10 * 60_000 });

export const useProgramaAcademico = (id: string) =>
  useQuery({ queryKey: QK.programasAcad.una(id), queryFn: () => programasAcademicosApi.obtener(id), enabled: !!id });

export const useCrearProgramaAcademico = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: programasAcademicosApi.crear,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['programas-academicos'] }),
  });
};

export const useActualizarProgramaAcademico = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => programasAcademicosApi.actualizar(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.programasAcad.una(id) });
      qc.invalidateQueries({ queryKey: ['programas-academicos'] });
    },
  });
};

// ══════════════════════════════════════════════════════════════
// CHECKLISTS (MANTENEDOR)
// ══════════════════════════════════════════════════════════════
export const useChecklists = () =>
  useQuery<any[]>({ queryKey: QK.checklists.lista(), queryFn: checklistsApi.listar, staleTime: 5 * 60_000 });

export const useChecklistTemplate = (id: string) =>
  useQuery<any>({ queryKey: QK.checklists.uno(id), queryFn: () => checklistsApi.obtener(id), enabled: !!id });

export const useCrearChecklist = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: checklistsApi.crear,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checklists'] }),
  });
};

export const useActualizarChecklist = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => checklistsApi.actualizar(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.checklists.uno(id) });
      qc.invalidateQueries({ queryKey: ['checklists'] });
    },
  });
};

export const useEliminarChecklist = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: checklistsApi.eliminar,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checklists'] }),
  });
};

export const useAgregarItemChecklist = (checklistId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => checklistsApi.agregarItem(checklistId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.checklists.uno(checklistId) });
      qc.invalidateQueries({ queryKey: ['checklists'] });
    },
  });
};

export const useActualizarItemChecklist = (checklistId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: any }) => checklistsApi.actualizarItem(itemId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.checklists.uno(checklistId) });
    },
  });
};

export const useEliminarItemChecklist = (checklistId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: checklistsApi.eliminarItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.checklists.uno(checklistId) });
    },
  });
};

// ══════════════════════════════════════════════════════════════
// BSC
// ══════════════════════════════════════════════════════════════
export const useBscTablero = () =>
  useQuery({
    queryKey: ['bsc', 'tablero'],
    queryFn: bscApi.obtenerTablero,
  });

export const useToggleProgramaAcademico = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: programasAcademicosApi.toggleActivo,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['programas-academicos'] }),
  });
};
