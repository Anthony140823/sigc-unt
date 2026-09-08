'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Building2, Pencil, RefreshCw, X, ArrowLeft, FileDown, FileSpreadsheet } from 'lucide-react';
import { useAreas, useArbolAreas } from '@/lib/hooks';
import { areasApi, descargarArchivo } from '@/lib/api/servicios';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils/cn';
import type { Area } from '@/lib/types';

const TIPOS_AREA = ['RECTORADO','VICERRECTORADO','DECANATO','DIRECCION','OFICINA','DPTO_ACADEMICO'];

function ModalArea({
  area, onClose,
}: {
  area?: Area;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { data: facultades = [] } = useArbolAreas();
  const { data: todas = [] } = useAreas(false);

  const [form, setForm] = useState({
    codigo: area?.codigo ?? '',
    nombre: area?.nombre ?? '',
    nombre_corto: area?.nombre_corto ?? '',
    tipo_area: area?.tipo_area ?? 'OFICINA',
    facultad_id: area?.facultad_id ?? '',
    area_padre_id: area?.area_padre_id ?? '',
    responsable_nombre: area?.responsable_nombre ?? '',
    email: area?.email ?? '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const padresDisponibles = (todas as Area[]).filter((a) =>
    a.id !== area?.id && a.esta_activo
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      const payload = { ...form, facultad_id: form.facultad_id || undefined, area_padre_id: form.area_padre_id || undefined };
      if (area) {
        await areasApi.actualizar(area.id, payload);
      } else {
        await areasApi.crear(payload);
      }
      qc.invalidateQueries({ queryKey: ['areas'] });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.mensaje ?? err?.message ?? 'Error al guardar');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-5 py-4 border-b border-gray-100 sticky top-0 bg-white flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            {area ? 'Editar área' : 'Nueva área'}
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label text-xs">Código *</label>
              <input type="text" className="input text-xs" required placeholder="OCAL"
                value={form.codigo} onChange={(e) => setForm(f => ({ ...f, codigo: e.target.value }))} />
            </div>
            <div>
              <label className="label text-xs">Tipo *</label>
              <select className="input text-xs" value={form.tipo_area}
                onChange={(e) => setForm(f => ({ ...f, tipo_area: e.target.value }))}>
                {TIPOS_AREA.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label text-xs">Nombre *</label>
            <input type="text" className="input text-xs" required placeholder="Oficina Central de Calidad"
              value={form.nombre} onChange={(e) => setForm(f => ({ ...f, nombre: e.target.value }))} />
          </div>
          <div>
            <label className="label text-xs">Nombre corto</label>
            <input type="text" className="input text-xs" placeholder="Of. Calidad"
              value={form.nombre_corto} onChange={(e) => setForm(f => ({ ...f, nombre_corto: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label text-xs">Facultad</label>
              <select className="input text-xs" value={form.facultad_id}
                onChange={(e) => setForm(f => ({ ...f, facultad_id: e.target.value }))}>
                <option value="">Sin facultad</option>
                {(facultades as any[]).filter((f: any) => f.facultades).map((f: any) => (
                  <option key={f.id} value={f.facultad_id}>{f.facultades?.nombre_corto ?? f.facultades?.codigo}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label text-xs">Área padre</label>
              <select className="input text-xs" value={form.area_padre_id}
                onChange={(e) => setForm(f => ({ ...f, area_padre_id: e.target.value }))}>
                <option value="">Ninguna (raíz)</option>
                {padresDisponibles.map((a) => (
                  <option key={a.id} value={a.id}>{a.codigo} - {a.nombre}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label text-xs">Responsable</label>
              <input type="text" className="input text-xs" placeholder="Nombre del responsable"
                value={form.responsable_nombre} onChange={(e) => setForm(f => ({ ...f, responsable_nombre: e.target.value }))} />
            </div>
            <div>
              <label className="label text-xs">Email</label>
              <input type="email" className="input text-xs" placeholder="correo@unitru.edu.pe"
                value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
          </div>
          {error && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" className="btn-secondary text-xs py-1.5" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary text-xs py-1.5" disabled={saving}>
              {saving ? 'Guardando...' : area ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AreasPage() {
  const qc = useQueryClient();
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroActivos, setFiltroActivos] = useState(true);
  const [modalArea, setModalArea] = useState<Area | undefined>(undefined);
  const [modalNueva, setModalNueva] = useState(false);

  const { data: areas = [], isLoading } = useAreas(false);

  const filtrar = (areas as Area[]).filter((a) => {
    if (busqueda && !a.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
        !a.codigo.toLowerCase().includes(busqueda.toLowerCase())) return false;
    if (filtroTipo && a.tipo_area !== filtroTipo) return false;
    if (filtroActivos && !a.esta_activo) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/mantenedores" className="btn-secondary gap-1.5 text-xs py-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Mantenedores
          </Link>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Áreas</h2>
            <p className="text-xs text-gray-400 mt-0.5">{filtrar.length} áreas encontradas</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { qc.invalidateQueries({ queryKey: ['areas'] }); }}
            className="btn-secondary gap-1.5 text-xs py-1.5"><RefreshCw className="w-3.5 h-3.5" /></button>
          <button onClick={() => descargarArchivo('/areas/exportar/csv', 'areas.csv')} className="btn-secondary gap-1.5 text-xs py-1.5" title="Exportar CSV">
            <FileDown className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => descargarArchivo('/areas/exportar/xlsx', 'areas.xlsx')} className="btn-secondary gap-1.5 text-xs py-1.5" title="Exportar Excel">
            <FileSpreadsheet className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setModalNueva(true)} className="btn-primary gap-2 text-xs">
            <Plus className="w-3.5 h-3.5" /> Nueva área
          </button>
        </div>
      </div>

      <div className="card p-3 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input type="search" placeholder="Buscar por nombre o código..."
            className="input pl-8 text-xs py-1.5"
            value={busqueda} onChange={(e) => setBusqueda(e.target.value)} aria-label="Buscar áreas" />
        </div>
        <select className="input text-xs py-1.5 w-36" value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)} aria-label="Filtrar por tipo">
          <option value="">Todos los tipos</option>
          {TIPOS_AREA.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
        </select>
        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 rounded text-blue-600"
            checked={filtroActivos} onChange={(e) => setFiltroActivos(e.target.checked)} />
          Solo activos
        </label>
      </div>

      <div className="card overflow-hidden">
        <table className="tabla" aria-label="Áreas">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Facultad</th>
              <th>Área padre</th>
              <th>Responsable</th>
              <th>Estado</th>
              <th><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j}><div className="skeleton h-4 rounded w-full" /></td>
                    ))}
                  </tr>
                ))
              : filtrar.length === 0
              ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-sm text-gray-400">
                      <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      No se encontraron áreas con los filtros aplicados.
                    </td>
                  </tr>
                )
              : filtrar.map((a: any) => (
                  <tr key={a.id} className={cn(!a.esta_activo && 'opacity-50')}>
                    <td><span className="font-mono text-xs text-gray-600">{a.codigo}</span></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-800">{a.nombre}</span>
                      </div>
                    </td>
                    <td><span className="badge-gris text-xs">{a.tipo_area.replace('_', ' ')}</span></td>
                    <td><span className="text-xs text-gray-600">{a.facultades?.nombre_corto ?? a.facultades?.nombre ?? '—'}</span></td>
                    <td><span className="text-xs text-gray-500">{a.areas?.nombre ?? '—'}</span></td>
                    <td><span className="text-xs text-gray-500">{a.responsable_nombre ?? '—'}</span></td>
                    <td>
                      <span className={cn('text-xs font-medium px-2.5 py-0.5 rounded-full',
                        a.esta_activo ? 'badge-verde' : 'badge-rojo')}>
                        {a.esta_activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => setModalArea(a)}
                        className="p-1.5 rounded hover:bg-gray-100 text-blue-600" title="Editar">
                        <Pencil className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>

      {modalNueva && <ModalArea onClose={() => setModalNueva(false)} />}
      {modalArea && <ModalArea area={modalArea} onClose={() => setModalArea(undefined)} />}
    </div>
  );
}
