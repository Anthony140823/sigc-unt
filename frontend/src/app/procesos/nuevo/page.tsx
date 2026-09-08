'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GitBranch, ArrowLeft, Save } from 'lucide-react';
import { areasApi, procesosApi } from '@/lib/api/servicios';

type Opcion = { id: string; codigo?: string; nombre: string };

export default function NuevoProcesoPage() {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [areas, setAreas] = useState<Opcion[]>([]);
  const [macroprocesos, setMacroprocesos] = useState<Opcion[]>([]);
  const [form, setForm] = useState({
    macroproceso_id: '',
    codigo: '',
    nombre: '',
    objetivo: '',
    alcance: '',
    area_responsable_id: '',
  });

  useEffect(() => {
    const cargar = async () => {
      try {
        const [areasData, macroData] = await Promise.all([
          areasApi.listar(true),
          procesosApi.listarMacroprocesos(),
        ]);
        setAreas(areasData as Opcion[]);
        setMacroprocesos(macroData as Opcion[]);
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
      await procesosApi.crear({
        macroproceso_id: form.macroproceso_id,
        codigo: form.codigo.trim(),
        nombre: form.nombre.trim(),
        objetivo: form.objetivo.trim() || undefined,
        alcance: form.alcance.trim() || undefined,
        area_responsable_id: form.area_responsable_id,
      });
      router.push('/procesos');
    } catch (err: any) {
      setError(err?.response?.data?.mensaje ?? err?.message ?? 'No se pudo crear el proceso.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Nuevo Proceso</h2>
          <p className="text-sm text-gray-500">Registra un proceso dentro de un macroproceso existente.</p>
        </div>
        <Link href="/procesos" className="btn-secondary gap-2 text-xs">
          <ArrowLeft className="w-3.5 h-3.5" /> Volver
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="card p-5 space-y-4 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label text-xs">Macroproceso *</label>
            <select className="input text-sm" required value={form.macroproceso_id} onChange={(e) => actualizar('macroproceso_id', e.target.value)}>
              <option value="">Seleccione un macroproceso</option>
              {macroprocesos.map((macro) => (
                <option key={macro.id} value={macro.id}>
                  {macro.codigo ? `${macro.codigo} - ` : ''}{macro.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label text-xs">Area responsable *</label>
            <select className="input text-sm" required value={form.area_responsable_id} onChange={(e) => actualizar('area_responsable_id', e.target.value)}>
              <option value="">Seleccione un area</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.codigo ? `${area.codigo} - ` : ''}{area.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label text-xs">Codigo *</label>
            <input className="input text-sm" required value={form.codigo} onChange={(e) => actualizar('codigo', e.target.value)} placeholder="PRO-MIS-001" />
          </div>
          <div>
            <label className="label text-xs">Nombre *</label>
            <input className="input text-sm" required value={form.nombre} onChange={(e) => actualizar('nombre', e.target.value)} placeholder="Proceso de matricula" />
          </div>
        </div>

        <div>
          <label className="label text-xs">Objetivo</label>
          <textarea className="input min-h-24 text-sm" value={form.objetivo} onChange={(e) => actualizar('objetivo', e.target.value)} placeholder="Describe el objetivo del proceso." />
        </div>

        <div>
          <label className="label text-xs">Alcance</label>
          <textarea className="input min-h-24 text-sm" value={form.alcance} onChange={(e) => actualizar('alcance', e.target.value)} placeholder="Indica el alcance del proceso." />
        </div>

        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div className="flex justify-end gap-2">
          <Link href="/procesos" className="btn-secondary text-sm">Cancelar</Link>
          <button type="submit" className="btn-primary gap-2 text-sm" disabled={guardando}>
            <Save className="w-4 h-4" />
            {guardando ? 'Guardando...' : 'Crear proceso'}
          </button>
        </div>
      </form>

      <div className="card p-4 text-sm text-gray-500 max-w-4xl">
        <div className="flex items-center gap-2 font-medium text-gray-700 mb-1">
          <GitBranch className="w-4 h-4" /> Nota
        </div>
        Luego puedes completar detalles avanzados del proceso desde el listado principal.
      </div>
    </div>
  );
}
