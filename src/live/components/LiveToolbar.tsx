import React from 'react';
import { Search, X, MapPin, CheckCircle2, PauseCircle, WifiOff, EyeOff, Eye, RotateCcw } from 'lucide-react';
import type { LiveDevice, TraccarGeofence } from '../types';
import type { UseLiveFiltersReturn } from '../hooks/useLiveFilters';

interface LiveToolbarProps {
  filterProps: UseLiveFiltersReturn;
  geofences: TraccarGeofence[];
  devices: LiveDevice[];
}

export const LiveToolbar: React.FC<LiveToolbarProps> = ({ filterProps, geofences, devices }) => {
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

  // Lista de sectores únicos
  const sectoresDisponibles = React.useMemo(() => {
    const set = new Set<string>();
    for (const d of devices) {
      if (d.sector) set.add(d.sector);
    }
    return Array.from(set).sort();
  }, [devices]);

  return (
    <div className="relative flex flex-col gap-2.5 p-3.5 border-b border-zinc-200/80 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md">
      {/* Fila 1: Buscador Spotlight + Botón Limpiar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 pointer-events-none"
          />
          <input
            type="text"
            value={filters.busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por DNI, nombre, placa..."
            className="w-full pl-8.5 pr-7 py-1.5 text-xs bg-zinc-100/80 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          {filters.busqueda && (
            <button
              type="button"
              onClick={() => setBusqueda('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 p-0.5"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {hayFiltrosActivos && (
          <button
            type="button"
            onClick={limpiarFiltros}
            title="Restablecer filtros"
            className="p-1.5 rounded-xl border border-rose-200/60 dark:border-rose-800/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors shrink-0"
          >
            <RotateCcw size={14} />
          </button>
        )}
      </div>

      {/* Fila 2: Selector Directo de Zona / Geocerca */}
      {geofences.length > 0 && (
        <div className="relative flex items-center">
          <MapPin size={13} className="absolute left-2.5 text-blue-500 pointer-events-none" />
          <select
            value={filters.geofenceId}
            onChange={(e) => {
              const val = e.target.value === 'TODOS' ? 'TODOS' : Number(e.target.value);
              setGeofenceId(val);
            }}
            className="w-full pl-7 pr-4 py-1.5 text-xs font-medium rounded-xl bg-zinc-100/80 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all"
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

      {/* Selector de sector si no hay geocercas */}
      {geofences.length === 0 && sectoresDisponibles.length > 0 && (
        <select
          value={filters.sectorFiltro}
          onChange={(e) => setSectorFiltro(e.target.value)}
          className="w-full px-2.5 py-1.5 text-xs font-medium rounded-xl bg-zinc-100/80 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option value="TODOS">Todos los sectores</option>
          {sectoresDisponibles.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      )}

      {/* Fila 3: Toggle "Ocultar desconectados" + Pills de estado Apple */}
      <div className="flex items-center justify-between gap-1.5 pt-0.5">
        {/* Pills de estado segmentadas */}
        <div className="flex items-center p-0.5 rounded-lg bg-zinc-100/90 dark:bg-zinc-800/90 text-2xs font-medium">
          <button
            type="button"
            onClick={() => setEstadoFiltro('TODOS')}
            className={`px-2 py-1 rounded-md transition-all ${
              filters.estadoFiltro === 'TODOS'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            Todos ({counts.visibles})
          </button>

          <button
            type="button"
            onClick={() => setEstadoFiltro('ACTIVOS')}
            className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all ${
              filters.estadoFiltro === 'ACTIVOS'
                ? 'bg-emerald-500 text-white shadow-xs font-semibold'
                : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
            }`}
          >
            <CheckCircle2 size={11} />
            <span>{counts.activos}</span>
          </button>

          <button
            type="button"
            onClick={() => setEstadoFiltro('DETENIDOS')}
            className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all ${
              filters.estadoFiltro === 'DETENIDOS'
                ? 'bg-amber-500 text-white shadow-xs font-semibold'
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
            className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all ${
              filters.estadoFiltro === 'DESCONECTADOS'
                ? 'bg-zinc-600 text-white shadow-xs font-semibold'
                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50'
            }`}
          >
            <WifiOff size={11} />
            <span>{counts.desconectados}</span>
          </button>
        </div>

        {/* Toggle para Ocultar Desconectados */}
        <button
          type="button"
          onClick={() => setOcultarDesconectados((prev) => !prev)}
          title={
            filters.ocultarDesconectados
              ? 'Mostrando solo conectados (Click para ver todos)'
              : 'Mostrando todos (Click para ocultar desconectados)'
          }
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-2xs font-medium transition-all border ${
            filters.ocultarDesconectados
              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/60'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200/60 dark:border-zinc-700/60'
          }`}
        >
          {filters.ocultarDesconectados ? <EyeOff size={12} /> : <Eye size={12} />}
          <span className="hidden sm:inline">
            {filters.ocultarDesconectados ? 'Sin offline' : 'Todos'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default React.memo(LiveToolbar);
