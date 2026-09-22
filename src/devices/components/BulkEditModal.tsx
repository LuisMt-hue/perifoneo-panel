import React, { useState } from 'react';
import { X, Check, Loader2, Layers } from 'lucide-react';

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (clave: string, valor: string) => Promise<void>;
  clavesDisponibles: string[];
  totalSeleccionados: number;
  progreso: { actual: number; total: number } | null;
}

export const BulkEditModal: React.FC<BulkEditModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  clavesDisponibles,
  totalSeleccionados,
  progreso,
}) => {
  const [clave, setClave] = useState(clavesDisponibles[0] || 'sector_asignado');
  const [valor, setValor] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clave) return;
    await onSubmit(clave, valor.trim());
  };

  const isExecuting = progreso !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border border-zinc-200/80 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 overflow-hidden">
        {/* Encabezado */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600/10 dark:bg-purple-400/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Layers size={17} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Editar en Masa ({totalSeleccionados} dispositivos)
              </h2>
              <p className="text-2xs text-zinc-500 dark:text-zinc-400">
                Aplica el mismo valor a los dispositivos seleccionados
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isExecuting}
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-2xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
              Seleccionar Atributo a Modificar
            </label>
            <select
              value={clave}
              disabled={isExecuting}
              onChange={(e) => setClave(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            >
              {clavesDisponibles.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-2xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
              Nuevo Valor para los {totalSeleccionados} Dispositivos
            </label>
            <input
              type="text"
              disabled={isExecuting}
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="Ej: Sector Centro, Activo, Turno Mañana..."
              className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-3xs text-zinc-400 mt-1">
              Dejar vacío si deseas borrar este atributo en los dispositivos seleccionados.
            </p>
          </div>

          {progreso && (
            <div className="p-3 rounded-2xl bg-purple-50/80 dark:bg-purple-950/50 border border-purple-200/60 dark:border-purple-800/60">
              <div className="flex items-center justify-between text-xs font-semibold text-purple-700 dark:text-purple-300 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Loader2 size={13} className="animate-spin text-purple-600" />
                  <span>Actualizando en lote...</span>
                </span>
                <span className="font-mono">
                  {progreso.actual} / {progreso.total}
                </span>
              </div>
              <div className="w-full h-1.5 bg-purple-200/60 dark:bg-purple-900/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600 transition-all duration-200"
                  style={{ width: `${(progreso.actual / progreso.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              disabled={isExecuting}
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isExecuting || !clave}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/20 disabled:opacity-50 transition-all"
            >
              {isExecuting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              <span>Aplicar Cambio en Masa</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkEditModal;
