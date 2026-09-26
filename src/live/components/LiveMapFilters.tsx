import React from 'react';
import {
  Search,
  X,
  MapPin,
  CheckCircle2,
  PauseCircle,
  WifiOff,
  EyeOff,
  Eye,
  RotateCcw,
} from 'lucide-react';
import type { TraccarGeofence, LiveDevice } from '../types';
import type { UseLiveFiltersReturn } from '../hooks/useLiveFilters';

interface LiveMapFiltersProps {
  filterProps: UseLiveFiltersReturn;
  geofences: TraccarGeofence[];
  devices: LiveDevice[];
}

export const LiveMapFilters: React.FC<LiveMapFiltersProps> = ({
  filterProps,
  geofences,
  devices,
}) => {
  const {
    filters,
    setBusqueda,
    setOcultarDesconectados,
    setEstadoFiltro,
    setGeofenceId,
    setSectorFiltro,
    limpiarFiltros,
    hayFiltrosActivos,
    counts,
  } = filterProps;

  // Sectores disponibles
  const sectoresDisponibles = React.useMemo(() => {
    const set = new Set<string>();
    for (const d of devices) {
      if (d.sector) set.add(d.sector);
    }
    return Array.from(set).sort();
  }, [devices]);

  return (
    <div className="absolute top-3 z-20 transition-all duration-300 left-3 md:left-[21.5rem] lg:left-[22.5rem]">
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/85 dark:bg-zinc-900/85 backdrop-blur-2xl border border-zinc-200/80 dark:border-white/10 shadow-xl max-w-[calc(100vw-1.5rem)] flex-wrap sm:flex-nowrap">
        {/* Buscador Integrado (Altura h-8 exacta) */}
        <div className="relative w-36 sm:w-44 lg:w-52 h-8 flex items-center">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
          />
          <input
            type="text"
            value={filters.busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por chofer o DNI..."
            className="w-full h-8 pl-7 pr-6 text-[12px] bg-zinc-100/90 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-white/[0.08] rounded-xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
          />
          {filters.busqueda && (
            <button
              type="button"
              onClick={() => setBusqueda('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Selector Directo de Zonas / Geocercas (Sin paréntesis) */}
        {geofences.length > 0 && (
          <div className="relative h-8 flex items-center shrink-0">
            <MapPin size={12} className="absolute left-2.5 text-blue-500 pointer-events-none" />
            <select
              value={filters.geofenceId}
              onChange={(e) => {
                const val = e.target.value === 'TODOS' ? 'TODOS' : Number(e.target.value);
                setGeofenceId(val);
              }}
              className="h-8 pl-7 pr-3 text-[11.5px] font-medium rounded-xl bg-zinc-100/90 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-white/[0.08] text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50 cursor-pointer transition-all"
            >
              <option value="TODOS">Todas las zonas · {geofences.length}</option>
              {geofences.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Selector de Sectores si no hay geocercas */}
        {geofences.length === 0 && sectoresDisponibles.length > 0 && (
          <select
            value={filters.sectorFiltro}
            onChange={(e) => setSectorFiltro(e.target.value)}
            className="h-8 px-2.5 text-[11.5px] font-medium rounded-xl bg-zinc-100/90 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-white/[0.08] text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50 cursor-pointer"
          >
            <option value="TODOS">Todos los sectores</option>
            {sectoresDisponibles.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}

        {/* Segmented Control de Estados (macOS Segment Control) */}
        <div className="hidden lg:flex items-center h-8 p-0.5 rounded-xl bg-zinc-100/90 dark:bg-zinc-800/80 border border-zinc-200/50 dark:border-white/[0.04] text-[11px] font-medium shrink-0 gap-0.5">
          <button
            type="button"
            onClick={() => setEstadoFiltro('TODOS')}
            className={`h-7 px-2.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              filters.estadoFiltro === 'TODOS'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <span>Todos</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-zinc-200/60 dark:bg-zinc-700/60 text-zinc-700 dark:text-zinc-300 tabular-nums">
              {counts.visibles}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setEstadoFiltro('ACTIVOS')}
            className={`h-7 flex items-center gap-1.5 px-2.5 rounded-lg transition-all cursor-pointer ${
              filters.estadoFiltro === 'ACTIVOS'
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60'
            }`}
          >
            <CheckCircle2 size={12} className={filters.estadoFiltro === 'ACTIVOS' ? 'text-white' : 'text-emerald-600'} />
            <span className="font-mono tabular-nums">{counts.activos}</span>
          </button>

          <button
            type="button"
            onClick={() => setEstadoFiltro('DETENIDOS')}
            className={`h-7 flex items-center gap-1.5 px-2.5 rounded-lg transition-all cursor-pointer ${
              filters.estadoFiltro === 'DETENIDOS'
                ? 'bg-amber-500 text-white shadow-xs font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60'
            }`}
          >
            <PauseCircle size={12} className={filters.estadoFiltro === 'DETENIDOS' ? 'text-white' : 'text-amber-500'} />
            <span className="font-mono tabular-nums">{counts.detenidos}</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setEstadoFiltro(filters.estadoFiltro === 'DESCONECTADOS' ? 'TODOS' : 'DESCONECTADOS')
            }
            className={`h-7 flex items-center gap-1.5 px-2.5 rounded-lg transition-all cursor-pointer ${
              filters.estadoFiltro === 'DESCONECTADOS'
                ? 'bg-zinc-700 text-white shadow-xs font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60'
            }`}
          >
            <WifiOff size={12} className={filters.estadoFiltro === 'DESCONECTADOS' ? 'text-white' : 'text-zinc-500'} />
            <span className="font-mono tabular-nums">{counts.desconectados}</span>
          </button>
        </div>

        {/* Toggle Ocultar Desconectados - Sólido */}
        <button
          type="button"
          onClick={() => setOcultarDesconectados((prev) => !prev)}
          className={`hidden sm:flex items-center h-8 gap-1.5 px-2.5 rounded-xl text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
            filters.ocultarDesconectados
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
              : 'bg-zinc-200/80 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-300/80 dark:border-zinc-700'
          }`}
        >
          {filters.ocultarDesconectados ? <EyeOff size={12} /> : <Eye size={12} />}
          <span>{filters.ocultarDesconectados ? 'Sin desconectados' : 'Todos'}</span>
        </button>

        {/* Botón Limpiar Filtros - Sólido Rojo */}
        {hayFiltrosActivos && (
          <button
            type="button"
            onClick={limpiarFiltros}
            title="Restablecer filtros"
            className="flex items-center h-8 gap-1 px-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs text-[11px] font-semibold transition-all shrink-0 cursor-pointer"
          >
            <RotateCcw size={11} />
            <span>Limpiar</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default React.memo(LiveMapFilters);
