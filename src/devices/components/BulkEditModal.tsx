import React, { useMemo, useState } from 'react';
import { X, Check, Loader2, Layers } from 'lucide-react';
import type { TraccarGeofence, TraccarGroup } from '../../live/types';
import SearchSelectCombobox from '../../shared/components/ui/SearchSelectCombobox';

type CampoEditable = 'base' | 'sector' | 'groupId';

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (fieldOrKey: string, value: string, isAttribute: boolean) => Promise<void>;
  totalSeleccionados: number;
  progreso: { actual: number; total: number } | null;
  geofences: TraccarGeofence[];
  groups: TraccarGroup[];
  basesConocidas: string[];
}

const CAMPOS: Array<{ value: CampoEditable; label: string }> = [
  { value: 'base', label: 'Base' },
  { value: 'sector', label: 'Sector' },
  { value: 'groupId', label: 'Grupo' },
];

export const BulkEditModal: React.FC<BulkEditModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  totalSeleccionados,
  progreso,
  geofences,
  groups,
  basesConocidas,
}) => {
  const [campo, setCampo] = useState<CampoEditable>('base');
  const [valor, setValor] = useState('');
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const opcionesGrupo = useMemo(() => groups.map((g) => ({ value: String(g.id), label: g.name })), [groups]);
  const opcionesSector = useMemo(() => geofences.map((g) => ({ value: g.name, label: g.name })), [geofences]);
  const opcionesBase = useMemo(() => basesConocidas.map((b) => ({ value: b, label: b })), [basesConocidas]);

  if (!isOpen) return null;

  const isExecuting = progreso !== null;

  const handleCampoChange = (nuevo: CampoEditable) => {
    setCampo(nuevo);
    setValor('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLocal(null);
    try {
      await onSubmit(campo, valor.trim(), campo !== 'groupId');
      setValor('');
    } catch (err: any) {
      setErrorLocal(err.message || 'Error al aplicar el cambio en masa.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-6 overflow-hidden border border-zinc-200/80 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Editar en Masa ({totalSeleccionados} dispositivos)
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Aplica el mismo valor a los dispositivos seleccionados
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isExecuting}
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {errorLocal && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm">
              {errorLocal}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
              Campo a modificar
            </label>
            <select
              value={campo}
              disabled={isExecuting}
              onChange={(e) => handleCampoChange(e.target.value as CampoEditable)}
              className="w-full h-10 px-3.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#155BD0]/20 focus:border-[#155BD0] cursor-pointer"
            >
              {CAMPOS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
              Nuevo valor para los {totalSeleccionados} dispositivos
            </label>

            {campo === 'base' && (
              <SearchSelectCombobox
                options={opcionesBase}
                value={valor}
                onChange={setValor}
                placeholder="Buscar o escribir una base..."
                emptyOptionLabel="Sin base (borra el atributo)"
                allowCustomValue
                disabled={isExecuting}
              />
            )}

            {campo === 'sector' && (
              <SearchSelectCombobox
                options={opcionesSector}
                value={valor}
                onChange={setValor}
                placeholder="Buscar sector..."
                emptyOptionLabel="Sin sector"
                allowCustomValue={false}
                disabled={isExecuting}
              />
            )}

            {campo === 'groupId' && (
              <SearchSelectCombobox
                options={opcionesGrupo}
                value={valor}
                onChange={setValor}
                placeholder={opcionesGrupo.length === 0 ? 'Sin grupos en Traccar' : 'Buscar grupo...'}
                emptyOptionLabel="Sin grupo"
                allowCustomValue={false}
                disabled={isExecuting}
              />
            )}
          </div>

          {progreso && (
            <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200/60 dark:border-purple-800/60">
              <div className="flex items-center justify-between text-xs font-semibold text-purple-700 dark:text-purple-300 mb-1.5">
                <span className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-purple-600" />
                  <span>Actualizando en lote...</span>
                </span>
                <span className="font-mono">
                  {progreso.actual} / {progreso.total}
                </span>
              </div>
              <div className="w-full h-2 bg-purple-200/60 dark:bg-purple-900/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600 transition-all duration-200"
                  style={{ width: `${(progreso.actual / progreso.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3">
            <button
              type="button"
              disabled={isExecuting}
              onClick={onClose}
              className="h-10 px-4 text-sm font-semibold rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isExecuting}
              className="h-10 flex items-center gap-2 px-5 text-sm font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-sm disabled:opacity-50 transition-all cursor-pointer"
            >
              {isExecuting ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              <span>Aplicar Cambio en Masa</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkEditModal;
