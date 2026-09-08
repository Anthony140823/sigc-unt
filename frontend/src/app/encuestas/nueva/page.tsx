'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ClipboardList, Save } from 'lucide-react';
import { areasApi, catalogosApi, encuestasApi } from '@/lib/api/servicios';

type Opcion = { id: string; codigo?: string; nombre: string };
type Programa = { id: string; codigo?: string; nombre: string; facultades?: { nombre: string } };

const POBLACIONES = ['ESTUDIANTE', 'DOCENTE', 'EGRESADO', 'ADMINISTRATIVO', 'EXTERNO', 'TODOS'] as const;

export default function NuevaEncuestaPage() {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [areas, setAreas] = useState<Opcion[]>([]);
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    poblacion_objetivo: 'ESTUDIANTE',
    programa_id: '',
    area_id: '',
    ciclo_academico: '',
    fecha_inicio: '',
    fecha_fin: '',
    es_anonima: true,
  });

  useEffect(() => {
    const cargar = async () => {
      try {
        const [areasData, programasData] = await Promise.all([
          areasApi.listar(true),
          catalogosApi.programasAcademicos(),
        ]);
        setAreas(areasData as Opcion[]);
        setProgramas(programasData as Programa[]);
      } catch (err: any) {
        setError(err?.response?.data?.mensaje ?? err?.message ?? 'No se pudieron cargar los catalogos.');
      }
    };

    cargar();
  }, []);

  const actualizar = (campo: keyof typeof form, valor: string | boolean) =>
    setForm((prev) => ({ ...prev, [campo]: valor }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);

    try {
      await encuestasApi.crear({
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim() || undefined,
        poblacion_objetivo: form.poblacion_objetivo,
        programa_id: form.programa_id || undefined,
        area_id: form.area_id || undefined,
        ciclo_academico: form.ciclo_academico.trim() || undefined,
        fecha_inicio: form.fecha_inicio ? new Date(form.fecha_inicio).toISOString() : undefined,
        fecha_fin: form.fecha_fin ? new Date(form.fecha_fin).toISOString() : undefined,
        es_anonima: form.es_anonima,
      });

      router.push('/encuestas');
    } catch (err: any) {
      setError(err?.response?.data?.mensaje ?? err?.message ?? 'No se pudo crear la encuesta.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Nueva Encuesta</h2>
          <p className="text-sm text-gray-500">Registra la ficha base de la encuesta y luego completa sus secciones y preguntas.</p>
        </div>
        <Link href="/encuestas" className="btn-secondary gap-2 text-xs">
          <ArrowLeft className="w-3.5 h-3.5" /> Volver
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="card p-5 space-y-4 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label text-xs">Titulo *</label>
            <input
              className="input text-sm"
              required
              value={form.titulo}
              onChange={(e) => actualizar('titulo', e.target.value)}
              placeholder="Encuesta de satisfaccion estudiantil 2026-I"
            />
          </div>

          <div className="md:col-span-2">
            <label className="label text-xs">Descripcion</label>
            <textarea
              className="input min-h-24 text-sm"
              value={form.descripcion}
              onChange={(e) => actualizar('descripcion', e.target.value)}
              placeholder="Describe el objetivo de la encuesta."
            />
          </div>

          <div>
            <label className="label text-xs">Poblacion objetivo *</label>
            <select
              className="input text-sm"
              value={form.poblacion_objetivo}
              onChange={(e) => actualizar('poblacion_objetivo', e.target.value)}
            >
              {POBLACIONES.map((poblacion) => (
                <option key={poblacion} value={poblacion}>
                  {poblacion}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label text-xs">Ciclo academico</label>
            <input
              className="input text-sm"
              value={form.ciclo_academico}
              onChange={(e) => actualizar('ciclo_academico', e.target.value)}
              placeholder="2026-I"
            />
          </div>

          <div>
            <label className="label text-xs">Programa academico</label>
            <select
              className="input text-sm"
              value={form.programa_id}
              onChange={(e) => actualizar('programa_id', e.target.value)}
            >
              <option value="">Institucional / sin programa</option>
              {programas.map((programa) => (
                <option key={programa.id} value={programa.id}>
                  {programa.codigo ? `${programa.codigo} - ` : ''}{programa.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label text-xs">Area responsable</label>
            <select
              className="input text-sm"
              value={form.area_id}
              onChange={(e) => actualizar('area_id', e.target.value)}
            >
              <option value="">Sin area asignada</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.codigo ? `${area.codigo} - ` : ''}{area.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label text-xs">Fecha de inicio</label>
            <input
              type="date"
              className="input text-sm"
              value={form.fecha_inicio}
              onChange={(e) => actualizar('fecha_inicio', e.target.value)}
            />
          </div>

          <div>
            <label className="label text-xs">Fecha de fin</label>
            <input
              type="date"
              className="input text-sm"
              value={form.fecha_fin}
              onChange={(e) => actualizar('fecha_fin', e.target.value)}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.es_anonima}
            onChange={(e) => actualizar('es_anonima', e.target.checked)}
          />
          La encuesta es anonima
        </label>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Link href="/encuestas" className="btn-secondary text-sm">Cancelar</Link>
          <button type="submit" className="btn-primary gap-2 text-sm" disabled={guardando}>
            <Save className="w-4 h-4" />
            {guardando ? 'Guardando...' : 'Crear encuesta'}
          </button>
        </div>
      </form>

      <div className="card p-4 text-sm text-gray-500 max-w-4xl">
        <div className="mb-1 flex items-center gap-2 font-medium text-gray-700">
          <ClipboardList className="w-4 h-4" /> Nota
        </div>
        Al crear la encuesta quedara en estado diseno. Luego podras agregar secciones, preguntas y publicarla.
      </div>
    </div>
  );
}
