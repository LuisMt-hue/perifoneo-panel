import React, { useMemo, useState } from 'react';
import { X, Plus, Pencil, Trash2, Check, Loader2, Users, MapPinned } from 'lucide-react';
import type { TraccarGroup } from '../../live/types';
import type { ManagedDevice } from '../types';

interface ManageListsModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: TraccarGroup[];
  devices: ManagedDevice[];
  onCreateGroup: (name: string) => Promise<unknown>;
  onRenameGroup: (grupo: TraccarGroup, nuevoNombre: string) => Promise<unknown>;
  onDeleteGroup: (id: number) => Promise<unknown>;
  onRenameBase: (valorActual: string, nuevoValor: string) => Promise<unknown>;
  onDeleteBase: (valorActual: string) => Promise<unknown>;
  progresoBase: { actual: number; total: number } | null;
}

type Tab = 'grupos' | 'bases';

/**
 * Gestión de Grupos (entidad nativa de Traccar, CRUD real) y Bases (atributo de texto,
 * "CRUD" derivado de los dispositivos: renombrar/eliminar aplica en lote a quien la tenga;
 * crear una base nueva se hace desde el combobox del modal de dispositivo, no aquí).
 */
export const ManageListsModal: React.FC<ManageListsModalProps> = ({
  isOpen,
  onClose,
  groups,
  devices,
  onCreateGroup,
  onRenameGroup,
  onDeleteGroup,
  onRenameBase,
  onDeleteBase,
  progresoBase,
}) => {
  const [tab, setTab] = useState<Tab>('grupos');
  const [nuevoGrupo, setNuevoGrupo] = useState('');
  const [editando, setEditando] = useState<string | null>(null); // key: `group:${id}` o `base:${nombre}`
  const [valorEdicion, setValorEdicion] = useState('');
  const [creando, setCreando] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const basesConConteo = useMemo(() => {
    const conteo = new Map<string, number>();
    for (const d of devices) {
      const base = String(d.attributes?.base || '').trim();
      if (base) conteo.set(base, (conteo.get(base) || 0) + 1);
    }
    return Array.from(conteo.entries())
      .map(([nombre, total]) => ({ nombre, total }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { numeric: true }));
  }, [devices]);

  const gruposConConteo = useMemo(() => {
    const conteo = new Map<number, number>();
    for (const d of devices) {
      if (d.groupId != null) conteo.set(d.groupId, (conteo.get(d.groupId) || 0) + 1);
    }
    return [...groups]
      .sort((a, b) => a.name.localeCompare(b.name, 'es', { numeric: true }))
      .map((g) => ({ ...g, total: conteo.get(g.id) || 0 }));
  }, [groups, devices]);

  if (!isOpen) return null;

  const handleCrearGrupo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoGrupo.trim()) return;
    setCreando(true);
    setErrorLocal(null);
    try {
      await onCreateGroup(nuevoGrupo.trim());
      setNuevoGrupo('');
    } catch (err: any) {
      setErrorLocal(err.message || 'Error al crear el grupo.');
    } finally {
      setCreando(false);
    }
  };

  const iniciarEdicion = (key: string, valorActual: string) => {
    setEditando(key);
    setValorEdicion(valorActual);
    setErrorLocal(null);
  };

  const confirmarRenombreGrupo = async (grupo: TraccarGroup) => {
    const nuevo = valorEdicion.trim();
    if (!nuevo || nuevo === grupo.name) {
      setEditando(null);
      return;
    }
    try {
      await onRenameGroup(grupo, nuevo);
      setEditando(null);
    } catch (err: any) {
      setErrorLocal(err.message || 'Error al renombrar el grupo.');
    }
  };

  const confirmarRenombreBase = async (nombreActual: string) => {
    const nuevo = valorEdicion.trim();
    if (!nuevo || nuevo === nombreActual) {
      setEditando(null);
      return;
    }
    try {
      await onRenameBase(nombreActual, nuevo);
      setEditando(null);
    } catch (err: any) {
      setErrorLocal(err.message || 'Error al renombrar la base.');
    }
  };

  const handleEliminarGrupo = async (grupo: TraccarGroup) => {
    if (!window.confirm(`¿Eliminar el grupo "${grupo.name}"? Los dispositivos quedarán sin grupo.`)) return;
    try {
      await onDeleteGroup(grupo.id);
    } catch (err: any) {
      setErrorLocal(err.message || 'Error al eliminar el grupo.');
    }
  };

  const handleEliminarBase = async (nombre: string) => {
    if (!window.confirm(`¿Eliminar la base "${nombre}"? Se quitará de todos los dispositivos que la tengan.`)) return;
    try {
      await onDeleteBase(nombre);
    } catch (err: any) {
      setErrorLocal(err.message || 'Error al eliminar la base.');
    }
  };

  const bulkEnProgreso = progresoBase !== null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md border border-zinc-200/80 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <h3 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">
            Gestionar grupos y bases
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Segmented control de pestañas */}
        <div className="px-5 pt-3 shrink-0">
          <div className="flex items-center h-8 p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[12px] font-medium">
            <button
              type="button"
              onClick={() => setTab('grupos')}
              className={`flex-1 h-7 rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                tab === 'grupos'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold'
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              <Users size={12} />
              <span>Grupos</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('bases')}
              className={`flex-1 h-7 rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                tab === 'bases'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold'
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              <MapPinned size={12} />
              <span>Bases</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3.5 flex flex-col gap-2">
          {errorLocal && (
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[12px]">
              {errorLocal}
            </div>
          )}

          {bulkEnProgreso && (
            <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/50 border border-purple-200/60 dark:border-purple-800/60 text-[12px] text-purple-700 dark:text-purple-300 flex items-center gap-2">
              <Loader2 size={13} className="animate-spin" />
              <span>
                Actualizando dispositivos... {progresoBase!.actual}/{progresoBase!.total}
              </span>
            </div>
          )}

          {tab === 'grupos' && (
            <>
              <form onSubmit={handleCrearGrupo} className="flex items-center gap-2">
                <input
                  type="text"
                  disabled={creando}
                  value={nuevoGrupo}
                  onChange={(e) => setNuevoGrupo(e.target.value)}
                  placeholder="Nombre del nuevo grupo"
                  className="flex-1 h-9 px-3 text-[13px] bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#155BD0]/20 focus:border-[#155BD0]"
                />
                <button
                  type="submit"
                  disabled={creando || !nuevoGrupo.trim()}
                  className="h-9 w-9 rounded-lg bg-[#155BD0] hover:bg-[#114eb3] text-white flex items-center justify-center shadow-xs disabled:opacity-50 transition-all cursor-pointer shrink-0"
                  title="Crear grupo"
                >
                  {creando ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                </button>
              </form>

              <div className="flex flex-col gap-1 mt-1">
                {gruposConConteo.length === 0 && (
                  <p className="text-center text-[12px] text-zinc-400 py-6">
                    No hay grupos creados en Traccar aún.
                  </p>
                )}
                {gruposConConteo.map((g) => {
                  const key = `group:${g.id}`;
                  return (
                    <div
                      key={g.id}
                      className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
                    >
                      {editando === key ? (
                        <input
                          autoFocus
                          type="text"
                          value={valorEdicion}
                          onChange={(e) => setValorEdicion(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && confirmarRenombreGrupo(g)}
                          className="flex-1 h-8 px-2 text-[13px] bg-white dark:bg-zinc-900 border border-[#155BD0] rounded-md focus:outline-none"
                        />
                      ) : (
                        <span className="flex-1 text-[13px] font-medium text-zinc-800 dark:text-zinc-200 truncate">
                          {g.name}
                        </span>
                      )}
                      <span className="text-[11px] font-mono text-zinc-400 shrink-0">{g.total}</span>
                      {editando === key ? (
                        <button
                          type="button"
                          onClick={() => confirmarRenombreGrupo(g)}
                          className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer shrink-0"
                        >
                          <Check size={13} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => iniciarEdicion(key, g.name)}
                          className="p-1.5 rounded-md text-zinc-400 hover:text-[#155BD0] hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer shrink-0"
                        >
                          <Pencil size={13} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleEliminarGrupo(g)}
                        className="p-1.5 rounded-md text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {tab === 'bases' && (
            <div className="flex flex-col gap-1">
              <p className="text-[11px] text-zinc-400 px-1 pb-1">
                Las bases se crean asignándolas a un dispositivo. Aquí solo se renombran o eliminan.
              </p>
              {basesConConteo.length === 0 && (
                <p className="text-center text-[12px] text-zinc-400 py-6">
                  Ningún dispositivo tiene una base asignada aún.
                </p>
              )}
              {basesConConteo.map((b) => {
                const key = `base:${b.nombre}`;
                return (
                  <div
                    key={b.nombre}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
                  >
                    {editando === key ? (
                      <input
                        autoFocus
                        type="text"
                        value={valorEdicion}
                        onChange={(e) => setValorEdicion(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && confirmarRenombreBase(b.nombre)}
                        className="flex-1 h-8 px-2 text-[13px] bg-white dark:bg-zinc-900 border border-[#155BD0] rounded-md focus:outline-none"
                      />
                    ) : (
                      <span className="flex-1 text-[13px] font-medium text-zinc-800 dark:text-zinc-200 truncate">
                        {b.nombre}
                      </span>
                    )}
                    <span className="text-[11px] font-mono text-zinc-400 shrink-0">{b.total}</span>
                    {editando === key ? (
                      <button
                        type="button"
                        onClick={() => confirmarRenombreBase(b.nombre)}
                        className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer shrink-0"
                      >
                        <Check size={13} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => iniciarEdicion(key, b.nombre)}
                        className="p-1.5 rounded-md text-zinc-400 hover:text-[#155BD0] hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer shrink-0"
                      >
                        <Pencil size={13} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleEliminarBase(b.nombre)}
                      className="p-1.5 rounded-md text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageListsModal;
