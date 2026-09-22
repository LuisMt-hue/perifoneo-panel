import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  Check,
  Loader2,
  Layers,
  Database,
  Search,
} from 'lucide-react';
import type { ManagedDevice } from '../types';
import { PRIORITY_COLUMN_KEYS } from '../constants';

interface AttributeManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: ManagedDevice[];
  selectedIds: Set<number>;
  onCrearAtributo: (clave: string, valorDefecto: any, alcance: 'all' | 'selected') => Promise<void>;
  onRenombrarAtributo: (claveActual: string, nuevaClave: string) => Promise<void>;
  onEliminarAtributo: (clave: string) => Promise<void>;
  progreso: { actual: number; total: number } | null;
}

const SUGERENCIAS_ATRIBUTOS = [
  'base',
  'distrito',
  'placa',
  'sector',
  'turno',
  'supervisor',
  'observaciones',
  'empresa',
  'telefono_chofer',
];

export const AttributeManagerModal: React.FC<AttributeManagerModalProps> = ({
  isOpen,
  onClose,
  devices,
  selectedIds,
  onCrearAtributo,
  onRenombrarAtributo,
  onEliminarAtributo,
  progreso,
}) => {
  const [tabActiva, setTabActiva] = useState<'crear' | 'listar'>('crear');
  const [nuevaClave, setNuevaClave] = useState('');
  const [valorDefecto, setValorDefecto] = useState('');
  const [alcance, setAlcance] = useState<'all' | 'selected'>(
    selectedIds.size > 0 ? 'selected' : 'all'
  );

  // Estado para renombrar
  const [renombrandoClave, setRenombrandoClave] = useState<string | null>(null);
  const [nuevoNombreClave, setNuevoNombreClave] = useState('');

  // Buscador de atributos en la lista
  const [busquedaLista, setBusquedaLista] = useState('');

  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !progreso) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, progreso]);

  // Descubrir estadísticas de uso de atributos en los dispositivos
  const estadisticasAtributos = useMemo(() => {
    const mapa = new Map<string, number>();

    for (const dev of devices) {
      if (dev.attributes && typeof dev.attributes === 'object') {
        for (const [k, v] of Object.entries(dev.attributes)) {
          if (v !== undefined && v !== null && v !== '') {
            mapa.set(k, (mapa.get(k) || 0) + 1);
          } else if (k in dev.attributes) {
            mapa.set(k, mapa.get(k) || 0);
          }
        }
      }
    }

    return Array.from(mapa.entries())
      .map(([key, count]) => ({
        key,
        count,
        isPriority: PRIORITY_COLUMN_KEYS.includes(key.toLowerCase()),
      }))
      .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
  }, [devices]);

  if (!isOpen) return null;

  const isExecuting = progreso !== null;

  const handleCrearSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = nuevaClave.trim();
    if (!cleanKey) return;
    await onCrearAtributo(cleanKey, valorDefecto.trim(), alcance);
    setNuevaClave('');
    setValorDefecto('');
  };

  const handleIniciarRenombrar = (key: string) => {
    setRenombrandoClave(key);
    setNuevoNombreClave(key);
  };

  const handleGuardarRenombrar = async () => {
    if (!renombrandoClave || !nuevoNombreClave.trim() || renombrandoClave === nuevoNombreClave.trim()) {
      setRenombrandoClave(null);
      return;
    }
    await onRenombrarAtributo(renombrandoClave, nuevoNombreClave.trim());
    setRenombrandoClave(null);
  };

  const handleConfirmarEliminar = async (key: string) => {
    const confirmacion = window.confirm(
      `¿Estás seguro de eliminar el atributo "${key}" de TODOS los dispositivos? Esta acción no se puede deshacer.`
    );
    if (!confirmacion) return;
    await onEliminarAtributo(key);
  };

  const atributosFiltrados = estadisticasAtributos.filter((a) =>
    a.key.toLowerCase().includes(busquedaLista.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isExecuting) onClose();
      }}
    >
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-xl border border-zinc-200/80 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 transform transition-all animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Cabecera macOS */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
            <div className="ml-2 flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Database size={16} />
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                CRUD de Atributos Personalizados
              </h3>
            </div>
          </div>

          <button
            type="button"
            disabled={isExecuting}
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Pestañas de Navegación con altura y tamaño Apple */}
        <div className="flex items-center px-6 pt-3 pb-2 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setTabActiva('crear')}
            className={`h-9 flex items-center gap-2 px-3.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              tabActiva === 'crear'
                ? 'bg-[#155BD0] text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Plus size={15} />
            <span>Crear / Propagar Atributo</span>
          </button>

          <button
            type="button"
            onClick={() => setTabActiva('listar')}
            className={`h-9 flex items-center gap-2 px-3.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              tabActiva === 'listar'
                ? 'bg-[#155BD0] text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Layers size={15} />
            <span>Atributos Existentes ({estadisticasAtributos.length})</span>
          </button>
        </div>

        {/* Barra de Progreso en Lote */}
        {progreso && (
          <div className="p-3.5 mx-6 mt-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/60 shrink-0">
            <div className="flex items-center justify-between text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1.5">
              <span className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-[#155BD0]" />
                <span>Procesando en Traccar...</span>
              </span>
              <span className="font-mono">
                {progreso.actual} / {progreso.total}
              </span>
            </div>
            <div className="w-full h-2 bg-blue-200/60 dark:bg-blue-900/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#155BD0] transition-all duration-200"
                style={{ width: `${(progreso.actual / progreso.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Contenido según Pestaña */}
        <div className="flex-1 overflow-y-auto p-6">
          {tabActiva === 'crear' ? (
            <form onSubmit={handleCrearSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Nombre de la Clave (Atributo) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={isExecuting}
                  value={nuevaClave}
                  onChange={(e) => setNuevaClave(e.target.value)}
                  placeholder="Ej: base, distrito, placa, sector, turno..."
                  className="w-full h-10 px-3.5 text-sm bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#155BD0]/20 focus:border-[#155BD0] font-mono transition-all"
                />

                {/* Sugerencias rápidas */}
                <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                  <span className="text-xs text-zinc-400 font-medium">Sugerencias:</span>
                  {SUGERENCIAS_ATRIBUTOS.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      disabled={isExecuting}
                      onClick={() => setNuevaClave(sug)}
                      className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-mono hover:bg-blue-50 hover:text-[#155BD0] transition-colors cursor-pointer"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Valor Inicial (Opcional)
                </label>
                <input
                  type="text"
                  disabled={isExecuting}
                  value={valorDefecto}
                  onChange={(e) => setValorDefecto(e.target.value)}
                  placeholder="Dejar vacío o ingresar valor inicial para las unidades..."
                  className="w-full h-10 px-3.5 text-sm bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#155BD0]/20 focus:border-[#155BD0] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Alcance de aplicación:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={isExecuting}
                    onClick={() => setAlcance('all')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      alcance === 'all'
                        ? 'border-[#155BD0] bg-blue-50/50 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100'
                        : 'border-zinc-200/80 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    <div className="text-sm font-bold">Todos los Dispositivos</div>
                    <div className="text-xs text-zinc-500 mt-0.5">{devices.length} unidades</div>
                  </button>

                  <button
                    type="button"
                    disabled={isExecuting || selectedIds.size === 0}
                    onClick={() => setAlcance('selected')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      alcance === 'selected'
                        ? 'border-[#155BD0] bg-blue-50/50 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100'
                        : selectedIds.size === 0
                        ? 'opacity-50 cursor-not-allowed border-zinc-200/80 dark:border-zinc-800 text-zinc-400'
                        : 'border-zinc-200/80 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    <div className="text-sm font-bold">Solo Seleccionados</div>
                    <div className="text-xs text-zinc-500 mt-0.5">{selectedIds.size} seleccionados</div>
                  </button>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={isExecuting || !nuevaClave.trim()}
                  className="h-10 flex items-center gap-2 px-5 text-sm font-semibold rounded-xl bg-[#155BD0] hover:bg-[#114eb3] text-white shadow-sm disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isExecuting ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                  <span>Guardar y Propagar Atributo</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3.5">
              {/* Buscador de atributos en la lista */}
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
                />
                <input
                  type="text"
                  value={busquedaLista}
                  onChange={(e) => setBusquedaLista(e.target.value)}
                  placeholder="Filtrar atributos existentes..."
                  className="w-full h-10 pl-10 pr-3.5 text-sm bg-zinc-100/90 dark:bg-zinc-800/90 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#155BD0]/20 focus:border-[#155BD0]"
                />
              </div>

              {/* Lista de atributos existentes */}
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {atributosFiltrados.length === 0 ? (
                  <div className="text-center py-8 text-sm text-zinc-400 italic">
                    No se encontraron atributos coincidentes.
                  </div>
                ) : (
                  atributosFiltrados.map((attr) => {
                    const estaRenombrando = renombrandoClave === attr.key;

                    return (
                      <div
                        key={attr.key}
                        className="flex items-center justify-between p-3 rounded-2xl border border-zinc-200/70 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/30"
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
                          {estaRenombrando ? (
                            <div className="flex items-center gap-2 flex-1">
                              <input
                                type="text"
                                value={nuevoNombreClave}
                                onChange={(e) => setNuevoNombreClave(e.target.value)}
                                className="w-full h-9 px-3 text-sm bg-white dark:bg-zinc-800 border-2 border-[#155BD0] rounded-xl text-zinc-900 dark:text-zinc-100 font-mono"
                              />
                              <button
                                type="button"
                                onClick={handleGuardarRenombrar}
                                className="h-9 w-9 rounded-xl flex items-center justify-center text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                                title="Guardar cambio de nombre"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setRenombrandoClave(null)}
                                className="h-9 w-9 rounded-xl flex items-center justify-center text-zinc-400 hover:bg-zinc-100 cursor-pointer"
                                title="Cancelar"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-sm text-zinc-800 dark:text-zinc-200">
                                  {attr.key}
                                </span>
                                {attr.isPriority && (
                                  <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-[#155BD0] dark:text-blue-300 text-3xs font-extrabold uppercase">
                                    Prioritario
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-zinc-400 mt-0.5">
                                Presente en {attr.count} de {devices.length} dispositivos
                              </div>
                            </div>
                          )}
                        </div>

                        {!estaRenombrando && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              disabled={isExecuting}
                              onClick={() => handleIniciarRenombrar(attr.key)}
                              title="Renombrar clave de atributo"
                              className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-[#155BD0] hover:bg-blue-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              disabled={isExecuting}
                              onClick={() => handleConfirmarEliminar(attr.key)}
                              title="Eliminar atributo de todos los dispositivos"
                              className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pie */}
        <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/40 flex justify-end shrink-0">
          <button
            type="button"
            disabled={isExecuting}
            onClick={onClose}
            className="h-10 px-4 text-sm font-semibold rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttributeManagerModal;
