'use client';
import { useState, useEffect, useCallback } from 'react';
import { Database, Plus, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { catalogosApi } from '@/lib/api/servicios';
import { useAuthStore } from '@/lib/store/auth.store';

type Pestana = 'tipos-doc' | 'frecuencias' | 'tipos-aud' | 'estandares' | 'objetivos';

const PESTANAS: { id: Pestana; label: string }[] = [
  { id: 'tipos-doc', label: 'Tipos Documento' },
  { id: 'frecuencias', label: 'Frecuencias' },
  { id: 'tipos-aud', label: 'Tipos Auditoría' },
  { id: 'estandares', label: 'Estándares' },
  { id: 'objetivos', label: 'Objetivos Estratégicos' },
];

interface CatalogoCrud {
  listar: () => Promise<any>;
  crear: (data: any) => Promise<any>;
  actualizar: (id: any, data: any) => Promise<any>;
  eliminar: (id: any) => Promise<any>;
}

const CRUD_MAP: Record<Pestana, CatalogoCrud> = {
  'tipos-doc':   { listar: catalogosApi.tiposDocumento, crear: catalogosApi.crearTipoDocumento, actualizar: catalogosApi.actualizarTipoDocumento, eliminar: catalogosApi.eliminarTipoDocumento },
  'frecuencias': { listar: catalogosApi.frecuenciasMedicion, crear: catalogosApi.crearFrecuencia, actualizar: catalogosApi.actualizarFrecuencia, eliminar: catalogosApi.eliminarFrecuencia },
  'tipos-aud':   { listar: catalogosApi.tiposAuditoria, crear: catalogosApi.crearTipoAuditoria, actualizar: catalogosApi.actualizarTipoAuditoria, eliminar: catalogosApi.eliminarTipoAuditoria },
  'estandares':  { listar: catalogosApi.estandaresAcreditacion, crear: catalogosApi.crearEstandar, actualizar: catalogosApi.actualizarEstandar, eliminar: catalogosApi.eliminarEstandar },
  'objetivos':   { listar: catalogosApi.objetivosEstrategicos, crear: catalogosApi.crearObjetivo, actualizar: catalogosApi.actualizarObjetivo, eliminar: catalogosApi.eliminarObjetivo },
};

function getDefaultFields(pestana: Pestana): Record<string, string> {
  switch (pestana) {
    case 'tipos-doc': return { codigo: '', nombre: '', prefijo: '', requiere_aprobacion: 'false' };
    case 'frecuencias': return { codigo: '', nombre: '', dias_periodo: '' };
    case 'tipos-aud': return { codigo: '', nombre: '', descripcion: '' };
    case 'estandares': return { codigo: '', nombre: '', organismo: '', version: '' };
    case 'objetivos': return { codigo: '', nombre: '', descripcion: '', perspectiva: 'Clientes', anio_pei: '2025' };
  }
}

function getFieldMeta(pestana: Pestana): { key: string; label: string; type?: string }[] {
  switch (pestana) {
    case 'tipos-doc': return [
      { key: 'codigo', label: 'Código' }, { key: 'nombre', label: 'Nombre' },
      { key: 'prefijo', label: 'Prefijo' }, { key: 'requiere_aprobacion', label: 'Requiere aprobación', type: 'boolean' },
    ];
    case 'frecuencias': return [
      { key: 'codigo', label: 'Código' }, { key: 'nombre', label: 'Nombre' },
      { key: 'dias_periodo', label: 'Días por período', type: 'number' },
    ];
    case 'tipos-aud': return [
      { key: 'codigo', label: 'Código' }, { key: 'nombre', label: 'Nombre' },
      { key: 'descripcion', label: 'Descripción' },
    ];
    case 'estandares': return [
      { key: 'codigo', label: 'Código' }, { key: 'nombre', label: 'Nombre' },
      { key: 'organismo', label: 'Organismo' }, { key: 'version', label: 'Versión' },
    ];
    case 'objetivos': return [
      { key: 'codigo', label: 'Código' }, { key: 'nombre', label: 'Nombre' },
      { key: 'descripcion', label: 'Descripción' },
      { key: 'perspectiva', label: 'Perspectiva' },
      { key: 'anio_pei', label: 'Año PEI', type: 'number' },
    ];
  }
}

function getTableHeaders(pestana: Pestana): string[] {
  return getFieldMeta(pestana).map((f) => f.label);
}

function getTableRow(item: any, pestana: Pestana): string[] {
  return getFieldMeta(pestana).map((f) => {
    const v = item[f.key];
    if (f.type === 'boolean') return v ? 'Sí' : 'No';
    return v ?? '—';
  });
}

export default function CatalogosPage() {
  const { tieneRol } = useAuthStore();
  const puedeAdmin = tieneRol(['SUPERADMIN', 'ADMIN_CALIDAD']);
  const [pestana, setPestana] = useState<Pestana>('tipos-doc');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setLoading(true);
    try { const d = await CRUD_MAP[pestana].listar(); setItems(d as any); } catch { setItems([]); }
    setLoading(false);
  }, [pestana]);

  useEffect(() => { cargar(); }, [cargar]);

  const openNew = () => {
    setEditItem(null);
    setForm(getDefaultFields(pestana));
    setShowForm(true);
    setError('');
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    const f: Record<string, string> = {};
    for (const meta of getFieldMeta(pestana)) {
      f[meta.key] = String(item[meta.key] ?? '');
    }
    setForm(f);
    setShowForm(true);
    setError('');
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const data: any = {};
      for (const meta of getFieldMeta(pestana)) {
        const v = form[meta.key];
        data[meta.key] = meta.type === 'number' ? Number(v) : meta.type === 'boolean' ? v === 'true' : v;
      }
      if (editItem) {
        if (!data.codigo) delete data.codigo;
        await CRUD_MAP[pestana].actualizar(editItem.id, data);
      } else {
        await CRUD_MAP[pestana].crear(data);
      }
      setShowForm(false);
      cargar();
    } catch (e: any) {
      setError(e?.response?.data?.mensaje ?? 'Error al guardar');
    } finally { setSaving(false); }
  };

  const handleDelete = async (item: any) => {
    if (!confirm(`¿Eliminar "${item.nombre || item.codigo}"?`)) return;
    try {
      await CRUD_MAP[pestana].eliminar(item.id);
      cargar();
    } catch (e: any) { alert(e?.response?.data?.mensaje ?? 'Error al eliminar'); }
  };

  const headers = getTableHeaders(pestana);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Catálogos del Sistema</h2>
          <p className="text-xs text-gray-400 mt-0.5">{items.length} registros en {PESTANAS.find((p) => p.id === pestana)?.label}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={cargar} className="btn-secondary gap-1.5 text-xs py-1.5"><RefreshCw className="w-3.5 h-3.5" /></button>
          {puedeAdmin && !showForm && (
            <button onClick={openNew} className="btn-primary gap-2 text-xs"><Plus className="w-3.5 h-3.5" /> Nuevo</button>
          )}
        </div>
      </div>

      {/* Pestañas */}
      <div className="flex gap-1 p-0.5 bg-gray-100 rounded-lg overflow-x-auto">
        {PESTANAS.map((p) => (
          <button key={p.id} onClick={() => { setPestana(p.id); setShowForm(false); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              pestana === p.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >{p.label}</button>
        ))}
      </div>

      {showForm && (
        <div className="card p-4 space-y-3 border border-blue-200 bg-blue-50/30">
          <h3 className="text-sm font-semibold text-gray-900">
            {editItem ? 'Editar' : 'Nuevo'} {PESTANAS.find((p) => p.id === pestana)?.label}
          </h3>
          {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {getFieldMeta(pestana).map((meta) => (
              <div key={meta.key}>
                <label className="label text-xs">{meta.label} {meta.key === 'codigo' && !editItem ? '*' : ''}</label>
                {meta.type === 'boolean' ? (
                  <select className="input text-xs" value={form[meta.key] ?? 'false'}
                    onChange={(e) => setForm({ ...form, [meta.key]: e.target.value })}>
                    <option value="true">Sí</option>
                    <option value="false">No</option>
                  </select>
                ) : (
                  <input type={meta.type === 'number' ? 'number' : 'text'} className="input text-xs"
                    value={form[meta.key] ?? ''} placeholder={meta.label}
                    onChange={(e) => setForm({ ...form, [meta.key]: e.target.value })}
                    disabled={meta.key === 'codigo' && !!editItem} />
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <button className="btn-secondary text-xs py-1.5" onClick={() => setShowForm(false)}>Cancelar</button>
            <button className="btn-primary text-xs py-1.5" disabled={saving || !form.codigo?.trim()}
              onClick={handleSave}>{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="tabla">
          <thead>
            <tr>
              {headers.map((h) => <th key={h}>{h}</th>)}
              {puedeAdmin && <th><span className="sr-only">Acciones</span></th>}
            </tr>
          </thead>
          <tbody>
            {loading ? Array.from({ length: 4 }).map((_, i) => (
              <tr key={i}>{Array.from({ length: headers.length + 1 }).map((__, j) => <td key={j}><div className="skeleton h-4 rounded" /></td>)}</tr>
            )) : items.length === 0 ? (
              <tr><td colSpan={headers.length + (puedeAdmin ? 1 : 0)} className="py-12 text-center text-sm text-gray-400">
                <Database className="w-8 h-8 mx-auto mb-2 text-gray-300" />Sin registros.
              </td></tr>
            ) : items.map((item: any, idx: number) => (
              <tr key={item.id ?? idx}>
                {getTableRow(item, pestana).map((val, ci) => (
                  <td key={ci}><span className="text-xs text-gray-700 truncate max-w-40 block">{val}</span></td>
                ))}
                {puedeAdmin && (
                  <td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-gray-100 text-blue-600" title="Editar"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(item)} className="p-1.5 rounded hover:bg-gray-100 text-red-500" title="Eliminar"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
