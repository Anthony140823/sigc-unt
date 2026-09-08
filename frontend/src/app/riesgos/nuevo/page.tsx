'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Shield } from 'lucide-react';
import { areasApi, procesosApi, riesgosApi } from '@/lib/api/servicios';

type Opcion = { id: string; codigo?: string; nombre: string };

const TIPOS_RIESGO = [
  'ESTRATEGICO',
  'OPERACIONAL',
  'FINANCIERO',
  'LEGAL',
  'REPUTACIONAL',
  'TI',
  'ACADEMICO',
];

export default function NuevoRiesgoPage() {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [areas, setAreas] = useState<Opcion[]>([]);
  const [procesos, setProcesos] = useState<Opcion[]>([]);
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    tipo_riesgo: 'OPERACIONAL',
    area_id: '',
    proceso_id: '',
    causa: '',
    consecuencia: '',
    probabilidad: '3',
    impacto: '3',
  });

  useEffect(() => {
    const cargar = async () => {
      try {
        const [areasData, procesosData] = await Promise.all([
          areasApi.listar(true),
          procesosApi.listar(),
        ]);
        setAreas(areasData as Opcion[]);
        setProcesos(procesosData as Opcion[]);
      } catch (err: any) {
        setError(err?.response?.data?.mensaje ?? err?.message ?? 'No se pudieron cargar los catalogos.');
      }
    };
    cargar();
  }, []);

  const actualizar = (campo: keyof typeof form, valor: string) =>
    setForm((prev) => ({ ...prev, [campo]: valor }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      await riesgosApi.crear({
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        tipo_riesgo: form.tipo_riesgo,
        area_id: form.area_id,
        proceso_id: form.proceso_id || undefined,
        causa: form.causa.trim() || undefined,
        consecuencia: form.consecuencia.trim() || undefined,
        probabilidad: Number(form.probabilidad),
        impacto: Number(form.impacto),
      });
      router.push('/riesgos');
    } catch (err: any) {
      setError(err?.response?.data?.mensaje ?? err?.message ?? 'No se pudo crear el riesgo.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Nuevo Riesgo</h2>
          <p className="text-sm text-gray-500">Registra un riesgo institucional y su evaluacion inicial.</p>
        </div>
        <Link href="/riesgos" className="btn-secondary gap-2 text-xs">
          <ArrowLeft className="w-3.5 h-3.5" /> Volver
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="card p-5 space-y-4 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label text-xs">Nombre *</label>
            <input className="input text-sm" required value={form.nombre} onChange={(e) => actualizar('nombre', e.target.value)} placeholder="Falla del sistema academico durante matricula" />
          </div>
          <div className="md:col-span-2">
            <label className="label text-xs">Descripcion *</label>
            <textarea className="input min-h-24 text-sm" required value={form.descripcion} onChange={(e) => actualizar('descripcion', e.target.value)} placeholder="Describe el riesgo identificado." />
          </div>
          <div>
            <label className="label text-xs">Tipo *</label>
            <select className="input text-sm" value={form.tipo_riesgo} onChange={(e) => actualizar('tipo_riesgo', e.target.value)}>
              {TIPOS_RIESGO.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
            </select>
          </div>
          <div>
            <label className="label text-xs">Area *</label>
            <select className="input text-sm" required value={form.area_id} onChange={(e) => actualizar('area_id', e.target.value)}>
              <option value="">Seleccione un area</option>
              {areas.map((area) => <option key={area.id} value={area.id}>{area.codigo ? `${area.codigo} - ` : ''}{area.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="label text-xs">Proceso relacionado</label>
            <select className="input text-sm" value={form.proceso_id} onChange={(e) => actualizar('proceso_id', e.target.value)}>
              <option value="">Sin proceso asociado</option>
              {procesos.map((proceso) => <option key={proceso.id} value={proceso.id}>{proceso.codigo ? `${proceso.codigo} - ` : ''}{proceso.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="label text-xs">Probabilidad (1-5) *</label>
            <input type="number" min="1" max="5" className="input text-sm" required value={form.probabilidad} onChange={(e) => actualizar('probabilidad', e.target.value)} />
          </div>
          <div>
            <label className="label text-xs">Impacto (1-5) *</label>
            <input type="number" min="1" max="5" className="input text-sm" required value={form.impacto} onChange={(e) => actualizar('impacto', e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label text-xs">Causa</label>
          <textarea className="input min-h-24 text-sm" value={form.causa} onChange={(e) => actualizar('causa', e.target.value)} placeholder="Principales causas del riesgo." />
        </div>
        <div>
          <label className="label text-xs">Consecuencia</label>
          <textarea className="input min-h-24 text-sm" value={form.consecuencia} onChange={(e) => actualizar('consecuencia', e.target.value)} placeholder="Impacto esperado si el riesgo se materializa." />
        </div>

        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div className="flex justify-end gap-2">
          <Link href="/riesgos" className="btn-secondary text-sm">Cancelar</Link>
          <button type="submit" className="btn-primary gap-2 text-sm" disabled={guardando}>
            <Save className="w-4 h-4" />
            {guardando ? 'Guardando...' : 'Crear riesgo'}
          </button>
        </div>
      </form>

      <div className="card p-4 text-sm text-gray-500 max-w-4xl">
        <div className="flex items-center gap-2 font-medium text-gray-700 mb-1">
          <Shield className="w-4 h-4" /> Nota
        </div>
        La matriz y los planes de mitigacion se completan despues desde el mantenedor.
      </div>
    </div>
  );
}
