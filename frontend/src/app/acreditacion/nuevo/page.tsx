'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Award, Save } from 'lucide-react';
import { acreditacionApi, catalogosApi } from '@/lib/api/servicios';

type Programa = { id: string; codigo: string; nombre: string; nivel?: string; modalidad?: string };
type Estandar = { id: number; codigo: string; nombre: string; organismo?: string; version?: string };

const TIPOS_PROCESO = ['AUTOEVALUACION', 'EVALUACION_EXTERNA', 'ACREDITACION', 'REACREDITACION'];

export default function NuevoProcesoAcreditacionPage() {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [estandares, setEstandares] = useState<Estandar[]>([]);
  const [form, setForm] = useState({
    programa_id: '',
    estandar_id: '',
    tipo_proceso: 'AUTOEVALUACION',
    anio_inicio: String(new Date().getFullYear()),
    fecha_inicio: '',
    fecha_visita_externa: '',
    fecha_vencimiento: '',
  });

  useEffect(() => {
    const cargar = async () => {
      try {
        const [programasData, estandaresData] = await Promise.all([
          catalogosApi.programasAcademicos(),
          catalogosApi.estandaresAcreditacion(),
        ]);
        setProgramas(programasData as Programa[]);
        setEstandares(estandaresData as Estandar[]);
      } catch (err: any) {
        setError(err?.response?.data?.mensaje ?? err?.message ?? 'No se pudieron cargar los catalogos.');
      }
    };
    cargar();
  }, []);

  const actualizar = (campo: keyof typeof form, valor: string) =>
    setForm((prev) => ({ ...prev, [campo]: valor }));

  const catalogosIncompletos = programas.length === 0 || estandares.length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      await acreditacionApi.iniciarProceso({
        programa_id: form.programa_id,
        estandar_id: Number(form.estandar_id),
        tipo_proceso: form.tipo_proceso,
        anio_inicio: Number(form.anio_inicio),
        fecha_inicio: form.fecha_inicio || undefined,
        fecha_visita_externa: form.fecha_visita_externa || undefined,
        fecha_vencimiento: form.fecha_vencimiento || undefined,
      });
      router.push('/acreditacion');
    } catch (err: any) {
      setError(err?.response?.data?.mensaje ?? err?.message ?? 'No se pudo iniciar el proceso de acreditacion.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Iniciar Proceso de Acreditacion</h2>
          <p className="text-sm text-gray-500">Selecciona programa, estandar y cronograma base.</p>
        </div>
        <Link href="/acreditacion" className="btn-secondary gap-2 text-xs">
          <ArrowLeft className="w-3.5 h-3.5" /> Volver
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="card p-5 space-y-4 max-w-4xl">
        {catalogosIncompletos && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            No hay programas academicos activos cargados para iniciar un proceso de acreditacion. La ruta ya esta corregida, pero debes sembrar programas para usar este formulario.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label text-xs">Programa academico *</label>
            <select className="input text-sm" required value={form.programa_id} onChange={(e) => actualizar('programa_id', e.target.value)}>
              <option value="">Seleccione un programa</option>
              {programas.map((programa) => (
                <option key={programa.id} value={programa.id}>
                  {programa.codigo} - {programa.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label text-xs">Estandar *</label>
            <select className="input text-sm" required value={form.estandar_id} onChange={(e) => actualizar('estandar_id', e.target.value)}>
              <option value="">Seleccione un estandar</option>
              {estandares.map((estandar) => (
                <option key={estandar.id} value={String(estandar.id)}>
                  {estandar.organismo ? `${estandar.organismo} - ` : ''}{estandar.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label text-xs">Tipo de proceso *</label>
            <select className="input text-sm" value={form.tipo_proceso} onChange={(e) => actualizar('tipo_proceso', e.target.value)}>
              {TIPOS_PROCESO.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
            </select>
          </div>
          <div>
            <label className="label text-xs">Anio de inicio *</label>
            <input type="number" min="2020" max="2040" className="input text-sm" required value={form.anio_inicio} onChange={(e) => actualizar('anio_inicio', e.target.value)} />
          </div>
          <div>
            <label className="label text-xs">Fecha de inicio</label>
            <input type="date" className="input text-sm" value={form.fecha_inicio} onChange={(e) => actualizar('fecha_inicio', e.target.value)} />
          </div>
          <div>
            <label className="label text-xs">Fecha de visita externa</label>
            <input type="date" className="input text-sm" value={form.fecha_visita_externa} onChange={(e) => actualizar('fecha_visita_externa', e.target.value)} />
          </div>
          <div>
            <label className="label text-xs">Fecha de vencimiento</label>
            <input type="date" className="input text-sm" value={form.fecha_vencimiento} onChange={(e) => actualizar('fecha_vencimiento', e.target.value)} />
          </div>
        </div>

        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div className="flex justify-end gap-2">
          <Link href="/acreditacion" className="btn-secondary text-sm">Cancelar</Link>
          <button type="submit" className="btn-primary gap-2 text-sm" disabled={guardando || catalogosIncompletos}>
            <Save className="w-4 h-4" />
            {guardando ? 'Guardando...' : 'Iniciar proceso'}
          </button>
        </div>
      </form>

      <div className="card p-4 text-sm text-gray-500 max-w-4xl">
        <div className="flex items-center gap-2 font-medium text-gray-700 mb-1">
          <Award className="w-4 h-4" /> Nota
        </div>
        El detalle, matriz de cumplimiento y autoevaluaciones se gestionan despues desde el proceso creado.
      </div>
    </div>
  );
}
