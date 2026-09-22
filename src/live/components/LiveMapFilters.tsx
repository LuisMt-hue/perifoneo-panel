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
    <div className="absolute top-4 z-20 transition-all duration-300 left-4 md:left-[25.5rem]">
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/92 dark:bg-zinc-900/92 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800 shadow-xl max-w-[calc(100vw-2rem)] flex-wrap sm:flex-nowrap">
        {/* Buscador Integrado */}
        <div className="relative w-40 sm:w-48 lg:w-56">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
          />
          <input
            type="text"
            value={filters.busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar DNI, chofer..."
            className="w-full pl-7 pr-6 py-1.5 text-xs bg-zinc-100/80 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60 rounded-xl text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          {filters.busqueda && (
            <button
              type="button"
              onClick={() => setBusqueda('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Selector Directo de Zonas / Geocercas Numeradas */}
        {geofences.length > 0 && (
          <div className="relative flex items-center shrink-0">
            <MapPin size={13} className="absolute left-2.5 text-blue-500 pointer-events-none" />
            <select
              value={filters.geofenceId}
              onChange={(e) => {
                const val = e.target.value === 'TODOS' ? 'TODOS' : Number(e.target.value);
                setGeofenceId(val);
              }}
              className="pl-7 pr-4 py-1.5 text-xs font-medium rounded-xl bg-zinc-100/80 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all"
            >
              <option value="TODOS">Todas las zonas ({geofences.length})</option>
              {geofences.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Selector de Sectores si no hay geocercas o como opción complementaria */}
        {geofences.length === 0 && sectoresDisponibles.length > 0 && (
          <select
            value={filters.sectorFiltro}
            onChange={(e) => setSectorFiltro(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium rounded-xl bg-zinc-100/80 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="TODOS">Todos los sectores</option>
            {sectoresDisponibles.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}

        {/* Pills de Estado (Todos, Activos, Detenidos, Offline) */}
        <div className="hidden lg:flex items-center p-0.5 rounded-xl bg-zinc-100/90 dark:bg-zinc-800/90 text-2xs font-medium shrink-0">
          <button
            type="button"
            onClick={() => setEstadoFiltro('TODOS')}
            className={`px-2 py-1 rounded-lg transition-all ${
              filters.estadoFiltro === 'TODOS'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-bold'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            Todos ({counts.visibles})
          </button>

          <button
            type="button"
            onClick={() => setEstadoFiltro('ACTIVOS')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all ${
              filters.estadoFiltro === 'ACTIVOS'
                ? 'bg-emerald-500 text-white shadow-xs font-bold'
                : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
            }`}
          >
            <CheckCircle2 size={11} />
            <span>{counts.activos}</span>
          </button>

          <button
            type="button"
            onClick={() => setEstadoFiltro('DETENIDOS')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all ${
              filters.estadoFiltro === 'DETENIDOS'
                ? 'bg-amber-500 text-white shadow-xs font-bold'
                : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
            }`}
          >
            <PauseCircle size={11} />
            <span>{counts.detenidos}</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setEstadoFiltro(filters.estadoFiltro === 'DESCONECTADOS' ? 'TODOS' : 'DESCONECTADOS')
            }
            className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all ${
              filters.estadoFiltro === 'DESCONECTADOS'
                ? 'bg-zinc-600 text-white shadow-xs font-bold'
                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50'
            }`}
          >
            <WifiOff size={11} />
            <span>{counts.desconectados}</span>
          </button>
        </div>

        {/* Toggle Ocultar Desconectados */}
        <button
          type="button"
          onClick={() => setOcultarDesconectados((prev) => !prev)}
          title={
            filters.ocultarDesconectados
              ? 'Mostrando solo conectados (Click para ver todos)'
              : 'Mostrando todos (Click para ocultar desconectados)'
          }
          className={`hidden sm:flex items-center gap-1 px-2 py-1.5 rounded-xl text-2xs font-semibold transition-all border shrink-0 ${
            filters.ocultarDesconectados
              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/60'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200/60 dark:border-zinc-700/60'
          }`}
        >
          {filters.ocultarDesconectados ? <EyeOff size={12} /> : <Eye size={12} />}
          <span>{filters.ocultarDesconectados ? 'Sin offline' : 'Todos'}</span>
        </button>

        {/* Botón de limpiar filtros activos */}
        {hayFiltrosActivos && (
          <button
            type="button"
            onClick={limpiarFiltros}
            title="Restablecer filtros"
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60 text-2xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all shrink-0"
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
