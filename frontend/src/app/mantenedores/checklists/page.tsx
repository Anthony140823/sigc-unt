'use client';
import { useState } from 'react';
import {
  Plus,   Pencil, Trash2, ClipboardCheck, PlusCircle,
  FileQuestion, X, Eye, FileDown, FileSpreadsheet, FileText,
  BookOpen, Loader2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { catalogosApi, descargarArchivo } from '@/lib/api/servicios';
import { bscApi } from '@/lib/api/servicios';
import {
  useChecklists, useChecklistTemplate, useCrearChecklist, useActualizarChecklist, useEliminarChecklist,
  useAgregarItemChecklist, useActualizarItemChecklist, useEliminarItemChecklist,
} from '@/lib/hooks';

type Checklist = {
  id: string; nombre: string; descripcion?: string; version: string;
  esta_activo: boolean; tipo_auditoria_id: number;
  tipos_auditoria?: { nombre: string };
  _count?: { items_checklist: number };
  items_checklist?: Item[];
};

type Item = {
  id: string; checklist_id: string; criterio_referencia?: string;
  pregunta: string; descripcion_ayuda?: string;
  tipo_respuesta: string; obligatorio: boolean; orden: number;
};

type TipoAuditoria = { id: number; nombre: string; codigo?: string };

function ChecklistModal({ checklist, onClose }: { checklist?: Checklist; onClose: () => void }) {
  const { data: tipos } = useQuery<TipoAuditoria[]>({
    queryKey: ['catalogos', 'tipos-auditoria'],
    queryFn: catalogosApi.tiposAuditoria,
  });
  const crear = useCrearChecklist();
  const actualizar = useActualizarChecklist(checklist?.id ?? '');
  const [nombre, setNombre] = useState(checklist?.nombre ?? '');
  const [tipoId, setTipoId] = useState(checklist?.tipo_auditoria_id ?? 0);
  const [descripcion, setDescripcion] = useState(checklist?.descripcion ?? '');
  const [version, setVersion] = useState(checklist?.version ?? '1.0');
  const esEditar = !!checklist;

  const guardar = () => {
    const data = { nombre, tipo_auditoria_id: Number(tipoId), descripcion: descripcion || undefined, version };
    const action = esEditar ? actualizar.mutateAsync(data) : crear.mutateAsync(data);
    action.then(onClose).catch(() => {});
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">{esEditar ? 'Editar Checklist' : 'Nuevo Checklist'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
            <input value={nombre} onChange={e => setNombre(e.target.value)} className="input w-full" placeholder="Ej: Checklist de auditoría interna" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de Auditoría</label>
            <select value={tipoId} onChange={e => setTipoId(Number(e.target.value))} className="input w-full">
              <option value={0}>Seleccione...</option>
              {(tipos ?? []).map((t: TipoAuditoria) => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Versión</label>
            <input value={version} onChange={e => setVersion(e.target.value)} className="input w-full" placeholder="1.0" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
            <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} className="input w-full" rows={3} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="btn-secondary text-xs px-4 py-2">Cancelar</button>
          <button onClick={guardar} disabled={!nombre || !tipoId || crear.isPending || actualizar.isPending} className="btn-primary text-xs px-4 py-2">
            {crear.isPending || actualizar.isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ItemsModal({ checklist, onClose }: { checklist: { id: string; nombre: string }; onClose: () => void }) {
  const { data: checklistFull, isLoading } = useChecklistTemplate(checklist.id);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [pregunta, setPregunta] = useState('');
  const [criterio, setCriterio] = useState('');
  const [ayuda, setAyuda] = useState('');
  const [tipoResp, setTipoResp] = useState('SI_NO');
  const [obligatorio, setObligatorio] = useState(true);
  const [orden, setOrden] = useState(0);
  const [criterioFilter, setCriterioFilter] = useState('');
  const [showGenerarModal, setShowGenerarModal] = useState(false);
  const [estandarSeleccionado, setEstandarSeleccionado] = useState<number | null>(null);

  const { data: factores, isLoading: cargandoFactores } = useQuery({
    queryKey: ['factores-estandar', estandarSeleccionado],
    queryFn: async () => (estandarSeleccionado ? await bscApi.factoresPorEstandar(estandarSeleccionado) : []) as any[],
    enabled: !!estandarSeleccionado,
  });

  const { data: estandares } = useQuery({
    queryKey: ['catalogos', 'estandares'],
    queryFn: async () => await catalogosApi.estandaresAcreditacion() as any[],
  });

  const agregar = useAgregarItemChecklist(checklist.id);
  const actualizarItemMut = useActualizarItemChecklist(checklist.id);
  const eliminarItem = useEliminarItemChecklist(checklist.id);

  const generarFactores = async () => {
    if (!factores || !factores.length) return;
    const maxOrden = items.length;
    for (let fi = 0; fi < factores.length; fi++) {
      const f: any = factores[fi];
      const preguntas = [`${f.codigo} — ${f.nombre}`, ...(f.criterios_factor || []).map((c: any) => `${c.codigo} — ${c.nombre}`)];
      for (let pi = 0; pi < preguntas.length; pi++) {
        try {
          await agregar.mutateAsync({
            pregunta: preguntas[pi],
            criterio_referencia: f.estandares_acreditacion?.codigo ?? `F${f.orden}`,
            descripcion_ayuda: f.descripcion || undefined,
            tipo_respuesta: 'SI_NO',
            obligatorio: true,
            orden: maxOrden + fi * 10 + pi + 1,
          });
        } catch {}
      }
    }
    setShowGenerarModal(false);
    setEstandarSeleccionado(null);
  };

  const resetForm = () => {
    setPregunta(''); setCriterio(''); setAyuda(''); setTipoResp('SI_NO');
    setObligatorio(true); setOrden(0); setEditItem(null); setShowForm(false);
  };

  const guardarItem = () => {
    if (!pregunta) return;
    const data = { pregunta, criterio_referencia: criterio || undefined, descripcion_ayuda: ayuda || undefined, tipo_respuesta: tipoResp, obligatorio, orden: orden || undefined };
    const action = editItem
      ? actualizarItemMut.mutateAsync({ itemId: editItem.id, data })
      : agregar.mutateAsync(data);
    action.then(resetForm).catch(() => {});
  };

  const editar = (item: Item) => {
    setEditItem(item); setPregunta(item.pregunta); setCriterio(item.criterio_referencia ?? '');
    setAyuda(item.descripcion_ayuda ?? ''); setTipoResp(item.tipo_respuesta);
    setObligatorio(item.obligatorio); setOrden(item.orden); setShowForm(true);
  };

  const eliminar = (itemId: string) => {
    if (confirm('¿Eliminar este item?')) eliminarItem.mutate(itemId);
  };

  const cerrar = () => { resetForm(); onClose(); };

  const items: Item[] = (checklistFull as any)?.items_checklist ?? [];

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl p-8 text-sm text-gray-400">Cargando items...</div>
      {/* Modal: Generar desde estándar */}
      {showGenerarModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]" onClick={() => setShowGenerarModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Generar ítems desde estándar</h3>
              <button onClick={() => setShowGenerarModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-xs text-gray-500 mb-4">Seleccione un estándar de acreditación para generar automáticamente sus factores y criterios como ítems de checklist.</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {(estandares ?? []).map((e: any) => (
                <label
                  key={e.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${estandarSeleccionado === e.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  <input
                    type="radio"
                    name="estandar"
                    checked={estandarSeleccionado === e.id}
                    onChange={() => setEstandarSeleccionado(e.id)}
                    className="accent-blue-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{e.codigo} — {e.nombre}</p>
                    <p className="text-xs text-gray-400">{e.organismo}</p>
                  </div>
                </label>
              ))}
            </div>
            {cargandoFactores && (
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-3">
                <Loader2 className="w-4 h-4 animate-spin" /> Cargando factores...
              </div>
            )}
            {factores && factores.length > 0 && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
                Se generarán <strong>{factores.length + (factores as any[]).reduce((s: number, f: any) => s + (f.criterios_factor?.length || 0), 0)}</strong> ítems
                ({factores.length} factores + {(factores as any[]).reduce((s: number, f: any) => s + (f.criterios_factor?.length || 0), 0)} criterios).
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowGenerarModal(false)} className="btn-secondary text-xs px-4 py-2">Cancelar</button>
              <button
                onClick={generarFactores}
                disabled={!estandarSeleccionado || agregar.isPending}
                className="btn-primary text-xs px-4 py-2"
              >
                {agregar.isPending ? 'Generando...' : 'Generar ítems'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={cerrar}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <div>
            <h3 className="font-semibold text-gray-900">Items: {checklist.nombre}</h3>
            <p className="text-xs text-gray-400">{items.length} pregunta(s)</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowGenerarModal(true)} className="btn-secondary text-xs flex items-center gap-1 px-3 py-1.5">
              <BookOpen className="w-3.5 h-3.5" /> Generar desde estándar
            </button>
            <button onClick={cerrar} className="p-1 hover:bg-gray-100 rounded"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="shrink-0 border-b bg-gray-50 space-y-1">
            <button
              onClick={() => { resetForm(); setShowForm(!showForm); }}
              className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${showForm ? 'text-blue-700 bg-blue-50' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <PlusCircle className="w-4 h-4" />
              {showForm ? 'Cerrar formulario' : 'Agregar nuevo item'}
              {!showForm && <span className="ml-auto text-xs text-gray-400">ó haga clic en ✏️ de un item para editarlo</span>}
            </button>
            <div className="px-4 pb-2">
              <input
                value={criterioFilter}
                onChange={e => setCriterioFilter(e.target.value)}
                placeholder="Filtrar por criterio de referencia..."
                className="input w-full text-xs"
              />
            </div>
          </div>

          {showForm && (
            <div className="shrink-0 border-b p-4 bg-white space-y-3">
              <h4 className="text-sm font-semibold text-gray-700">{editItem ? `Editando item #${(editItem.orden || items.findIndex(i => i.id === editItem.id) + 1)}` : 'Nuevo item'}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-500 mb-0.5">Pregunta *</label>
                  <textarea value={pregunta} onChange={e => setPregunta(e.target.value)} className="input w-full text-sm" rows={2} placeholder="¿Se ha definido el alcance?" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-0.5">Criterio de referencia</label>
                  <input value={criterio} onChange={e => setCriterio(e.target.value)} className="input w-full text-sm" placeholder="ISO 9001:2015 4.3" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-0.5">Tipo respuesta</label>
                  <select value={tipoResp} onChange={e => setTipoResp(e.target.value)} className="input w-full text-sm">
                    <option value="SI_NO">Sí / No</option>
                    <option value="TEXTO">Texto libre</option>
                    <option value="NUMERICO">Numérico</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-500 mb-0.5">Ayuda / Descripción</label>
                  <input value={ayuda} onChange={e => setAyuda(e.target.value)} className="input w-full text-sm" placeholder="Verificar que el alcance esté definido..." />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input type="checkbox" checked={obligatorio} onChange={e => setObligatorio(e.target.checked)} className="rounded" />
                    Obligatorio
                  </label>
                  <div>
                    <label className="block text-xs text-gray-500 mb-0.5">Orden</label>
                    <input type="number" value={orden} onChange={e => setOrden(parseInt(e.target.value) || 0)} className="input w-20 text-sm" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={resetForm} className="btn-secondary text-xs px-3 py-1.5">Cancelar</button>
                <button onClick={guardarItem} disabled={!pregunta || agregar.isPending || actualizarItemMut.isPending} className="btn-primary text-xs px-3 py-1.5">
                  {agregar.isPending || actualizarItemMut.isPending ? 'Guardando...' : editItem ? 'Actualizar' : 'Agregar'}
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {(() => {
              const filtrados = criterioFilter
                ? items.filter(i => (i.criterio_referencia ?? '').toLowerCase().includes(criterioFilter.toLowerCase()) || i.pregunta.toLowerCase().includes(criterioFilter.toLowerCase()))
                : items;
              return filtrados.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-12">No hay items. Presione "Agregar nuevo item" para crear el primero.</p>
              ) : (
                <table className="tabla w-full">
                  <thead>
                    <tr className="text-xs uppercase text-gray-500 bg-gray-50 sticky top-0">
                      <th className="text-center px-3 py-2 w-10">#</th>
                      <th className="text-left px-3 py-2">Pregunta</th>
                      <th className="text-center px-3 py-2">Criterio</th>
                      <th className="text-center px-3 py-2">Tipo</th>
                      <th className="text-center px-3 py-2 w-16">Oblig.</th>
                      <th className="text-center px-3 py-2 w-20">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.map((item, i) => (
                      <tr key={item.id} className="border-t border-gray-100 text-sm hover:bg-gray-50">
                        <td className="text-center px-3 py-2.5 text-gray-400 font-mono text-xs">{i + 1}</td>
                        <td className="px-3 py-2.5">
                          <p className="text-gray-800 font-medium">{item.pregunta}</p>
                          {item.descripcion_ayuda && (
                            <p className="text-xs text-gray-400 mt-0.5 italic">{item.descripcion_ayuda}</p>
                          )}
                        </td>
                        <td className="text-center px-3 py-2.5">
                          <span className="text-xs font-mono text-gray-500">{item.criterio_referencia ?? '-'}</span>
                        </td>
                        <td className="text-center px-3 py-2.5">
                          <span className="badge-info text-xs">{item.tipo_respuesta}</span>
                        </td>
                        <td className="text-center px-3 py-2.5">
                          {item.obligatorio ? <span className="text-green-600 font-medium text-xs">Sí</span> : <span className="text-gray-400 text-xs">No</span>}
                        </td>
                        <td className="text-center px-3 py-2.5">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => editar(item)} className="p-1 hover:bg-gray-200 rounded" title="Editar">
                              <Pencil className="w-3.5 h-3.5 text-gray-500" />
                            </button>
                            <button onClick={() => eliminar(item.id)} className="p-1 hover:bg-red-100 rounded" title="Eliminar">
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

function VerModal({ checklist, onClose }: { checklist: Checklist; onClose: () => void }) {
  const items = checklist.items_checklist ?? [];

  const exportarPDF = () => {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();

    doc.setFontSize(16);
    doc.text(checklist.nombre, pageW / 2, 20, { align: 'center' });

    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Versión: v${checklist.version}  |  Tipo: ${checklist.tipos_auditoria?.nombre ?? '-'}  |  Items: ${items.length}`, pageW / 2, 28, { align: 'center' });

    if (checklist.descripcion) {
      doc.setFontSize(10);
      doc.setTextColor(80);
      doc.text(checklist.descripcion, 14, 36);
    }

    const yStart = checklist.descripcion ? 44 : 34;
    const body = items.map((item, i) => [
      String(i + 1),
      item.criterio_referencia ?? '',
      item.pregunta,
      item.tipo_respuesta,
      item.obligatorio ? 'Sí' : 'No',
    ]);

    (doc as any).autoTable({
      startY: yStart,
      head: [['#', 'Criterio', 'Pregunta', 'Tipo', 'Oblig.']],
      body,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 22 },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 18 },
        4: { cellWidth: 12 },
      },
    });

    doc.save(`checklist-${checklist.nombre.toLowerCase().replace(/\s+/g, '-')}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <div>
            <h3 className="font-semibold text-gray-900">{checklist.nombre}</h3>
            <p className="text-xs text-gray-400">
              v{checklist.version} &middot; {checklist.tipos_auditoria?.nombre ?? '-'} &middot; {items.length} ítem(s)
              {checklist.descripcion && ` &middot; ${checklist.descripcion}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => descargarArchivo(`/api/v1/checklists/${checklist.id}/exportar/pdf`, `checklist-${checklist.nombre.toLowerCase().replace(/\s+/g, '-')}.pdf`)} className="btn-secondary text-xs flex items-center gap-1 px-3 py-1.5" title="Exportar PDF (servidor)">
              <FileText className="w-3.5 h-3.5" /> PDF
            </button>
            <button onClick={exportarPDF} className="btn-secondary text-xs flex items-center gap-1 px-3 py-1.5" title="Exportar PDF (cliente)">
              <FileDown className="w-3.5 h-3.5" /> PDF (jsPDF)
            </button>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="tabla w-full">
            <thead>
              <tr className="text-xs uppercase text-gray-500 bg-gray-50 sticky top-0">
                <th className="text-center px-3 py-2 w-10">#</th>
                <th className="text-left px-3 py-2">Criterio</th>
                <th className="text-left px-3 py-2">Pregunta</th>
                <th className="text-center px-3 py-2">Tipo</th>
                <th className="text-center px-3 py-2">Oblig.</th>
                <th className="text-left px-3 py-2">Ayuda</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id} className="border-t border-gray-100 text-sm">
                  <td className="text-center px-3 py-2 text-gray-400 font-mono">{i + 1}</td>
                  <td className="px-3 py-2 text-gray-500 font-mono text-xs">{item.criterio_referencia ?? '-'}</td>
                  <td className="px-3 py-2 text-gray-800">{item.pregunta}</td>
                  <td className="text-center px-3 py-2"><span className="badge-info text-xs">{item.tipo_respuesta}</span></td>
                  <td className="text-center px-3 py-2">{item.obligatorio ? <span className="text-green-600 font-medium">Sí</span> : <span className="text-gray-400">No</span>}</td>
                  <td className="px-3 py-2 text-gray-400 text-xs max-w-[200px] truncate" title={item.descripcion_ayuda}>{item.descripcion_ayuda ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function ChecklistsPage() {
  const { data: checklists, isLoading } = useChecklists();
  const eliminar = useEliminarChecklist();
  const [modal, setModal] = useState(false);
  const [editCl, setEditCl] = useState<Checklist | undefined>();
  const [itemsModal, setItemsModal] = useState<Checklist | null>(null);
  const [verModal, setVerModal] = useState<Checklist | null>(null);

  const abrirEditar = (cl: Checklist) => { setEditCl(cl); setModal(true); };
  const cerrarModal = () => { setModal(false); setEditCl(undefined); };

  const eliminarCl = (cl: Checklist) => {
    if (confirm(`¿Eliminar "${cl.nombre}"?`)) eliminar.mutate(cl.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Checklists de Auditoría</h2>
          <p className="text-xs text-gray-400 mt-0.5">Gestión de plantillas de checklist por tipo de auditoría</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => descargarArchivo('/api/v1/checklists/exportar/csv', 'checklists.csv')} className="btn-secondary text-xs flex items-center gap-1.5 px-3 py-2" title="Exportar CSV">
            <FileDown className="w-3.5 h-3.5" /> CSV
          </button>
          <button onClick={() => descargarArchivo('/api/v1/checklists/exportar/xlsx', 'checklists.xlsx')} className="btn-secondary text-xs flex items-center gap-1.5 px-3 py-2" title="Exportar Excel">
            <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
          </button>
          <button onClick={() => descargarArchivo('/api/v1/checklists/exportar/pdf', 'checklists.pdf')} className="btn-secondary text-xs flex items-center gap-1.5 px-3 py-2" title="Exportar PDF">
            <FileText className="w-3.5 h-3.5" /> PDF
          </button>
          <button onClick={() => setModal(true)} className="btn-primary text-xs flex items-center gap-1.5 px-4 py-2">
            <Plus className="w-3.5 h-3.5" /> Nuevo Checklist
          </button>
        </div>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">Cargando...</div>
        ) : (!checklists || checklists.length === 0) ? (
          <div className="p-8 text-center text-sm text-gray-400">
            <ClipboardCheck className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            No hay checklists configurados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="tabla w-full">
              <thead>
                <tr className="text-xs uppercase text-gray-500">
                  <th className="text-left px-4 py-3">Nombre</th>
                  <th className="text-left px-4 py-3">Tipo</th>
                  <th className="text-center px-4 py-3">Versión</th>
                  <th className="text-center px-4 py-3">Items</th>
                  <th className="text-center px-4 py-3">Activo</th>
                  <th className="text-right px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {checklists.map((cl: Checklist) => (
                  <tr key={cl.id} className="border-t border-gray-100 text-sm hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{cl.nombre}</td>
                    <td className="px-4 py-3 text-gray-500">{cl.tipos_auditoria?.nombre ?? '-'}</td>
                    <td className="px-4 py-3 text-center text-gray-500 font-mono">v{cl.version}</td>
                    <td className="px-4 py-3 text-center text-gray-500">{cl._count?.items_checklist ?? 0}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`badge-${cl.esta_activo ? 'activo' : 'inactivo'}`}>
                        {cl.esta_activo ? 'Sí' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setVerModal(cl)} className="p-1.5 hover:bg-gray-100 rounded" title="Ver items">
                          <Eye className="w-4 h-4 text-gray-500" />
                        </button>
                        <button onClick={() => setItemsModal(cl)} className="p-1.5 hover:bg-gray-100 rounded" title="Gestionar items">
                          <FileQuestion className="w-4 h-4 text-blue-600" />
                        </button>
                        <button onClick={() => abrirEditar(cl)} className="p-1.5 hover:bg-gray-100 rounded" title="Editar">
                          <Pencil className="w-4 h-4 text-gray-500" />
                        </button>
                        <button onClick={() => eliminarCl(cl)} className="p-1.5 hover:bg-red-50 rounded" title="Eliminar">
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && <ChecklistModal checklist={editCl} onClose={cerrarModal} />}
      {itemsModal && <ItemsModal checklist={{ id: itemsModal.id, nombre: itemsModal.nombre }} onClose={() => setItemsModal(null)} />}
      {verModal && <VerModal checklist={verModal} onClose={() => setVerModal(null)} />}
    </div>
  );
}
