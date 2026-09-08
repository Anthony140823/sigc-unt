'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Save, Loader2 } from 'lucide-react';
import { areasApi, catalogosApi, documentosApi, procesosApi } from '@/lib/api/servicios';

function separarLista(valor: string) {
  return valor.split(',').map((item) => item.trim()).filter(Boolean);
}

export default function NuevoDocumentoPage() {
  const router = useRouter();
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [areas, setAreas] = useState<any[]>([]);
  const [procesos, setProcesos] = useState<any[]>([]);
  const [tipos, setTipos] = useState<any[]>([]);
  const [form, setForm] = useState({
    codigo: '',
    tipo_documento_id: '',
    titulo: '',
    descripcion: '',
    area_id: '',
    proceso_id: '',
    palabras_clave: '',
    aplica_a: '',
  });

  useEffect(() => {
    let activo = true;
    const cargar = async () => {
      try {
        const [areasData, procesosData, tiposData] = await Promise.all([
          areasApi.listar(true),
          procesosApi.listar(),
          catalogosApi.tiposDocumento(),
        ]);
        if (!activo) return;
        console.log('[NuevoDoc] datos cargados:', {
          areas: Array.isArray(areasData) ? areasData.length : typeof areasData,
          procesos: Array.isArray(procesosData) ? procesosData.length : typeof procesosData,
          tipos: Array.isArray(tiposData) ? tiposData.length : typeof tiposData,
        });
        setAreas(Array.isArray(areasData) ? areasData : []);
        setProcesos(Array.isArray(procesosData) ? procesosData : []);
        setTipos(Array.isArray(tiposData) ? tiposData : []);
      } catch (err: any) {
        if (!activo) return;
        console.error('[NuevoDoc] Error cargando catálogos:', err);
        setError(err?.response?.data?.mensaje ?? err?.message ?? 'No se pudieron cargar los catalogos.');
      } finally {
        if (activo) setCargandoCatalogos(false);
      }
    };
    cargar();
    return () => { activo = false; };
  }, []);

  const actualizar = (campo: keyof typeof form, valor: string) =>
    setForm((prev) => ({ ...prev, [campo]: valor }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      await documentosApi.crear({
        codigo: form.codigo.trim().toUpperCase(),
        tipo_documento_id: Number(form.tipo_documento_id),
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim() || undefined,
        area_id: form.area_id,
        proceso_id: form.proceso_id || undefined,
        palabras_clave: separarLista(form.palabras_clave),
        aplica_a: separarLista(form.aplica_a),
      });
      router.push('/documentos');
    } catch (err: any) {
      setError(err?.response?.data?.mensaje ?? err?.message ?? 'No se pudo crear el documento.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Nuevo Documento</h2>
          <p className="text-sm text-gray-500">Crea el metadato inicial del documento en estado borrador.</p>
        </div>
        <Link href="/documentos" className="btn-secondary gap-2 text-xs">
          <ArrowLeft className="w-3.5 h-3.5" /> Volver
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="card p-5 space-y-4 max-w-4xl" key={cargandoCatalogos ? 'loading' : `loaded-${tipos.length}-${areas.length}-${procesos.length}`}>
        {cargandoCatalogos && (
          <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Cargando catálogos...
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label text-xs">Codigo *</label>
            <input className="input text-sm" required value={form.codigo} onChange={(e) => actualizar('codigo', e.target.value)} placeholder="POL-GD-001" />
          </div>
          <div>
            <label className="label text-xs">Tipo de documento * ({tipos.length} cargados)</label>
            <select
              className="input text-sm"
              required
              value={form.tipo_documento_id}
              onChange={(e) => actualizar('tipo_documento_id', e.target.value)}
            >
              <option value="">Seleccione un tipo</option>
              {tipos.map((tipo: any) => (
                <option key={tipo.id} value={String(tipo.id)}>
                  {tipo.codigo ? `${tipo.codigo} - ` : ''}{tipo.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="label text-xs">Titulo *</label>
            <input className="input text-sm" required value={form.titulo} onChange={(e) => actualizar('titulo', e.target.value)} placeholder="Politica de Control Documental" />
          </div>
          <div>
            <label className="label text-xs">Area propietaria * ({areas.length} cargadas)</label>
            <select className="input text-sm" required value={form.area_id} onChange={(e) => actualizar('area_id', e.target.value)}>
              <option value="">Seleccione un area</option>
              {areas.map((area: any) => <option key={area.id} value={String(area.id)}>{area.codigo ? `${area.codigo} - ` : ''}{area.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="label text-xs">Proceso asociado ({procesos.length} cargados)</label>
            <select className="input text-sm" value={form.proceso_id} onChange={(e) => actualizar('proceso_id', e.target.value)}>
              <option value="">Sin proceso asociado</option>
              {procesos.map((proceso: any) => <option key={proceso.id} value={String(proceso.id)}>{proceso.codigo ? `${proceso.codigo} - ` : ''}{proceso.nombre}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="label text-xs">Descripcion</label>
          <textarea className="input min-h-24 text-sm" value={form.descripcion} onChange={(e) => actualizar('descripcion', e.target.value)} placeholder="Describe el proposito del documento." />
        </div>
        <div>
          <label className="label text-xs">Palabras clave</label>
          <input className="input text-sm" value={form.palabras_clave} onChange={(e) => actualizar('palabras_clave', e.target.value)} placeholder="calidad, documentos, procedimiento" />
        </div>
        <div>
          <label className="label text-xs">Aplica a</label>
          <input className="input text-sm" value={form.aplica_a} onChange={(e) => actualizar('aplica_a', e.target.value)} placeholder="Todas las areas, FAC-IND" />
        </div>

        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div className="flex justify-end gap-2">
          <Link href="/documentos" className="btn-secondary text-sm">Cancelar</Link>
          <button type="submit" className="btn-primary gap-2 text-sm" disabled={guardando}>
            <Save className="w-4 h-4" />
            {guardando ? 'Guardando...' : 'Crear documento'}
          </button>
        </div>
      </form>

      <div className="card p-4 text-sm text-gray-500 max-w-4xl">
        <div className="flex items-center gap-2 font-medium text-gray-700 mb-1">
          <FileText className="w-4 h-4" /> Nota
        </div>
        La carga del archivo y el control de versiones se realiza despues desde el detalle del documento.
      </div>
    </div>
  );
}
