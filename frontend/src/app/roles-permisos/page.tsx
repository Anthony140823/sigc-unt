'use client';
import { useState, useEffect } from 'react';
import { Shield, Users, Search, Check, X, RefreshCw } from 'lucide-react';
import { catalogosApi, usuariosApi } from '@/lib/api/servicios';
import { cn } from '@/lib/utils/cn';

export default function RolesPermisosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [asignando, setAsignando] = useState<{ usuarioId: string; rolId: number } | null>(null);

  const cargar = async () => {
    setLoading(true);
    try {
      const [u, r] = await Promise.all([
        usuariosApi.listar({ limit: 100, esta_activo: true, sortBy: 'nombres', order: 'asc' }),
        catalogosApi.roles(),
      ]);
      setUsuarios((u as any).datos ?? (u as any));
      setRoles(r as any);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const estaAsignado = (usuarioId: string, rolId: number) => {
    const u = usuarios.find((us) => us.id === usuarioId);
    return u?.usuarios_roles?.some((ur: any) => ur.rol_id === rolId);
  };

  const toggleRol = async (usuarioId: string, rolId: number) => {
    setAsignando({ usuarioId, rolId });
    try {
      const asignacion = usuarios
        .find((u) => u.id === usuarioId)
        ?.usuarios_roles?.find((ur: any) => ur.rol_id === rolId);

      if (asignacion) {
        await usuariosApi.revocarRol(usuarioId, asignacion.id);
      } else {
        await usuariosApi.asignarRol(usuarioId, rolId);
      }
      cargar();
    } catch (e: any) {
      alert(e?.response?.data?.mensaje ?? 'Error al cambiar rol');
    }
    setAsignando(null);
  };

  const filtrados = usuarios.filter((u) =>
    !busqueda || `${u.nombres} ${u.apellidos}`.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.username?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Roles y Permisos</h2>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Asignación masiva de roles a usuarios del sistema</p>
        </div>
        <button onClick={cargar} className="btn-secondary gap-1.5 text-xs py-1.5">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="card p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input type="search" placeholder="Buscar usuario por nombre o username..."
            className="input pl-8 text-xs py-1.5" value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)} />
        </div>
      </div>

      <div className="card overflow-hidden overflow-x-auto">
        <table className="tabla min-w-[800px]">
          <thead>
            <tr>
              <th className="sticky left-0 bg-white z-10">Usuario</th>
              <th className="sticky left-0 bg-white z-10" style={{ left: '180px' }}>Área</th>
              {roles.map((r: any) => (
                <th key={r.id} className="text-center text-[10px] px-2 min-w-[100px]">
                  <div className="flex flex-col items-center gap-0.5">
                    <Shield className="w-3 h-3 text-blue-400" />
                    <span className="leading-tight">{r.nombre}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? Array.from({ length: 8 }).map((_, i) => (
              <tr key={i}>
                <td colSpan={2 + roles.length}>
                  <div className="skeleton h-6 rounded w-full" />
                </td>
              </tr>
            )) : filtrados.length === 0 ? (
              <tr><td colSpan={2 + roles.length} className="py-12 text-center text-sm text-gray-400">
                <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />No se encontraron usuarios.
              </td></tr>
            ) : filtrados.map((u: any) => (
              <tr key={u.id}>
                <td className="sticky left-0 bg-white z-10 min-w-[180px]">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-blue-700">
                        {u.nombres?.charAt(0)}{u.apellidos?.charAt(0)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{u.nombres} {u.apellidos}</p>
                      <p className="text-[10px] text-gray-400">@{u.username}</p>
                    </div>
                  </div>
                </td>
                <td className="sticky left-0 bg-white z-10 text-xs text-gray-500 min-w-[120px]" style={{ left: '180px' }}>
                  {u.areas?.nombre_corto ?? u.areas?.nombre ?? '—'}
                </td>
                {roles.map((r: any) => {
                  const asignado = estaAsignado(u.id, r.id);
                  const ocupado = asignando?.usuarioId === u.id && asignando?.rolId === r.id;
                  return (
                    <td key={r.id} className="text-center px-2">
                      <button
                        onClick={() => toggleRol(u.id, r.id)}
                        disabled={ocupado}
                        className={cn(
                          'w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
                          asignado ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-600' : 'bg-gray-100 text-gray-300 hover:bg-green-100 hover:text-green-600',
                          ocupado && 'opacity-50 pointer-events-none',
                        )}
                        title={asignado ? `Revocar ${r.nombre}` : `Asignar ${r.nombre}`}
                      >
                        {ocupado ? <RefreshCw className="w-3 h-3 animate-spin" /> : asignado ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
