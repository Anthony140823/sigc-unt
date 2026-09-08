// src/app/usuarios/page.tsx
'use client';
import { useState } from 'react';
import {
  Plus, Search, RefreshCw, Users, ChevronLeft,
  ChevronRight, ToggleLeft, ToggleRight, Shield,
  FileDown, FileSpreadsheet,
} from 'lucide-react';
import { useUsuarios, useCrearUsuario } from '@/lib/hooks';
import { useAreas } from '@/lib/hooks';
import { usuariosApi, descargarArchivo } from '@/lib/api/servicios';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/auth.store';
import { cn } from '@/lib/utils/cn';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// ── Esquema nuevo usuario ──────────────────────────────────────
const esquemaUsuario = z.object({
  codigo_usuario: z.string().min(3, 'Código requerido'),
  username:       z.string().min(4).regex(/^[a-zA-Z0-9._-]+$/, 'Solo letras, números, puntos y guiones'),
  email:          z.string().email('Email inválido'),
  password:       z.string().min(8).regex(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, 'Requiere mayúscula, número y carácter especial'),
  nombres:        z.string().min(2, 'Nombres requeridos'),
  apellidos:      z.string().min(2, 'Apellidos requeridos'),
  tipo_usuario:   z.enum(['DOCENTE','ADMINISTRATIVO','AUTORIDAD','EXTERNO']),
  area_id:        z.string().uuid().optional().or(z.literal('')),
  cargo:          z.string().optional(),
});
type FormUsuario = z.infer<typeof esquemaUsuario>;

// ── Modal crear usuario ────────────────────────────────────────
function ModalCrearUsuario({ onClose }: { onClose: () => void }) {
  const { mutate, isPending } = useCrearUsuario();
  const { data: areas = [] }  = useAreas();

  const { register, handleSubmit, formState: { errors } } = useForm<FormUsuario>({
    resolver: zodResolver(esquemaUsuario),
    defaultValues: { tipo_usuario: 'ADMINISTRATIVO' },
  });

  const onSubmit = (datos: FormUsuario) => {
    const payload = { ...datos, area_id: datos.area_id || undefined };
    mutate(payload as any, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
         role="dialog" aria-modal="true" aria-labelledby="modal-user-title">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h3 id="modal-user-title" className="text-sm font-semibold text-gray-900">
            Crear nuevo usuario
          </h3>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-3" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label text-xs" htmlFor="codigo_usuario">Código institucional *</label>
              <input id="codigo_usuario" type="text" className="input text-xs"
                placeholder="Ej: DOC-12345678" {...register('codigo_usuario')} />
              {errors.codigo_usuario && <p className="mt-1 text-xs text-red-600">{errors.codigo_usuario.message}</p>}
            </div>
            <div>
              <label className="label text-xs" htmlFor="username">Username *</label>
              <input id="username" type="text" className="input text-xs"
                placeholder="jperez" {...register('username')} />
              {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username.message}</p>}
            </div>
            <div>
              <label className="label text-xs" htmlFor="nombres">Nombres *</label>
              <input id="nombres" type="text" className="input text-xs"
                placeholder="Juan Carlos" {...register('nombres')} />
              {errors.nombres && <p className="mt-1 text-xs text-red-600">{errors.nombres.message}</p>}
            </div>
            <div>
              <label className="label text-xs" htmlFor="apellidos">Apellidos *</label>
              <input id="apellidos" type="text" className="input text-xs"
                placeholder="Pérez García" {...register('apellidos')} />
              {errors.apellidos && <p className="mt-1 text-xs text-red-600">{errors.apellidos.message}</p>}
            </div>
          </div>
          <div>
            <label className="label text-xs" htmlFor="email">Email institucional *</label>
            <input id="email" type="email" className="input text-xs"
              placeholder="jperez@unitru.edu.pe" {...register('email')} />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>
          <div>
            <label className="label text-xs" htmlFor="password">Contraseña inicial *</label>
            <input id="password" type="password" className="input text-xs"
              placeholder="Inicial@2025 (mín. 8 chars, mayúscula, número, especial)"
              {...register('password')} />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label text-xs" htmlFor="tipo_usuario">Tipo de usuario *</label>
              <select id="tipo_usuario" className="input text-xs" {...register('tipo_usuario')}>
                <option value="DOCENTE">Docente</option>
                <option value="ADMINISTRATIVO">Administrativo</option>
                <option value="AUTORIDAD">Autoridad</option>
                <option value="EXTERNO">Externo</option>
              </select>
            </div>
            <div>
              <label className="label text-xs" htmlFor="area_id">Área</label>
              <select id="area_id" className="input text-xs" {...register('area_id')}>
                <option value="">Sin área</option>
                {(areas as any[]).map((a: any) => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label text-xs" htmlFor="cargo">Cargo</label>
            <input id="cargo" type="text" className="input text-xs"
              placeholder="Jefe de la Oficina de Calidad" {...register('cargo')} />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" className="btn-secondary text-xs py-1.5" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary text-xs py-1.5" disabled={isPending}>
              {isPending ? 'Creando...' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────
export default function UsuariosPage() {
  const { tieneRol } = useAuthStore();
  const puedeAdmin  = tieneRol(['SUPERADMIN','ADMIN_CALIDAD']);
  const qc = useQueryClient();

  const [pagina, setPagina]     = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [tipo, setTipo]         = useState('');
  const [soloActivos, setSoloActivos] = useState<boolean | undefined>(true);
  const [modalCrear, setModalCrear]   = useState(false);

  const { data, isLoading, refetch } = useUsuarios({
    page: pagina, limit: 15,
    busqueda:    busqueda || undefined,
    tipo_usuario: tipo || undefined,
    esta_activo: soloActivos,
  });

  const usuarios = data?.datos ?? [];
  const meta     = data?.meta;

  const handleToggle = async (id: string, nombreCompleto: string) => {
    if (!confirm(`¿Cambiar estado del usuario ${nombreCompleto}?`)) return;
    try {
      await usuariosApi.toggleActivo(id);
      qc.invalidateQueries({ queryKey: ['usuarios'] });
    } catch {
      alert('Error al cambiar estado del usuario.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Gestión de Usuarios</h2>
          {meta && (
            <p className="text-xs text-gray-400 mt-0.5">{meta.total} usuarios registrados</p>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={() => refetch()} className="btn-secondary gap-1.5 text-xs py-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => descargarArchivo('/usuarios/exportar/csv', 'usuarios.csv')} className="btn-secondary gap-1.5 text-xs py-1.5" title="Exportar CSV">
            <FileDown className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => descargarArchivo('/usuarios/exportar/xlsx', 'usuarios.xlsx')} className="btn-secondary gap-1.5 text-xs py-1.5" title="Exportar Excel">
            <FileSpreadsheet className="w-3.5 h-3.5" />
          </button>
          {puedeAdmin && (
            <button onClick={() => setModalCrear(true)} className="btn-primary gap-2 text-xs">
              <Plus className="w-3.5 h-3.5" /> Nuevo usuario
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="card p-3 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="search" placeholder="Buscar por nombre, usuario, email o código..."
            className="input pl-8 text-xs py-1.5"
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
            aria-label="Buscar usuarios"
          />
        </div>
        <select
          className="input text-xs py-1.5 w-40"
          value={tipo}
          onChange={(e) => { setTipo(e.target.value); setPagina(1); }}
          aria-label="Filtrar por tipo"
        >
          <option value="">Todos los tipos</option>
          <option value="DOCENTE">Docente</option>
          <option value="ADMINISTRATIVO">Administrativo</option>
          <option value="AUTORIDAD">Autoridad</option>
          <option value="EXTERNO">Externo</option>
        </select>
        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 rounded text-blue-600"
            checked={soloActivos === true}
            onChange={(e) => setSoloActivos(e.target.checked ? true : undefined)}
          />
          Solo activos
        </label>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        <table className="tabla" aria-label="Lista de usuarios">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre completo</th>
              <th>Username</th>
              <th>Email</th>
              <th>Tipo</th>
              <th>Área</th>
              <th>Roles</th>
              <th>Último acceso</th>
              <th>Estado</th>
              {puedeAdmin && <th><span className="sr-only">Acciones</span></th>}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: puedeAdmin ? 10 : 9 }).map((__, j) => (
                      <td key={j}><div className="skeleton h-4 rounded w-full" /></td>
                    ))}
                  </tr>
                ))
              : usuarios.length === 0
              ? (
                  <tr>
                    <td colSpan={puedeAdmin ? 10 : 9} className="py-12 text-center text-sm text-gray-400">
                      <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      No se encontraron usuarios con los filtros aplicados.
                    </td>
                  </tr>
                )
              : usuarios.map((u: any) => {
                  const roles = u.usuarios_roles?.map((ur: any) => ur.roles?.codigo).join(', ') ?? '—';
                  return (
                    <tr key={u.id} className={cn(!u.esta_activo && 'opacity-50')}>
                      <td>
                        <span className="font-mono text-xs text-gray-600">{u.codigo_usuario}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-blue-700">
                              {u.nombres?.charAt(0)}{u.apellidos?.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {u.nombres} {u.apellidos}
                            </p>
                            {u.cargo && (
                              <p className="text-xs text-gray-400 truncate max-w-32">{u.cargo}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="font-mono text-xs text-gray-600">@{u.username}</span>
                      </td>
                      <td>
                        <span className="text-xs text-gray-600 truncate max-w-36 block">{u.email}</span>
                      </td>
                      <td>
                        <span className="badge-gris text-xs">{u.tipo_usuario}</span>
                      </td>
                      <td>
                        <span className="text-xs text-gray-600 truncate max-w-28 block">
                          {u.areas?.nombre_corto ?? u.areas?.nombre ?? '—'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <Shield className="w-3 h-3 text-blue-400" />
                          <span className="text-xs text-gray-600 truncate max-w-32">{roles}</span>
                        </div>
                      </td>
                      <td>
                        <span className="text-xs text-gray-500">
                          {u.ultimo_login
                            ? new Date(u.ultimo_login).toLocaleDateString('es-PE', {
                                day: '2-digit', month: 'short',
                              })
                            : 'Nunca'
                          }
                        </span>
                      </td>
                      <td>
                        <span className={cn('text-xs font-medium px-2.5 py-0.5 rounded-full',
                          u.esta_activo ? 'badge-verde' : 'badge-rojo')}>
                          {u.esta_activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      {puedeAdmin && (
                        <td>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleToggle(u.id, `${u.nombres} ${u.apellidos}`)}
                              className={cn(
                                'p-1.5 rounded hover:bg-gray-100 transition-colors',
                                u.esta_activo ? 'text-green-600' : 'text-red-400',
                              )}
                              title={u.esta_activo ? 'Desactivar usuario' : 'Activar usuario'}
                              aria-label={`${u.esta_activo ? 'Desactivar' : 'Activar'} usuario ${u.username}`}
                            >
                              {u.esta_activo
                                ? <ToggleRight className="w-5 h-5" />
                                : <ToggleLeft className="w-5 h-5" />
                              }
                            </button>
                            <a
                              href={`/usuarios/${u.id}`}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium px-1"
                              aria-label={`Editar usuario ${u.username}`}
                            >
                              Editar
                            </a>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
            }
          </tbody>
        </table>

        {/* Paginación */}
        {meta && meta.totalPaginas > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>
              Mostrando {((pagina - 1) * 15) + 1}–{Math.min(pagina * 15, meta.total)} de {meta.total}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagina((p) => p - 1)}
                disabled={!meta.tieneAnterior}
                className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                aria-label="Página anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="font-medium">{pagina} / {meta.totalPaginas}</span>
              <button
                onClick={() => setPagina((p) => p + 1)}
                disabled={!meta.tieneSiguiente}
                className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                aria-label="Página siguiente"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal crear usuario */}
      {modalCrear && <ModalCrearUsuario onClose={() => setModalCrear(false)} />}
    </div>
  );
}
