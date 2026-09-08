'use client';
import { useState } from 'react';
import {
  Plus, Search, GraduationCap, Pencil, ToggleLeft, ToggleRight, RefreshCw, X, ArrowLeft, FileDown, FileSpreadsheet,
} from 'lucide-react';
import Link from 'next/link';
import {
  useProgramasAcademicos, useCrearProgramaAcademico, useActualizarProgramaAcademico,
  useToggleProgramaAcademico, useFacultades,
} from '@/lib/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils/cn';
import { descargarArchivo } from '@/lib/api/servicios';
import type { Facultad } from '@/lib/types';

const NIVELES = ['PREGRADO', 'MAESTRIA', 'DOCTORADO', 'DIPLOMADO', 'SEGUNDA_ESPECIALIDAD'];
const MODALIDADES = ['PRESENCIAL', 'SEMIPRESENCIAL', 'VIRTUAL'];

type ProgramaRow = {
  id: string; codigo: string; nombre: string; nivel: string;
  modalidad: string; facultad_id: string; esta_activo: boolean;
  facultades?: { nombre: string; nombre_corto: string };
};

function ModalPrograma({
  facultades, programa, onClose,
}: {
  facultades: Facultad[];
  programa?: ProgramaRow;
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
    facultad_id: programa?.facultad_id ?? '',
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
            {programa ? 'Editar programa académico' : 'Nuevo programa académico'}
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="label text-xs">Código *</label>
            <input type="text" className="input text-xs" required placeholder="ING-CIV"
              value={form.codigo} onChange={(e) => setForm(f => ({ ...f, codigo: e.target.value }))} />
          </div>
          <div>
            <label className="label text-xs">Nombre *</label>
            <input type="text" className="input text-xs" required placeholder="Ingeniería Civil"
              value={form.nombre} onChange={(e) => setForm(f => ({ ...f, nombre: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label text-xs">Nivel *</label>
              <select className="input text-xs" value={form.nivel}
                onChange={(e) => setForm(f => ({ ...f, nivel: e.target.value }))}>
                {NIVELES.map((n) => <option key={n} value={n}>{n.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="label text-xs">Modalidad</label>
              <select className="input text-xs" value={form.modalidad}
                onChange={(e) => setForm(f => ({ ...f, modalidad: e.target.value }))}>
                {MODALIDADES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label text-xs">Facultad *</label>
            <select className="input text-xs" required value={form.facultad_id}
              onChange={(e) => setForm(f => ({ ...f, facultad_id: e.target.value }))}>
              <option value="">Seleccione facultad</option>
              {facultades.map((f) => (
                <option key={f.id} value={f.id}>{f.codigo} - {f.nombre}</option>
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

export default function ProgramasPage() {
  const qc = useQueryClient();
  const [busqueda, setBusqueda] = useState('');
  const [filtroFacultad, setFiltroFacultad] = useState('');
  const [filtroNivel, setFiltroNivel] = useState('');
  const [filtroActivos, setFiltroActivos] = useState(true);
  const [modalPrograma, setModalPrograma] = useState<ProgramaRow | undefined>(undefined);
  const [modalNuevo, setModalNuevo] = useState(false);

  const { data: programas = [], isLoading } = useProgramasAcademicos(false);
  const { data: facultades = [] } = useFacultades(true);
  const togglePrograma = useToggleProgramaAcademico();

  const filtrar = programas.filter((p: any) => {
    if (busqueda && !p.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
        !p.codigo.toLowerCase().includes(busqueda.toLowerCase())) return false;
    if (filtroFacultad && p.facultad_id !== filtroFacultad) return false;
    if (filtroNivel && p.nivel !== filtroNivel) return false;
    if (filtroActivos && !p.esta_activo) return false;
    return true;
  });

  const handleToggle = async (id: string) => {
    try { await togglePrograma.mutateAsync(id); }
    catch { alert('Error al cambiar estado del programa.'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/mantenedores" className="btn-secondary gap-1.5 text-xs py-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Facultades
          </Link>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Programas Académicos</h2>
            <p className="text-xs text-gray-400 mt-0.5">{filtrar.length} programas encontrados</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { qc.invalidateQueries({ queryKey: ['programas-academicos'] }); }}
            className="btn-secondary gap-1.5 text-xs py-1.5"><RefreshCw className="w-3.5 h-3.5" /></button>
          <button onClick={() => descargarArchivo('/programas-academicos/exportar/csv', 'programas-academicos.csv')} className="btn-secondary gap-1.5 text-xs py-1.5" title="Exportar CSV">
            <FileDown className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => descargarArchivo('/programas-academicos/exportar/xlsx', 'programas-academicos.xlsx')} className="btn-secondary gap-1.5 text-xs py-1.5" title="Exportar Excel">
            <FileSpreadsheet className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setModalNuevo(true)} className="btn-primary gap-2 text-xs">
            <Plus className="w-3.5 h-3.5" /> Nuevo programa
          </button>
        </div>
      </div>

      <div className="card p-3 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input type="search" placeholder="Buscar por nombre o código..."
            className="input pl-8 text-xs py-1.5"
            value={busqueda} onChange={(e) => setBusqueda(e.target.value)} aria-label="Buscar programas" />
        </div>
        <select className="input text-xs py-1.5 w-44" value={filtroFacultad}
          onChange={(e) => setFiltroFacultad(e.target.value)} aria-label="Filtrar por facultad">
          <option value="">Todas las facultades</option>
          {facultades.map((f: any) => (
            <option key={f.id} value={f.id}>{f.codigo} - {f.nombre}</option>
          ))}
        </select>
        <select className="input text-xs py-1.5 w-36" value={filtroNivel}
          onChange={(e) => setFiltroNivel(e.target.value)} aria-label="Filtrar por nivel">
          <option value="">Todos los niveles</option>
          {NIVELES.map((n) => <option key={n} value={n}>{n.replace('_', ' ')}</option>)}
        </select>
        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 rounded text-blue-600"
            checked={filtroActivos} onChange={(e) => setFiltroActivos(e.target.checked)} />
          Solo activos
        </label>
      </div>

      <div className="card overflow-hidden">
        <table className="tabla" aria-label="Programas académicos">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Facultad</th>
              <th>Nivel</th>
              <th>Modalidad</th>
              <th>Estado</th>
              <th><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j}><div className="skeleton h-4 rounded w-full" /></td>
                    ))}
                  </tr>
                ))
              : filtrar.length === 0
              ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-gray-400">
                      <GraduationCap className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      No se encontraron programas con los filtros aplicados.
                    </td>
                  </tr>
                )
              : filtrar.map((p: any) => (
                  <tr key={p.id} className={cn(!p.esta_activo && 'opacity-50')}>
                    <td><span className="font-mono text-xs text-gray-600">{p.codigo}</span></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-800">{p.nombre}</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-xs text-gray-600">{p.facultades?.nombre_corto ?? p.facultades?.nombre ?? '—'}</span>
                    </td>
                    <td><span className="badge-gris text-xs">{p.nivel.replace('_', ' ')}</span></td>
                    <td><span className="text-xs text-gray-500">{p.modalidad}</span></td>
                    <td>
                      <span className={cn('text-xs font-medium px-2.5 py-0.5 rounded-full',
                        p.esta_activo ? 'badge-verde' : 'badge-rojo')}>
                        {p.esta_activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleToggle(p.id)}
                          className={cn('p-1.5 rounded hover:bg-gray-100',
                            p.esta_activo ? 'text-green-600' : 'text-red-400')}
                          title={p.esta_activo ? 'Desactivar' : 'Activar'}>
                          {p.esta_activo ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                        <button onClick={() => setModalPrograma(p)}
                          className="p-1.5 rounded hover:bg-gray-100 text-blue-600" title="Editar">
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>

      {modalNuevo && <ModalPrograma facultades={facultades} onClose={() => setModalNuevo(false)} />}
      {modalPrograma && (
        <ModalPrograma facultades={facultades} programa={modalPrograma} onClose={() => setModalPrograma(undefined)} />
      )}
    </div>
  );
}
