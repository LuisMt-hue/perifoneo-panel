import React, { useState, useEffect } from 'react';
import { X, Search, Check, RotateCcw, Columns, Sparkles, CheckSquare, Square } from 'lucide-react';
import type { AttributeColumnConfig } from '../types';

interface ColumnVisibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  columnasDisponibles: AttributeColumnConfig[];
  onToggleColumna: (key: string) => void;
  onMarcarTodas: () => void;
  onDesmarcarTodas: () => void;
  onRestablecerPrioritarias: () => void;
}

export const ColumnVisibilityModal: React.FC<ColumnVisibilityModalProps> = ({
  isOpen,
  onClose,
  columnasDisponibles,
  onToggleColumna,
  onMarcarTodas,
  onDesmarcarTodas,
  onRestablecerPrioritarias,
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<'all' | 'priority' | 'standard' | 'attribute'>('all');

  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const columnasFiltradas = columnasDisponibles.filter((col) => {
    // Filtro por búsqueda
    const matchSearch =
      col.label.toLowerCase().includes(busqueda.toLowerCase()) ||
      col.key.toLowerCase().includes(busqueda.toLowerCase()) ||
      (col.description && col.description.toLowerCase().includes(busqueda.toLowerCase()));

    if (!matchSearch) return false;

    // Filtro por categoría
    if (filtroCategoria === 'priority') return col.isPriority;
    if (filtroCategoria === 'standard') return !col.isPriority && col.type === 'standard';
    if (filtroCategoria === 'attribute') return col.type === 'attribute';

    return true;
  });

  const totalVisibles = columnasDisponibles.filter((c) => c.visible).length;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md transition-opacity"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
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
              <div className="w-7 h-7 rounded-xl bg-blue-600/10 text-[#155BD0] dark:text-blue-400 flex items-center justify-center">
                <Columns size={16} />
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Selección de Columnas
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Cerrar modal (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Subtítulo, Buscador y Filtros */}
        <div className="px-6 pt-4 pb-3 border-b border-zinc-100 dark:border-zinc-800 shrink-0 space-y-3">
          <div className="flex items-center justify-between text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            <span>Selecciona las columnas visibles en la tabla</span>
            <span className="font-semibold text-[#155BD0] dark:text-blue-400 font-mono">
              {totalVisibles} de {columnasDisponibles.length} activas
            </span>
          </div>

          {/* Buscador de columnas con altura 40px */}
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
            />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar columna..."
              className="w-full h-10 pl-10 pr-9 text-sm bg-zinc-100/90 dark:bg-zinc-800/90 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#155BD0]/20 focus:border-[#155BD0] transition-all"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Botones de acción rápida y pestañas */}
          <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFiltroCategoria('all')}
                className={`h-8 px-3 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  filtroCategoria === 'all'
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-2xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                Todas
              </button>
              <button
                type="button"
                onClick={() => setFiltroCategoria('priority')}
                className={`h-8 px-3 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filtroCategoria === 'priority'
                    ? 'bg-[#155BD0] text-white shadow-2xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-[#155BD0]'
                }`}
              >
                <Sparkles size={12} />
                <span>Prioritarias (7)</span>
              </button>
              <button
                type="button"
                onClick={() => setFiltroCategoria('attribute')}
                className={`h-8 px-3 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  filtroCategoria === 'attribute'
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                Atributos
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onMarcarTodas}
                className="h-8 px-2.5 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1 cursor-pointer"
                title="Marcar todas las columnas"
              >
                <CheckSquare size={13} />
                <span>Todas</span>
              </button>
              <button
                type="button"
                onClick={onDesmarcarTodas}
                className="h-8 px-2.5 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1 cursor-pointer"
                title="Desmarcar todas"
              >
                <Square size={13} />
                <span>Ninguna</span>
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Columnas con Checkboxes */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2">
          {columnasFiltradas.length === 0 ? (
            <div className="text-center py-10 text-sm text-zinc-400">
              No se encontraron columnas coincidentes.
            </div>
          ) : (
            columnasFiltradas.map((col) => {
              const isChecked = col.visible;
              return (
                <label
                  key={col.key}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                    isChecked
                      ? 'bg-blue-50/50 dark:bg-blue-950/25 border-blue-200/80 dark:border-blue-900/50'
                      : 'bg-zinc-50/50 dark:bg-zinc-800/30 border-zinc-200/70 dark:border-zinc-800 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 pr-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleColumna(col.key)}
                      className="rounded-md text-[#155BD0] focus:ring-[#155BD0] h-4.5 w-4.5 cursor-pointer shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 tracking-tight">
                          {col.label}
                        </span>
                        {col.isPriority && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-[#155BD0] dark:text-blue-300 text-3xs font-extrabold uppercase tracking-wide">
                            Prioritaria
                          </span>
                        )}
                        {col.isCustom && (
                          <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 text-3xs font-mono">
                            Atributo
                          </span>
                        )}
                      </div>
                      {col.description && (
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
                          {col.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="text-xs font-mono text-zinc-400 shrink-0">
                    {col.key}
                  </span>
                </label>
              );
            })
          )}
        </div>

        {/* Pie con Botón Restablecer Prioritarias y Confirmar */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/40 shrink-0">
          <button
            type="button"
            onClick={onRestablecerPrioritarias}
            className="h-10 flex items-center gap-2 px-3.5 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Mostrar solo NOMBRE, DNI, BASE, DISTRITO, PLACA DEL CARRO, CELULAR, SECTOR"
          >
            <RotateCcw size={15} />
            <span>Restablecer Prioritarias</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="h-10 flex items-center gap-2 px-5 rounded-xl bg-[#155BD0] hover:bg-[#114eb3] text-white text-sm font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Check size={16} />
            <span>Listo</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColumnVisibilityModal;
