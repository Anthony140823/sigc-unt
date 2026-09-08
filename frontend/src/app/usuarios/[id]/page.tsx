'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Shield, ShieldPlus, Trash2, Plus, X, AlertCircle } from 'lucide-react';
import { useUsuario, useActualizarUsuario, useAreas } from '@/lib/hooks';
import { useRoles } from '@/lib/hooks';
import { usuariosApi } from '@/lib/api/servicios';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils/cn';

const TIPOS_USUARIO = ['DOCENTE', 'ADMINISTRATIVO', 'AUTORIDAD', 'EXTERNO'] as const;

function ModalAsignarRol({
  usuarioId, onClose,
}: {
  usuarioId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { data: rolesDisponibles = [] } = useRoles();
  const { data: areas = [] } = useAreas();
  const [rolId, setRolId] = useState('');
  const [areaId, setAreaId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rolId) return;
    setLoading(true);
    setError('');
    try {
      await usuariosApi.asignarRol(usuarioId, Number(rolId), areaId || undefined);
      qc.invalidateQueries({ queryKey: ['usuarios', usuarioId] });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.mensaje ?? err?.message ?? 'Error al asignar rol.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="px-5 py-4 border-b border-gray-100 sticky top-0 bg-white flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Asignar rol</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="label text-xs">Rol *</label>
            <select className="input text-xs" value={rolId} onChange={(e) => setRolId(e.target.value)} required>
              <option value="">Seleccione un rol</option>
              {(rolesDisponibles as any[]).map((r: any) => (
                <option key={r.id} value={r.id}>{r.nombre} ({r.codigo})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label text-xs">Área (opcional)</label>
            <select className="input text-xs" value={areaId} onChange={(e) => setAreaId(e.target.value)}>
              <option value="">Sin área específica</option>
              {(areas as any[]).map((a: any) => (
                <option key={a.id} value={a.id}>{a.codigo} - {a.nombre}</option>
              ))}
            </select>
            <p className="text-[11px] text-gray-400 mt-1">Limita el alcance del rol a un área específica.</p>
          </div>
          {error && (
            <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" className="btn-secondary text-xs py-1.5" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary text-xs py-1.5" disabled={loading}>
              {loading ? 'Asignando...' : 'Asignar rol'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EditarUsuarioPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { data: usuario, isLoading } = useUsuario(id);
  const { data: areas = [] } = useAreas();
  const actualizar = useActualizarUsuario(id);
  const [modalRol, setModalRol] = useState(false);

  const [form, setForm] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-6 w-48 rounded" />
        <div className="card p-5 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-10 w-full rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="card p-8 text-center text-gray-400">
        <p>Usuario no encontrado.</p>
        <Link href="/usuarios" className="btn-primary text-xs mt-4 inline-block">Volver</Link>
      </div>
    );
  }

  const userData = form.codigo_usuario ? form : {
    codigo_usuario: usuario.codigo_usuario,
    nombres: usuario.nombres,
    apellidos: usuario.apellidos,
    email: usuario.email,
    tipo_usuario: usuario.tipo_usuario,
    area_id: usuario.area_id ?? '',
    cargo: usuario.cargo ?? '',
  };

  const handleChange = (campo: string, valor: string) =>
    setForm((prev) => ({ ...prev, [campo]: valor }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const payload = { ...userData, area_id: userData.area_id || undefined };
    actualizar.mutate(payload as any, {
      onSuccess: () => router.push('/usuarios'),
      onError: (err: any) => setError(err?.response?.data?.mensaje ?? err?.message ?? 'Error al actualizar.'),
    });
  };

  const asignaciones = usuario.usuarios_roles?.filter((ur: any) => !ur.fecha_fin) ?? [];

  const handleRevocarRol = async (asignacionId: number, nombreRol: string) => {
    if (!confirm(`¿Revocar el rol "${nombreRol}" a ${usuario.nombres} ${usuario.apellidos}?`)) return;
    try {
      await usuariosApi.revocarRol(id, asignacionId);
      qc.invalidateQueries({ queryKey: QK.usuarios.uno(id) });
    } catch {
      alert('Error al revocar el rol.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/usuarios" className="btn-secondary gap-1.5 text-xs py-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Volver
          </Link>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Editar Usuario</h2>
            <p className="text-xs text-gray-400 mt-0.5">{usuario.nombres} {usuario.apellidos}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Datos del usuario */}
        <form onSubmit={handleSubmit} className="card p-5 space-y-4 lg:col-span-2">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-lg font-bold text-blue-700">
                {usuario.nombres?.charAt(0)}{usuario.apellidos?.charAt(0)}
              </span>
            </div>
            <div>
              <p className={cn('text-xs font-medium px-2.5 py-0.5 rounded-full inline-block',
                usuario.esta_activo ? 'badge-verde' : 'badge-rojo')}>
                {usuario.esta_activo ? 'Activo' : 'Inactivo'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label text-xs">Código institucional</label>
              <input type="text" className="input text-xs"
                value={userData.codigo_usuario}
                onChange={(e) => handleChange('codigo_usuario', e.target.value)} required />
            </div>
            <div>
              <label className="label text-xs">Username</label>
              <input type="text" className="input text-xs bg-gray-50 text-gray-500"
                value={usuario.username} disabled />
            </div>
            <div>
              <label className="label text-xs">Nombres</label>
              <input type="text" className="input text-xs"
                value={userData.nombres}
                onChange={(e) => handleChange('nombres', e.target.value)} required />
            </div>
            <div>
              <label className="label text-xs">Apellidos</label>
              <input type="text" className="input text-xs"
                value={userData.apellidos}
                onChange={(e) => handleChange('apellidos', e.target.value)} required />
            </div>
            <div className="col-span-2">
              <label className="label text-xs">Email</label>
              <input type="email" className="input text-xs"
                value={userData.email}
                onChange={(e) => handleChange('email', e.target.value)} required />
            </div>
            <div>
              <label className="label text-xs">Tipo de usuario</label>
              <select className="input text-xs" value={userData.tipo_usuario}
                onChange={(e) => handleChange('tipo_usuario', e.target.value)}>
                {TIPOS_USUARIO.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label text-xs">Cargo</label>
              <input type="text" className="input text-xs"
                value={userData.cargo}
                onChange={(e) => handleChange('cargo', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label text-xs">Área</label>
              <select className="input text-xs" value={userData.area_id}
                onChange={(e) => handleChange('area_id', e.target.value)}>
                <option value="">Sin área</option>
                {(areas as any[]).map((a: any) => (
                  <option key={a.id} value={a.id}>{a.codigo} - {a.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Link href="/usuarios" className="btn-secondary text-xs py-1.5">Cancelar</Link>
            <button type="submit" className="btn-primary gap-2 text-xs" disabled={actualizar.isPending}>
              <Save className="w-4 h-4" />
              {actualizar.isPending ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>

        {/* Roles del usuario */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-semibold text-gray-900">Roles asignados</h3>
            </div>
            <button onClick={() => setModalRol(true)}
              className="btn-primary gap-1.5 text-xs py-1">
              <Plus className="w-3.5 h-3.5" /> Asignar
            </button>
          </div>

          {asignaciones.length === 0 ? (
            <div className="py-6 text-center text-xs text-gray-400">
              <ShieldPlus className="w-6 h-6 mx-auto mb-1 text-gray-300" />
              Sin roles asignados
            </div>
          ) : (
            <div className="space-y-2">
              {asignaciones.map((ur: any) => (
                <div key={ur.id}
                  className="flex items-start justify-between gap-2 rounded-lg border border-gray-100 bg-gray-50/50 p-2.5">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-800">{ur.roles?.nombre}</p>
                    <p className="text-[11px] text-gray-400">
                      <span className="font-mono">{ur.roles?.codigo}</span>
                      {ur.areas && <span> · {ur.areas.nombre_corto ?? ur.areas.nombre}</span>}
                      <span> · desde {new Date(ur.fecha_inicio).toLocaleDateString('es-PE')}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleRevocarRol(ur.id, ur.roles?.nombre ?? '')}
                    className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600 flex-shrink-0"
                    title="Revocar rol">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {modalRol && <ModalAsignarRol usuarioId={id} onClose={() => setModalRol(false)} />}
    </div>
  );
}

const QK = {
  usuarios: { uno: (id: string) => ['usuarios', id] },
};
