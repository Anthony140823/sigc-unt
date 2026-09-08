'use client';
import { useState, useEffect } from 'react';
import { Shield, Plus, Pencil, Trash2, RefreshCw, Search } from 'lucide-react';
import { catalogosApi } from '@/lib/api/servicios';
import { useAuthStore } from '@/lib/store/auth.store';
import { cn } from '@/lib/utils/cn';

interface Rol {
  id: number; codigo: string; nombre: string; descripcion?: string;
  nivel_jerarquia: number; esta_activo?: boolean;
}

function ModalRol({ rol, onClose, onSaved }: { rol?: Rol; onClose: () => void; onSaved: () => void }) {
  const [nombre, setNombre] = useState(rol?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(rol?.descripcion ?? '');
  const [nivel, setNivel] = useState(String(rol?.nivel_jerarquia ?? ''));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!nombre.trim()) return;
    setGuardando(true); setError('');
    try {
      if (rol) {
        await catalogosApi.actualizarRol(rol.id, { nombre, descripcion, nivel_jerarquia: nivel ? Number(nivel) : undefined });
      } else {
        await catalogosApi.crearRol({ codigo: nombre.toUpperCase().replace(/\s+/g, '_').slice(0, 30), nombre, descripcion, nivel_jerarquia: nivel ? Number(nivel) : undefined });
      }
      onSaved();
    } catch (e: any) {
      setError(e?.response?.data?.mensaje ?? 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold">{rol ? 'Editar rol' : 'Nuevo rol'}</h3>
        </div>
        <div className="p-5 space-y-3">
          {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>}
          {!rol && (
            <div>
              <label className="label text-xs">Código (generado automáticamente)</label>
              <input type="text" className="input text-xs bg-gray-50"
                value={nombre.toUpperCase().replace(/\s+/g, '_').slice(0, 30)} disabled />
            </div>
          )}
          <div>
            <label className="label text-xs">Nombre del rol *</label>
            <input type="text" className="input text-xs" value={nombre}
              onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Auditor Líder" />
          </div>
          <div>
            <label className="label text-xs">Descripción</label>
            <textarea className="input text-xs" rows={2} value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)} />
          </div>
          <div>
            <label className="label text-xs">Nivel jerárquico (1 = mayor)</label>
            <input type="number" min="1" className="input text-xs" value={nivel}
              onChange={(e) => setNivel(e.target.value)} placeholder="Ej: 5" />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" className="btn-secondary text-xs py-1.5" onClick={onClose}>Cancelar</button>
            <button type="button" className="btn-primary text-xs py-1.5" disabled={guardando || !nombre.trim()} onClick={handleSave}>
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RolesPage() {
  const { tieneRol } = useAuthStore();
  const puedeAdmin = tieneRol(['SUPERADMIN', 'ADMIN_CALIDAD']);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [modal, setModal] = useState<{ rol?: Rol } | null>(null);

  const cargar = async () => {
    setLoading(true);
    try {
      const data = await catalogosApi.roles();
      setRoles(data as any);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const handleEliminar = async (r: Rol) => {
    if (!confirm(`¿Eliminar el rol "${r.nombre}"?`)) return;
    try {
      await catalogosApi.eliminarRol(r.id);
      cargar();
    } catch (e: any) {
      alert(e?.response?.data?.mensaje ?? 'Error al eliminar');
    }
  };

  const filtrados = roles.filter((r) =>
    !busqueda || r.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    r.codigo.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Roles del Sistema</h2>
          <p className="text-xs text-gray-400 mt-0.5">{roles.length} roles registrados</p>
        </div>
        <div className="flex gap-2">
          <button onClick={cargar} className="btn-secondary gap-1.5 text-xs py-1.5"><RefreshCw className="w-3.5 h-3.5" /></button>
          {puedeAdmin && (
            <button onClick={() => setModal({})} className="btn-primary gap-2 text-xs"><Plus className="w-3.5 h-3.5" /> Nuevo rol</button>
          )}
        </div>
      </div>

      <div className="card p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input type="search" placeholder="Buscar rol por nombre o código..." className="input pl-8 text-xs py-1.5"
            value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="tabla">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Nivel</th>
              <th>Estado</th>
              {puedeAdmin && <th><span className="sr-only">Acciones</span></th>}
            </tr>
          </thead>
          <tbody>
            {loading ? Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>{Array.from({ length: 6 }).map((__, j) => <td key={j}><div className="skeleton h-4 rounded" /></td>)}</tr>
            )) : filtrados.length === 0 ? (
              <tr><td colSpan={puedeAdmin ? 6 : 5} className="py-12 text-center text-sm text-gray-400">
                <Shield className="w-8 h-8 mx-auto mb-2 text-gray-300" />No se encontraron roles.
              </td></tr>
            ) : filtrados.map((r) => (
              <tr key={r.id}>
                <td><span className="font-mono text-xs text-blue-700 font-semibold">{r.codigo}</span></td>
                <td><span className="text-sm font-medium text-gray-800">{r.nombre}</span></td>
                <td><span className="text-xs text-gray-500 truncate max-w-40 block">{r.descripcion ?? '—'}</span></td>
                <td><span className="text-xs font-medium text-gray-600">{r.nivel_jerarquia}</span></td>
                <td>
                  <span className={cn('badge text-xs', r.esta_activo !== false ? 'badge-verde' : 'badge-rojo')}>
                    {r.esta_activo !== false ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                {puedeAdmin && (
                  <td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setModal({ rol: r })}
                        className="p-1.5 rounded hover:bg-gray-100 text-blue-600" title="Editar"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleEliminar(r)}
                        className="p-1.5 rounded hover:bg-gray-100 text-red-500" title="Eliminar"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && <ModalRol {...modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); cargar(); }} />}
    </div>
  );
}
