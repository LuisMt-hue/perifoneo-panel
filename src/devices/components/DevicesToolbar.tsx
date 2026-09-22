import React, { useState } from 'react';
import {
  Search,
  X,
  Sparkles,
  RotateCw,
  Eye,
  Filter,
} from 'lucide-react';
import type { DeviceFilterState, AttributeColumnConfig } from '../types';

interface DevicesToolbarProps {
  filters: DeviceFilterState;
  onFilterChange: (filters: DeviceFilterState) => void;
  columnasDisponibles: AttributeColumnConfig[];
  onToggleColumna: (colKey: string) => void;
  todasLasClavesAtributos: string[];
  totalDispositivos: number;
  totalFiltrados: number;
  totalOnline: number;
  totalOffline: number;
  onOpenAddAttribute: () => void;
  onRecargar: () => void;
  cargando: boolean;
}

export const DevicesToolbar: React.FC<DevicesToolbarProps> = ({
  filters,
  onFilterChange,
  columnasDisponibles,
  onToggleColumna,
  todasLasClavesAtributos,
  totalDispositivos,
  totalFiltrados,
  totalOnline,
  totalOffline,
  onOpenAddAttribute,
  onRecargar,
  cargando,
}) => {
  const [columnasMenuAbierto, setColumnasMenuAbierto] = useState(false);

  const handleSearchChange = (val: string) => {
    onFilterChange({ ...filters, search: val });
  };

  const handleStatusChange = (status: DeviceFilterState['status']) => {
    onFilterChange({ ...filters, status });
  };

  const handleMissingAttributeChange = (missingAttribute: string | null) => {
    onFilterChange({ ...filters, missingAttribute });
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-200/80 dark:border-zinc-800">
      {/* Fila Superior: Buscador, Botones de Acción y Selector de Columnas */}
      <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
        {/* Buscador Universal */}
        <div className="relative w-full sm:w-80 lg:w-96">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
          />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar por nombre, DNI, teléfono, atributo..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-zinc-100/80 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60 rounded-xl text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => handleSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {/* Botón Agregar Atributo Global */}
          <button
            type="button"
            onClick={onOpenAddAttribute}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles size={14} />
            <span>+ Atributo Global</span>
          </button>

          {/* Menú Desplegable de Columnas Visibles */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setColumnasMenuAbierto(!columnasMenuAbierto)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                columnasMenuAbierto
                  ? 'bg-zinc-200 dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100'
                  : 'bg-white dark:bg-zinc-800/90 border-zinc-200/80 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50'
              }`}
            >
              <Eye size={14} />
              <span>Columnas</span>
            </button>

            {columnasMenuAbierto && (
              <div
                onMouseLeave={() => setColumnasMenuAbierto(false)}
                className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100 max-h-80 overflow-y-auto"
              >
                <div className="px-2 py-1 text-3xs uppercase font-bold text-zinc-400 tracking-wider">
                  Mostrar / Ocultar Columnas
                </div>
                <div className="space-y-1 mt-1">
                  {columnasDisponibles.map((col) => (
                    <label
                      key={col.key}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 cursor-pointer text-zinc-700 dark:text-zinc-300 select-none"
                    >
                      <input
                        type="checkbox"
                        checked={col.visible}
                        onChange={() => onToggleColumna(col.key)}
                        className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                      />
                      <span className="truncate font-mono">{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Botón Recargar */}
          <button
            type="button"
            onClick={onRecargar}
            disabled={cargando}
            title="Recargar dispositivos"
            className="p-2 rounded-xl bg-white dark:bg-zinc-800/90 border border-zinc-200/80 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 transition-all"
          >
            <RotateCw size={14} className={cargando ? 'animate-spin text-blue-500' : ''} />
          </button>
        </div>
      </div>

      {/* Fila Inferior: Filtros de Estado tipo Pills y Auditoría de Atributos */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Pills de Estado */}
          <button
            type="button"
            onClick={() => handleStatusChange('all')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              filters.status === 'all'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
            }`}
          >
            Todos ({totalDispositivos})
          </button>

          <button
            type="button"
            onClick={() => handleStatusChange('online')}
            className={`flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              filters.status === 'online'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>En Línea ({totalOnline})</span>
          </button>

          <button
            type="button"
            onClick={() => handleStatusChange('offline')}
            className={`flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              filters.status === 'offline'
                ? 'bg-zinc-700 text-white shadow-xs'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            <span>Desconectados ({totalOffline})</span>
          </button>

          <button
            type="button"
            onClick={() => handleStatusChange('disabled')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              filters.status === 'disabled'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100'
            }`}
          >
            Deshabilitados
          </button>
        </div>

        {/* Auditoría: Filtrar por Atributo Faltante */}
        <div className="flex items-center gap-2">
          {todasLasClavesAtributos.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <Filter size={12} className="text-zinc-400" />
              <span className="text-3xs uppercase font-bold text-zinc-400 hidden sm:inline">
                Falta atributo:
              </span>
              <select
                value={filters.missingAttribute || ''}
                onChange={(e) => handleMissingAttributeChange(e.target.value || null)}
                className="px-2 py-1 text-2xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 font-mono focus:outline-none"
              >
                <option value="">(Ninguno)</option>
                {todasLasClavesAtributos.map((k) => (
                  <option key={k} value={k}>
                    Sin "{k}"
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="text-2xs font-mono font-bold text-zinc-400">
            {totalFiltrados} de {totalDispositivos}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevicesToolbar;
