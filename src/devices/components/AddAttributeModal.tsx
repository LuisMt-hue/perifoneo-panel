import React, { useState } from 'react';
import { X, Sparkles, Check, Loader2 } from 'lucide-react';

interface AddAttributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (clave: string, valorDefecto: string, alcance: 'all' | 'selected') => Promise<void>;
  totalDispositivos: number;
  totalSeleccionados: number;
  progreso: { actual: number; total: number } | null;
}

const SUGERENCIAS_ATRIBUTOS = [
  'sector_asignado',
  'conductor',
  'Placa',
  'telefono_chofer',
  'supervisor',
  'horario_turno',
  'observaciones',
  'empresa',
];

export const AddAttributeModal: React.FC<AddAttributeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  totalDispositivos,
  totalSeleccionados,
  progreso,
}) => {
  const [clave, setClave] = useState('');
  const [valorDefecto, setValorDefecto] = useState('');
  const [alcance, setAlcance] = useState<'all' | 'selected'>(
    totalSeleccionados > 0 ? 'selected' : 'all'
  );

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = clave.trim();
    if (!cleanKey) {
      alert('Por favor ingresa un nombre para el atributo.');
      return;
    }
    await onSubmit(cleanKey, valorDefecto.trim(), alcance);
  };

  const isExecuting = progreso !== null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border border-zinc-200/80 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 overflow-hidden">
        {/* Encabezado */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600/10 dark:bg-blue-400/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Sparkles size={17} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Agregar Atributo Global
              </h2>
              <p className="text-2xs text-zinc-500 dark:text-zinc-400">
                Crea una nueva columna/atributo en los dispositivos
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
          {/* Nombre de Clave */}
          <div>
            <label className="block text-2xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
              Nombre del Atributo (Clave)
            </label>
            <input
              type="text"
              required
              disabled={isExecuting}
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              placeholder="Ej: sector_asignado, Placa, conductor..."
              className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />

            {/* Sugerencias Rápidas */}
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              <span className="text-3xs text-zinc-400 font-medium">Sugerencias:</span>
              {SUGERENCIAS_ATRIBUTOS.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  disabled={isExecuting}
                  onClick={() => setClave(sug)}
                  className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-3xs font-mono hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Valor por Defecto */}
          <div>
            <label className="block text-2xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
              Valor Inicial (Opcional)
            </label>
            <input
              type="text"
              disabled={isExecuting}
              value={valorDefecto}
              onChange={(e) => setValorDefecto(e.target.value)}
              placeholder="Dejar vacío o ingresar valor inicial..."
              className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Alcance de aplicación */}
          <div>
            <label className="block text-2xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
              Aplicar a:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isExecuting}
                onClick={() => setAlcance('all')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  alcance === 'all'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100'
                    : 'border-zinc-200/80 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <div className="text-xs font-bold">Todos los Dispositivos</div>
                <div className="text-2xs text-zinc-500">{totalDispositivos} unidades</div>
              </button>

              <button
                type="button"
                disabled={isExecuting || totalSeleccionados === 0}
                onClick={() => setAlcance('selected')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  alcance === 'selected'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100'
                    : totalSeleccionados === 0
                    ? 'opacity-50 cursor-not-allowed border-zinc-200/80 dark:border-zinc-800 text-zinc-400'
                    : 'border-zinc-200/80 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <div className="text-xs font-bold">Solo Seleccionados</div>
                <div className="text-2xs text-zinc-500">{totalSeleccionados} seleccionados</div>
              </button>
            </div>
          </div>

          {/* Progreso en Tiempo Real si está ejecutándose */}
          {progreso && (
            <div className="p-3 rounded-2xl bg-blue-50/80 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/60">
              <div className="flex items-center justify-between text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Loader2 size={13} className="animate-spin text-blue-600" />
                  <span>Propagando atributo en Traccar...</span>
                </span>
                <span className="font-mono">
                  {progreso.actual} / {progreso.total}
                </span>
              </div>
              <div className="w-full h-1.5 bg-blue-200/60 dark:bg-blue-900/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-200"
                  style={{ width: `${(progreso.actual / progreso.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Botones de Acción */}
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
              disabled={isExecuting || !clave.trim()}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all"
            >
              {isExecuting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              <span>Propagar Atributo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAttributeModal;
