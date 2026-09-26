import React from 'react';
import { Search, X, Plus, CheckCircle2, PauseCircle, WifiOff, EyeOff, Eye } from 'lucide-react';
import type { DeviceFilterState } from '../types';

interface DevicesToolbarProps {
  filters: DeviceFilterState;
  onFilterChange: (filters: DeviceFilterState) => void;
  counts: {
    total: number;
    activos: number;
    detenidos: number;
    desconectados: number;
    deshabilitados: number;
  };
  onOpenCreateDevice: () => void;
}

export const DevicesToolbar: React.FC<DevicesToolbarProps> = ({
  filters,
  onFilterChange,
  counts,
  onOpenCreateDevice,
}) => {
  const handleSearchChange = (val: string) => onFilterChange({ ...filters, search: val });
  const handleEstadoChange = (estadoFiltro: DeviceFilterState['estadoFiltro']) =>
    onFilterChange({ ...filters, estadoFiltro });
  const handleToggleDeshabilitados = () =>
    onFilterChange({ ...filters, soloDeshabilitados: !filters.soloDeshabilitados });

  return (
    <div className="flex flex-col gap-3.5 p-4 sm:p-5 bg-white dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800 shrink-0">
      {/* Fila Superior: Buscador y Alta de Dispositivo */}
      <div className="flex items-center justify-between gap-3 flex-wrap lg:flex-nowrap">
        <div className="relative w-full lg:w-96">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
          />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar por nombre, DNI, celular, grupo, base, sector..."
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

        <button
          type="button"
          onClick={onOpenCreateDevice}
          className="h-10 px-4 rounded-xl bg-[#155BD0] hover:bg-[#114eb3] text-white text-sm font-semibold shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center gap-2 cursor-pointer shrink-0"
          title="Registrar un nuevo perifoneador en Traccar"
        >
          <Plus size={16} />
          <span>Nuevo Dispositivo</span>
        </button>
      </div>

      {/* Fila Inferior: Filtros de Estado (mismos 3 niveles que Live) */}
      <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
        <div className="hidden lg:flex items-center h-8 p-0.5 rounded-xl bg-zinc-100/90 dark:bg-zinc-800/80 border border-zinc-200/50 dark:border-white/[0.04] text-[11px] font-medium shrink-0 gap-0.5">
          <button
            type="button"
            onClick={() => handleEstadoChange('TODOS')}
            className={`h-7 px-2.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              filters.estadoFiltro === 'TODOS'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <span>Todos</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-zinc-200/60 dark:bg-zinc-700/60 text-zinc-700 dark:text-zinc-300 tabular-nums">
              {counts.total}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleEstadoChange('ACTIVO')}
            className={`h-7 flex items-center gap-1.5 px-2.5 rounded-lg transition-all cursor-pointer ${
              filters.estadoFiltro === 'ACTIVO'
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60'
            }`}
          >
            <CheckCircle2 size={12} className={filters.estadoFiltro === 'ACTIVO' ? 'text-white' : 'text-emerald-600'} />
            <span className="font-mono tabular-nums">{counts.activos}</span>
          </button>

          <button
            type="button"
            onClick={() => handleEstadoChange('DETENIDO')}
            className={`h-7 flex items-center gap-1.5 px-2.5 rounded-lg transition-all cursor-pointer ${
              filters.estadoFiltro === 'DETENIDO'
                ? 'bg-amber-500 text-white shadow-xs font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60'
            }`}
          >
            <PauseCircle size={12} className={filters.estadoFiltro === 'DETENIDO' ? 'text-white' : 'text-amber-500'} />
            <span className="font-mono tabular-nums">{counts.detenidos}</span>
          </button>

          <button
            type="button"
            onClick={() => handleEstadoChange('DESCONECTADO')}
            className={`h-7 flex items-center gap-1.5 px-2.5 rounded-lg transition-all cursor-pointer ${
              filters.estadoFiltro === 'DESCONECTADO'
                ? 'bg-zinc-700 text-white shadow-xs font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60'
            }`}
          >
            <WifiOff size={12} className={filters.estadoFiltro === 'DESCONECTADO' ? 'text-white' : 'text-zinc-500'} />
            <span className="font-mono tabular-nums">{counts.desconectados}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleToggleDeshabilitados}
          className={`flex items-center h-8 gap-1.5 px-2.5 rounded-xl text-[11px] font-semibold transition-all shrink-0 cursor-pointer ml-auto ${
            filters.soloDeshabilitados
              ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
              : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700'
          }`}
        >
          {filters.soloDeshabilitados ? <EyeOff size={12} /> : <Eye size={12} />}
          <span>Deshabilitados ({counts.deshabilitados})</span>
        </button>
      </div>
    </div>
  );
};

export default DevicesToolbar;
