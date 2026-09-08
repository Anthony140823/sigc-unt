'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  Plus, Search, ChevronDown, ChevronRight, Building2, GraduationCap, Pencil,
  ToggleLeft, ToggleRight, RefreshCw, X, FileDown, FileSpreadsheet,
} from 'lucide-react';
import {
  useFacultades, useCrearFacultad, useActualizarFacultad,
  useProgramasAcademicos, useCrearProgramaAcademico, useActualizarProgramaAcademico,
  useToggleProgramaAcademico,
} from '@/lib/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils/cn';
import { descargarArchivo } from '@/lib/api/servicios';
import type { Facultad } from '@/lib/types';

type ProgramaRow = {
  id: string; codigo: string; nombre: string; nivel: string;
  modalidad: string; facultad_id: string; esta_activo: boolean;
  facultades?: { nombre: string };
};

function ModalFacultad({
  facultad, onClose,
}: {
  facultad?: Facultad;
  onClose: () => void;
}) {
  const crear = useCrearFacultad();
  const actualizar = useActualizarFacultad(facultad?.id ?? '');
  const isPending = facultad ? actualizar.isPending : crear.isPending;

  const [form, setForm] = useState({
    codigo: facultad?.codigo ?? '',
    nombre: facultad?.nombre ?? '',
    nombre_corto: facultad?.nombre_corto ?? '',
    decano_nombre: facultad?.decano_nombre ?? '',
    email: facultad?.email ?? '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (facultad) {
        await actualizar.mutateAsync(form);
      } else {
        await crear.mutateAsync(form);
      }
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.mensaje ?? err?.message ?? 'Error al guardar');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="px-5 py-4 border-b border-gray-100 sticky top-0 bg-white flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            {facultad ? 'Editar facultad' : 'Nueva facultad'}
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="label text-xs">Código *</label>
            <input type="text" className="input text-xs" required placeholder="FAC-EJE"
              value={form.codigo} onChange={(e) => setForm(f => ({ ...f, codigo: e.target.value }))} />
          </div>
          <div>
            <label className="label text-xs">Nombre *</label>
            <input type="text" className="input text-xs" required placeholder="Facultad de Ejemplo"
              value={form.nombre} onChange={(e) => setForm(f => ({ ...f, nombre: e.target.value }))} />
          </div>
          <div>
            <label className="label text-xs">Nombre corto</label>
            <input type="text" className="input text-xs" placeholder="Fac. Ejemplo"
              value={form.nombre_corto} onChange={(e) => setForm(f => ({ ...f, nombre_corto: e.target.value }))} />
          </div>
          <div>
            <label className="label text-xs">Decano</label>
            <input type="text" className="input text-xs" placeholder="Dr. Nombre Apellido"
              value={form.decano_nombre} onChange={(e) => setForm(f => ({ ...f, decano_nombre: e.target.value }))} />
          </div>
          <div>
            <label className="label text-xs">Email</label>
            <input type="email" className="input text-xs" placeholder="decano@unitru.edu.pe"
              value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          {error && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" className="btn-secondary text-xs py-1.5" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary text-xs py-1.5" disabled={isPending}>
              {isPending ? 'Guardando...' : facultad ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModalPrograma({
  facultades, programa, facultadId, onClose,
}: {
  facultades: Facultad[];
  programa?: ProgramaRow;
  facultadId?: string;
  onClose: () => void;
}) {
  const crear = useCrearProgramaAcademico();
  const actualizar = useActualizarProgramaAcademico(programa?.id ?? '');
  const isPending = programa ? actualizar.isPending : crear.isPending;

  const [form, setForm] = useState({
    codigo: programa?.codigo ?? '',
    nombre: programa?.nombre ?? '',
    nivel: programa?.nivel ?? 'PREGRADO',
    modalidad: programa?.modalidad ?? 'PRESENCIAL',
    facultad_id: programa?.facultad_id ?? facultadId ?? '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (programa) {
        await actualizar.mutateAsync(form);
      } else {
        await crear.mutateAsync(form);
      }
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.mensaje ?? err?.message ?? 'Error al guardar');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="px-5 py-4 border-b border-gray-100 sticky top-0 bg-white flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            {programa ? 'Editar programa' : 'Nuevo programa'}
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="label text-xs">Código *</label>
            <input type="text" className="input text-xs" required placeholder="ING-EJE"
              value={form.codigo} onChange={(e) => setForm(f => ({ ...f, codigo: e.target.value }))} />
          </div>
          <div>
            <label className="label text-xs">Nombre *</label>
            <input type="text" className="input text-xs" required placeholder="Ingeniería de Ejemplo"
              value={form.nombre} onChange={(e) => setForm(f => ({ ...f, nombre: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label text-xs">Nivel *</label>
              <select className="input text-xs" value={form.nivel}
                onChange={(e) => setForm(f => ({ ...f, nivel: e.target.value }))}>
                <option value="PREGRADO">Pregrado</option>
                <option value="MAESTRIA">Maestría</option>
                <option value="DOCTORADO">Doctorado</option>
                <option value="DIPLOMADO">Diplomado</option>
                <option value="SEGUNDA_ESPECIALIDAD">Segunda Especialidad</option>
              </select>
            </div>
            <div>
              <label className="label text-xs">Modalidad</label>
              <select className="input text-xs" value={form.modalidad}
                onChange={(e) => setForm(f => ({ ...f, modalidad: e.target.value }))}>
                <option value="PRESENCIAL">Presencial</option>
                <option value="SEMIPRESENCIAL">Semipresencial</option>
                <option value="VIRTUAL">Virtual</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label text-xs">Facultad *</label>
            <select className="input text-xs" required value={form.facultad_id}
              onChange={(e) => setForm(f => ({ ...f, facultad_id: e.target.value }))}>
              <option value="">Seleccione facultad</option>
              {facultades.map((f) => (
                <option key={f.id} value={f.id}>{f.nombre}</option>
              ))}
            </select>
          </div>
          {error && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" className="btn-secondary text-xs py-1.5" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary text-xs py-1.5" disabled={isPending}>
              {isPending ? 'Guardando...' : programa ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FacultadesPage() {
  const qc = useQueryClient();
  const [busqueda, setBusqueda] = useState('');
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());
  const [modalFacultad, setModalFacultad] = useState<Facultad | undefined>(undefined);
  const [modalFacultadNueva, setModalFacultadNueva] = useState(false);
  const [modalPrograma, setModalPrograma] = useState<{ programa?: ProgramaRow; facultadId?: string } | undefined>(undefined);

  const { data: facultades = [], isLoading } = useFacultades(false);
  const { data: todosProgramas = [] } = useProgramasAcademicos(false);

  const togglePrograma = useToggleProgramaAcademico();

  const filtrarFacultades = busqueda
    ? facultades.filter((f: any) =>
        f.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        f.codigo.toLowerCase().includes(busqueda.toLowerCase()))
    : facultades;

  const toggleExpand = (id: string) => {
    setExpandidos((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const programasDeFacultad = (facultadId: string) =>
    todosProgramas.filter((p: any) => p.facultad_id === facultadId);

  const handleTogglePrograma = async (id: string) => {
    try {
      await togglePrograma.mutateAsync(id);
    } catch { alert('Error al cambiar estado del programa.'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/mantenedores" className="btn-secondary gap-1.5 text-xs py-1">
            <ChevronRight className="w-3.5 h-3.5 rotate-180" /> Mantenedores
          </Link>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Facultades</h2>
            <p className="text-xs text-gray-400 mt-0.5">{filtrarFacultades.length} facultades</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { qc.invalidateQueries({ queryKey: ['facultades'] }); qc.invalidateQueries({ queryKey: ['programas-academicos'] }); }}
            className="btn-secondary gap-1.5 text-xs py-1.5"><RefreshCw className="w-3.5 h-3.5" /></button>
          <button onClick={() => descargarArchivo('/facultades/exportar/csv', 'facultades.csv')} className="btn-secondary gap-1.5 text-xs py-1.5" title="Exportar CSV">
            <FileDown className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => descargarArchivo('/facultades/exportar/xlsx', 'facultades.xlsx')} className="btn-secondary gap-1.5 text-xs py-1.5" title="Exportar Excel">
            <FileSpreadsheet className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setModalFacultadNueva(true)} className="btn-primary gap-2 text-xs">
            <Plus className="w-3.5 h-3.5" /> Nueva facultad
          </button>
        </div>
      </div>

      <div className="card p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input type="search" placeholder="Buscar facultad por nombre o código..."
            className="input pl-8 text-xs py-1.5"
            value={busqueda} onChange={(e) => setBusqueda(e.target.value)} aria-label="Buscar facultades" />
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="tabla" aria-label="Facultades">
          <thead>
            <tr>
              <th className="w-8"></th>
              <th>Código</th>
              <th>Facultad</th>
              <th>Nombre corto</th>
              <th>Decano</th>
              <th>Programas</th>
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
              : filtrarFacultades.length === 0
              ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-sm text-gray-400">
                      <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      No se encontraron facultades.
                    </td>
                  </tr>
                )
              : filtrarFacultades.map((facultad: any) => {
                  const expandido = expandidos.has(facultad.id);
                  const programas = programasDeFacultad(facultad.id);
                  return (
                    <tr key={facultad.id} className={cn(!facultad.esta_activo && 'opacity-50')}>
                      <td>
                        <button onClick={() => toggleExpand(facultad.id)}
                          className="p-1 rounded hover:bg-gray-100" title="Ver programas">
                          {expandido ? <ChevronDown className="w-4 h-4 text-gray-400" />
                            : <ChevronRight className="w-4 h-4 text-gray-400" />}
                        </button>
                      </td>
                      <td><span className="font-mono text-xs text-gray-600">{facultad.codigo}</span></td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-medium text-gray-800">{facultad.nombre}</span>
                        </div>
                      </td>
                      <td><span className="text-xs text-gray-500">{facultad.nombre_corto ?? '—'}</span></td>
                      <td><span className="text-xs text-gray-500">{facultad.decano_nombre ?? '—'}</span></td>
                      <td>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                          {facultad._count?.programas_academicos ?? programas.length} programas
                        </span>
                      </td>
                      <td>
                        <span className={cn('text-xs font-medium px-2.5 py-0.5 rounded-full',
                          facultad.esta_activo ? 'badge-verde' : 'badge-rojo')}>
                          {facultad.esta_activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => setModalFacultad(facultad)}
                          className="p-1.5 rounded hover:bg-gray-100 text-blue-600" title="Editar facultad">
                          <Pencil className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
            }
          </tbody>
        </table>
      </div>

      {Array.from(expandidos).map((facultadId) => {
        const facultad = facultades.find((f: any) => f.id === facultadId);
        if (!facultad) return null;
        const programas = programasDeFacultad(facultadId);
        return (
          <div key={facultadId} className="card p-4 ml-6 border-l-4 border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-semibold text-gray-800">
                  Programas de {facultad.nombre_corto ?? facultad.nombre}
                </h3>
              </div>
              <button onClick={() => setModalPrograma({ facultadId })}
                className="btn-primary gap-1.5 text-xs py-1">
                <Plus className="w-3 h-3" /> Nuevo programa
              </button>
            </div>
            {programas.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No hay programas en esta facultad.</p>
            ) : (
              <table className="tabla text-xs">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Nivel</th>
                    <th>Modalidad</th>
                    <th>Estado</th>
                    <th><span className="sr-only">Acciones</span></th>
                  </tr>
                </thead>
                <tbody>
                  {programas.map((p: any) => (
                    <tr key={p.id} className={cn(!p.esta_activo && 'opacity-50')}>
                      <td><span className="font-mono text-gray-600">{p.codigo}</span></td>
                      <td><span className="font-medium text-gray-800">{p.nombre}</span></td>
                      <td><span className="badge-gris">{p.nivel}</span></td>
                      <td><span className="text-gray-500">{p.modalidad}</span></td>
                      <td>
                        <span className={cn('font-medium px-2 py-0.5 rounded-full',
                          p.esta_activo ? 'badge-verde' : 'badge-rojo')}>
                          {p.esta_activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleTogglePrograma(p.id)}
                            className={cn('p-1 rounded hover:bg-gray-100',
                              p.esta_activo ? 'text-green-600' : 'text-red-400')}
                            title={p.esta_activo ? 'Desactivar' : 'Activar'}>
                            {p.esta_activo ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          </button>
                          <button onClick={() => setModalPrograma({ programa: p })}
                            className="p-1 rounded hover:bg-gray-100 text-blue-600" title="Editar">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      })}

      {modalFacultadNueva && <ModalFacultad onClose={() => setModalFacultadNueva(false)} />}
      {modalFacultad && <ModalFacultad facultad={modalFacultad} onClose={() => setModalFacultad(undefined)} />}
      {modalPrograma && (
        <ModalPrograma
          facultades={facultades}
          programa={modalPrograma.programa}
          facultadId={modalPrograma.facultadId}
          onClose={() => setModalPrograma(undefined)}
        />
      )}
    </div>
  );
}
