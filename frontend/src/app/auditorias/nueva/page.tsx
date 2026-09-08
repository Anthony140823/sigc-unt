'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ClipboardCheck, Save } from 'lucide-react';
import { areasApi, auditoriasApi, catalogosApi, procesosApi } from '@/lib/api/servicios';

type Opcion = { id: string | number; codigo?: string; nombre: string; descripcion?: string };
type Plan = { id: string; nombre: string; anio: number };

export default function NuevaAuditoriaPage() {
  const router = useRouter();
  const anioActual = new Date().getFullYear();
  const [guardandoPlan, setGuardandoPlan] = useState(false);
  const [guardandoAuditoria, setGuardandoAuditoria] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [areas, setAreas] = useState<Opcion[]>([]);
  const [procesos, setProcesos] = useState<Opcion[]>([]);
  const [tipos, setTipos] = useState<Opcion[]>([]);

  const [planForm, setPlanForm] = useState({
    anio: String(anioActual),
    nombre: `Plan Anual de Auditorias ${anioActual}`,
    descripcion: '',
    area_responsable_id: '',
  });

  const [auditoriaForm, setAuditoriaForm] = useState({
    plan_id: '',
    tipo_id: '',
    codigo: '',
    nombre: '',
    objetivo: '',
    alcance: '',
    area_auditada_id: '',
    proceso_auditado_id: '',
    fecha_programada_inicio: '',
    fecha_programada_fin: '',
  });

  const hayPlanes = planes.length > 0;

  const cargarDatos = async () => {
    const [planesData, areasData, procesosData, tiposData] = await Promise.all([
      auditoriasApi.listarPlanes(anioActual),
      areasApi.listar(true),
      procesosApi.listar(),
      catalogosApi.tiposAuditoria(),
    ]);
    const planesLista = planesData as Plan[];
    setPlanes(planesLista);
    setAreas(areasData as Opcion[]);
    setProcesos(procesosData as Opcion[]);
    setTipos(tiposData as Opcion[]);

    const areaCalidad = (areasData as Opcion[]).find((area) => area.codigo === 'OCAL');
    if (areaCalidad) {
      setPlanForm((prev) => ({ ...prev, area_responsable_id: prev.area_responsable_id || String(areaCalidad.id) }));
    }
    if (planesLista.length > 0) {
      setAuditoriaForm((prev) => ({ ...prev, plan_id: prev.plan_id || planesLista[0].id }));
    }
  };

  useEffect(() => {
    cargarDatos().catch((err: any) => {
      setError(err?.response?.data?.mensaje ?? err?.message ?? 'No se pudieron cargar los datos del formulario.');
    });
  }, []);

  const actualizarPlan = (campo: keyof typeof planForm, valor: string) =>
    setPlanForm((prev) => ({ ...prev, [campo]: valor }));

  const actualizarAuditoria = (campo: keyof typeof auditoriaForm, valor: string) =>
    setAuditoriaForm((prev) => ({ ...prev, [campo]: valor }));

  const areasPorCodigo = useMemo(
    () => [...areas].sort((a, b) => `${a.codigo ?? ''}${a.nombre}`.localeCompare(`${b.codigo ?? ''}${b.nombre}`)),
    [areas],
  );

  const crearPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardandoPlan(true);
    setError(null);
    try {
      const planCreado = await auditoriasApi.crearPlan({
        anio: Number(planForm.anio),
        nombre: planForm.nombre.trim(),
        descripcion: planForm.descripcion.trim() || undefined,
        area_responsable_id: planForm.area_responsable_id,
      });
      await cargarDatos();
      setAuditoriaForm((prev) => ({ ...prev, plan_id: (planCreado as any).id }));
    } catch (err: any) {
      setError(err?.response?.data?.mensaje ?? err?.message ?? 'No se pudo crear el plan anual.');
    } finally {
      setGuardandoPlan(false);
    }
  };

  const crearAuditoria = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardandoAuditoria(true);
    setError(null);
    try {
      await auditoriasApi.crear({
        plan_id: auditoriaForm.plan_id,
        tipo_id: Number(auditoriaForm.tipo_id),
        codigo: auditoriaForm.codigo.trim().toUpperCase(),
        nombre: auditoriaForm.nombre.trim(),
        objetivo: auditoriaForm.objetivo.trim() || undefined,
        alcance: auditoriaForm.alcance.trim() || undefined,
        area_auditada_id: auditoriaForm.area_auditada_id,
        proceso_auditado_id: auditoriaForm.proceso_auditado_id || undefined,
        fecha_programada_inicio: auditoriaForm.fecha_programada_inicio,
        fecha_programada_fin: auditoriaForm.fecha_programada_fin,
      });
      router.push('/auditorias');
    } catch (err: any) {
      setError(err?.response?.data?.mensaje ?? err?.message ?? 'No se pudo crear la auditoria.');
    } finally {
      setGuardandoAuditoria(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Nueva Auditoría</h2>
          <p className="text-sm text-gray-500">Programa una auditoría y, si hace falta, crea primero el plan anual.</p>
        </div>
        <Link href="/auditorias" className="btn-secondary gap-2 text-xs">
          <ArrowLeft className="w-3.5 h-3.5" /> Volver
        </Link>
      </div>

      {!hayPlanes && (
        <form onSubmit={crearPlan} className="card p-5 space-y-4 max-w-4xl">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Crear plan anual</h3>
            <p className="text-xs text-gray-500 mt-1">No existe un plan de auditorías para {anioActual}. Crea uno para habilitar la programación.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label text-xs">Año *</label>
              <input type="number" min="2020" max="2040" className="input text-sm" required value={planForm.anio} onChange={(e) => actualizarPlan('anio', e.target.value)} />
            </div>
            <div>
              <label className="label text-xs">Área responsable *</label>
              <select className="input text-sm" required value={planForm.area_responsable_id} onChange={(e) => actualizarPlan('area_responsable_id', e.target.value)}>
                <option value="">Seleccione un área</option>
                {areasPorCodigo.map((area) => (
                  <option key={area.id} value={String(area.id)}>
                    {area.codigo ? `${area.codigo} - ` : ''}{area.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label text-xs">Nombre *</label>
              <input className="input text-sm" required value={planForm.nombre} onChange={(e) => actualizarPlan('nombre', e.target.value)} placeholder={`Plan Anual de Auditorias ${anioActual}`} />
            </div>
            <div className="md:col-span-2">
              <label className="label text-xs">Descripción</label>
              <textarea className="input min-h-24 text-sm" value={planForm.descripcion} onChange={(e) => actualizarPlan('descripcion', e.target.value)} placeholder="Alcance general del plan anual." />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="submit" className="btn-primary gap-2 text-sm" disabled={guardandoPlan}>
              <Save className="w-4 h-4" />
              {guardandoPlan ? 'Guardando...' : 'Crear plan anual'}
            </button>
          </div>
        </form>
      )}

      <form onSubmit={crearAuditoria} className="card p-5 space-y-4 max-w-4xl">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Programar auditoría</h3>
          <p className="text-xs text-gray-500 mt-1">Completa los datos mínimos para registrar una nueva auditoría.</p>
        </div>

        {!hayPlanes && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Primero debes crear o disponer de un plan anual para poder registrar la auditoría.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label text-xs">Plan anual *</label>
            <select className="input text-sm" required value={auditoriaForm.plan_id} onChange={(e) => actualizarAuditoria('plan_id', e.target.value)} disabled={!hayPlanes}>
              <option value="">Seleccione un plan</option>
              {planes.map((plan) => (
                <option key={plan.id} value={plan.id}>{plan.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label text-xs">Tipo de auditoría *</label>
            <select className="input text-sm" required value={auditoriaForm.tipo_id} onChange={(e) => actualizarAuditoria('tipo_id', e.target.value)}>
              <option value="">Seleccione un tipo</option>
              {tipos.map((tipo) => (
                <option key={tipo.id} value={String(tipo.id)}>
                  {tipo.codigo ? `${tipo.codigo} - ` : ''}{tipo.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label text-xs">Código *</label>
            <input className="input text-sm" required value={auditoriaForm.codigo} onChange={(e) => actualizarAuditoria('codigo', e.target.value)} placeholder={`AI-${anioActual}-001`} />
          </div>
          <div>
            <label className="label text-xs">Nombre *</label>
            <input className="input text-sm" required value={auditoriaForm.nombre} onChange={(e) => actualizarAuditoria('nombre', e.target.value)} placeholder="Auditoría Interna del proceso ..." />
          </div>
          <div>
            <label className="label text-xs">Área auditada *</label>
            <select className="input text-sm" required value={auditoriaForm.area_auditada_id} onChange={(e) => actualizarAuditoria('area_auditada_id', e.target.value)}>
              <option value="">Seleccione un área</option>
              {areasPorCodigo.map((area) => (
                <option key={area.id} value={String(area.id)}>
                  {area.codigo ? `${area.codigo} - ` : ''}{area.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label text-xs">Proceso auditado</label>
            <select className="input text-sm" value={auditoriaForm.proceso_auditado_id} onChange={(e) => actualizarAuditoria('proceso_auditado_id', e.target.value)}>
              <option value="">Sin proceso asociado</option>
              {procesos.map((proceso) => (
                <option key={proceso.id} value={String(proceso.id)}>
                  {proceso.codigo ? `${proceso.codigo} - ` : ''}{proceso.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label text-xs">Fecha de inicio *</label>
            <input type="date" className="input text-sm" required value={auditoriaForm.fecha_programada_inicio} onChange={(e) => actualizarAuditoria('fecha_programada_inicio', e.target.value)} />
          </div>
          <div>
            <label className="label text-xs">Fecha de fin *</label>
            <input type="date" className="input text-sm" required value={auditoriaForm.fecha_programada_fin} onChange={(e) => actualizarAuditoria('fecha_programada_fin', e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="label text-xs">Objetivo</label>
            <textarea className="input min-h-20 text-sm" value={auditoriaForm.objetivo} onChange={(e) => actualizarAuditoria('objetivo', e.target.value)} placeholder="Objetivo de la auditoría." />
          </div>
          <div className="md:col-span-2">
            <label className="label text-xs">Alcance</label>
            <textarea className="input min-h-20 text-sm" value={auditoriaForm.alcance} onChange={(e) => actualizarAuditoria('alcance', e.target.value)} placeholder="Alcance, criterios y cobertura." />
          </div>
        </div>

        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div className="flex justify-end gap-2">
          <Link href="/auditorias" className="btn-secondary text-sm">Cancelar</Link>
          <button type="submit" className="btn-primary gap-2 text-sm" disabled={guardandoAuditoria || !hayPlanes}>
            <Save className="w-4 h-4" />
            {guardandoAuditoria ? 'Guardando...' : 'Crear auditoría'}
          </button>
        </div>
      </form>

      <div className="card p-4 text-sm text-gray-500 max-w-4xl">
        <div className="flex items-center gap-2 font-medium text-gray-700 mb-1">
          <ClipboardCheck className="w-4 h-4" /> Nota
        </div>
        El equipo auditor, checklist y hallazgos se gestionan después desde el detalle de la auditoría.
      </div>
    </div>
  );
}
