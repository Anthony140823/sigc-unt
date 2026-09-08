'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BarChart2, Save } from 'lucide-react';
import { areasApi, catalogosApi, indicadoresApi, procesosApi } from '@/lib/api/servicios';
import type { Indicador } from '@/lib/types';

type Opcion = { id: string | number; codigo?: string; nombre: string };
type FormIndicador = {
  codigo: string;
  nombre: string;
  descripcion: string;
  formula: string;
  unidad_medida: string;
  tipo_tendencia: Indicador['tipo_tendencia'];
  meta_valor: string;
  meta_descripcion: string;
  frecuencia_id: string;
  area_responsable_id: string;
  proceso_id: string;
  fuente_datos: string;
};

const TENDENCIAS = ['MAYOR', 'MENOR', 'NOMINAL'] as const;

export default function NuevoIndicadorPage() {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [areas, setAreas] = useState<Opcion[]>([]);
  const [procesos, setProcesos] = useState<Opcion[]>([]);
  const [frecuencias, setFrecuencias] = useState<Opcion[]>([]);
  const [form, setForm] = useState<FormIndicador>({
    codigo: '',
    nombre: '',
    descripcion: '',
    formula: '',
    unidad_medida: '',
    tipo_tendencia: 'MAYOR',
    meta_valor: '',
    meta_descripcion: '',
    frecuencia_id: '',
    area_responsable_id: '',
    proceso_id: '',
    fuente_datos: '',
  });

  useEffect(() => {
    const cargar = async () => {
      try {
        const [areasData, procesosData, frecuenciasData] = await Promise.all([
          areasApi.listar(true),
          procesosApi.listar(),
          catalogosApi.frecuenciasMedicion(),
        ]);
        setAreas(areasData as Opcion[]);
        setProcesos(procesosData as Opcion[]);
        setFrecuencias(frecuenciasData as Opcion[]);
      } catch (err: any) {
        setError(err?.response?.data?.mensaje ?? err?.message ?? 'No se pudieron cargar los catalogos.');
      }
    };
    cargar();
  }, []);

  const actualizar = (campo: keyof FormIndicador, valor: string) =>
    setForm((prev) => ({ ...prev, [campo]: valor }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      await indicadoresApi.crear({
        codigo: form.codigo.trim().toUpperCase(),
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || undefined,
        formula: form.formula.trim(),
        unidad_medida: form.unidad_medida.trim() || undefined,
        tipo_tendencia: form.tipo_tendencia,
        meta_valor: form.meta_valor ? Number(form.meta_valor) : undefined,
        meta_descripcion: form.meta_descripcion.trim() || undefined,
        frecuencia_id: Number(form.frecuencia_id),
        area_responsable_id: form.area_responsable_id,
        proceso_id: form.proceso_id || undefined,
        fuente_datos: form.fuente_datos.trim() || undefined,
      });
      router.push('/indicadores');
    } catch (err: any) {
      setError(err?.response?.data?.mensaje ?? err?.message ?? 'No se pudo crear el indicador.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Nuevo Indicador</h2>
          <p className="text-sm text-gray-500">Define un KPI y deja lista su configuracion base.</p>
        </div>
        <Link href="/indicadores" className="btn-secondary gap-2 text-xs">
          <ArrowLeft className="w-3.5 h-3.5" /> Volver
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="card p-5 space-y-4 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label text-xs">Codigo *</label>
            <input className="input text-sm" required value={form.codigo} onChange={(e) => actualizar('codigo', e.target.value)} placeholder="IND-ACA-001" />
          </div>
          <div>
            <label className="label text-xs">Nombre *</label>
            <input className="input text-sm" required value={form.nombre} onChange={(e) => actualizar('nombre', e.target.value)} placeholder="Tasa de titulacion oportuna" />
          </div>
          <div className="md:col-span-2">
            <label className="label text-xs">Formula *</label>
            <input className="input text-sm" required value={form.formula} onChange={(e) => actualizar('formula', e.target.value)} placeholder="(Titulados / Egresados) * 100" />
          </div>
          <div>
            <label className="label text-xs">Frecuencia *</label>
            <select className="input text-sm" required value={form.frecuencia_id} onChange={(e) => actualizar('frecuencia_id', e.target.value)}>
              <option value="">Seleccione una frecuencia</option>
              {frecuencias.map((frecuencia) => <option key={frecuencia.id} value={String(frecuencia.id)}>{frecuencia.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="label text-xs">Tendencia *</label>
            <select
              className="input text-sm"
              value={form.tipo_tendencia}
              onChange={(e) => actualizar('tipo_tendencia', e.target.value as Indicador['tipo_tendencia'])}
            >
              {TENDENCIAS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label text-xs">Area responsable *</label>
            <select className="input text-sm" required value={form.area_responsable_id} onChange={(e) => actualizar('area_responsable_id', e.target.value)}>
              <option value="">Seleccione un area</option>
              {areas.map((area) => <option key={area.id} value={String(area.id)}>{area.codigo ? `${area.codigo} - ` : ''}{area.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="label text-xs">Proceso asociado</label>
            <select className="input text-sm" value={form.proceso_id} onChange={(e) => actualizar('proceso_id', e.target.value)}>
              <option value="">Sin proceso asociado</option>
              {procesos.map((proceso) => <option key={proceso.id} value={String(proceso.id)}>{proceso.codigo ? `${proceso.codigo} - ` : ''}{proceso.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="label text-xs">Meta numerica</label>
            <input type="number" step="0.01" className="input text-sm" value={form.meta_valor} onChange={(e) => actualizar('meta_valor', e.target.value)} placeholder="80" />
          </div>
          <div>
            <label className="label text-xs">Unidad de medida</label>
            <input className="input text-sm" value={form.unidad_medida} onChange={(e) => actualizar('unidad_medida', e.target.value)} placeholder="%" />
          </div>
        </div>

        <div>
          <label className="label text-xs">Descripcion</label>
          <textarea className="input min-h-24 text-sm" value={form.descripcion} onChange={(e) => actualizar('descripcion', e.target.value)} placeholder="Contexto y alcance del indicador." />
        </div>
        <div>
          <label className="label text-xs">Meta descriptiva</label>
          <textarea className="input min-h-20 text-sm" value={form.meta_descripcion} onChange={(e) => actualizar('meta_descripcion', e.target.value)} placeholder="Describe la meta esperada." />
        </div>
        <div>
          <label className="label text-xs">Fuente de datos</label>
          <input className="input text-sm" value={form.fuente_datos} onChange={(e) => actualizar('fuente_datos', e.target.value)} placeholder="Sistema academico, encuesta, registro institucional..." />
        </div>

        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div className="flex justify-end gap-2">
          <Link href="/indicadores" className="btn-secondary text-sm">Cancelar</Link>
          <button type="submit" className="btn-primary gap-2 text-sm" disabled={guardando}>
            <Save className="w-4 h-4" />
            {guardando ? 'Guardando...' : 'Crear indicador'}
          </button>
        </div>
      </form>

      <div className="card p-4 text-sm text-gray-500 max-w-4xl">
        <div className="flex items-center gap-2 font-medium text-gray-700 mb-1">
          <BarChart2 className="w-4 h-4" /> Nota
        </div>
        Luego puedes registrar mediciones y revisar la tendencia desde el mantenedor principal.
      </div>
    </div>
  );
}
