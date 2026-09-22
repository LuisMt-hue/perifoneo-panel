import React from 'react';
import {
  Search,
  X,
  Plus,
  Sparkles,
  RotateCw,
  Columns,
  Filter,
} from 'lucide-react';
import type { DeviceFilterState, AttributeColumnConfig } from '../types';

interface DevicesToolbarProps {
  filters: DeviceFilterState;
  onFilterChange: (filters: DeviceFilterState) => void;
  columnasDisponibles: AttributeColumnConfig[];
  todasLasClavesAtributos: string[];
  totalDispositivos: number;
  totalFiltrados: number;
  totalOnline: number;
  totalOffline: number;
  onOpenCreateDevice: () => void;
  onOpenAttributeManager: () => void;
  onOpenColumnModal: () => void;
  onRecargar: () => void;
  cargando: boolean;
}

export const DevicesToolbar: React.FC<DevicesToolbarProps> = ({
  filters,
  onFilterChange,
  columnasDisponibles,
  todasLasClavesAtributos,
  totalDispositivos,
  totalFiltrados,
  totalOnline,
  totalOffline,
  onOpenCreateDevice,
  onOpenAttributeManager,
  onOpenColumnModal,
  onRecargar,
  cargando,
}) => {
  const handleSearchChange = (val: string) => {
    onFilterChange({ ...filters, search: val });
  };

  const handleStatusChange = (status: DeviceFilterState['status']) => {
    onFilterChange({ ...filters, status });
  };

  const handleMissingAttributeChange = (missingAttribute: string | null) => {
    onFilterChange({ ...filters, missingAttribute });
  };

  const totalColumnasVisibles = columnasDisponibles.filter((c) => c.visible).length;

  return (
    <div className="flex flex-col gap-3.5 p-4 sm:p-5 bg-white dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800 shrink-0">
      {/* Fila Superior: Buscador y Botones de Acción estilo Apple */}
      <div className="flex items-center justify-between gap-3 flex-wrap lg:flex-nowrap">
        {/* Buscador Universal con altura y tipografía refinada */}
        <div className="relative w-full lg:w-96">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
          />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar por nombre, DNI, celular, placa, base, sector..."
            className="w-full h-10 pl-10 pr-9 text-sm bg-zinc-100/90 dark:bg-zinc-800/90 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#155BD0]/20 focus:border-[#155BD0] transition-all"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer p-0.5"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Botones de Acción con estilo Apple (altura 40px, tipografía clara) */}
        <div className="flex items-center gap-2 shrink-0 ml-auto w-full sm:w-auto justify-end flex-wrap">
          {/* Botón + Nuevo Dispositivo */}
          <button
            type="button"
            onClick={onOpenCreateDevice}
            className="h-10 px-4 rounded-xl bg-[#155BD0] hover:bg-[#114eb3] text-white text-sm font-semibold shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center gap-2 cursor-pointer"
            title="Registrar un nuevo perifoneador en Traccar"
          >
            <Plus size={16} />
            <span>Nuevo Dispositivo</span>
          </button>

          {/* Botón CRUD Atributos */}
          <button
            type="button"
            onClick={onOpenAttributeManager}
            className="h-10 px-3.5 rounded-xl border border-purple-200/90 dark:border-purple-800/80 bg-purple-50/80 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-sm font-semibold hover:bg-purple-100/80 dark:hover:bg-purple-900/40 transition-all flex items-center gap-2 cursor-pointer"
            title="Gestionar atributos (Crear, Renombrar, Eliminar)"
          >
            <Sparkles size={15} />
            <span>Atributos</span>
          </button>

          {/* Botón Selector de Columnas */}
          <button
            type="button"
            onClick={onOpenColumnModal}
            className="h-10 px-3.5 rounded-xl border border-zinc-200/90 dark:border-zinc-700/90 bg-white dark:bg-zinc-800/90 text-zinc-700 dark:text-zinc-200 text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-700/80 transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
            title="Personalizar columnas visibles"
          >
            <Columns size={15} />
            <span>Columnas</span>
            <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-700 text-xs font-mono font-bold text-zinc-600 dark:text-zinc-300">
              {totalColumnasVisibles}
            </span>
          </button>

          {/* Botón Recargar */}
          <button
            type="button"
            onClick={onRecargar}
            disabled={cargando}
            title="Recargar dispositivos"
            className="h-10 w-10 rounded-xl border border-zinc-200/90 dark:border-zinc-700/90 bg-white dark:bg-zinc-800/90 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-700/80 transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            <RotateCw size={15} className={cargando ? 'animate-spin text-[#155BD0]' : ''} />
          </button>
        </div>
      </div>

      {/* Fila Inferior: Filtros de Estado tipo Pills y Auditoría de Atributos */}
      <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Pills de Estado con diseño Apple */}
          <button
            type="button"
            onClick={() => handleStatusChange('all')}
            className={`h-8 px-3.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              filters.status === 'all'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-2xs'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            Todos ({totalDispositivos})
          </button>

          <button
            type="button"
            onClick={() => handleStatusChange('online')}
            className={`h-8 px-3.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              filters.status === 'online'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>En Línea ({totalOnline})</span>
          </button>

          <button
            type="button"
            onClick={() => handleStatusChange('offline')}
            className={`h-8 px-3.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              filters.status === 'offline'
                ? 'bg-zinc-700 text-white shadow-2xs'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-zinc-400" />
            <span>Desconectados ({totalOffline})</span>
          </button>

          <button
            type="button"
            onClick={() => handleStatusChange('disabled')}
            className={`h-8 px-3.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              filters.status === 'disabled'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40'
            }`}
          >
            Deshabilitados
          </button>
        </div>

        {/* Auditoría: Filtrar por Atributo Faltante */}
        <div className="flex items-center gap-2 ml-auto">
          {todasLasClavesAtributos.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <Filter size={13} className="text-zinc-400" />
              <span className="font-semibold text-zinc-400 hidden sm:inline">
                Sin atributo:
              </span>
              <select
                value={filters.missingAttribute || ''}
                onChange={(e) => handleMissingAttributeChange(e.target.value || null)}
                className="h-8 px-2.5 text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 font-medium focus:outline-none cursor-pointer"
              >
                <option value="">(Todos)</option>
                {todasLasClavesAtributos.map((k) => (
                  <option key={k} value={k}>
                    Falta "{k}"
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="text-xs font-mono font-bold text-zinc-400">
            {totalFiltrados} de {totalDispositivos}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevicesToolbar;
