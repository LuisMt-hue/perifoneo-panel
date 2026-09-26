import React from 'react';
import {
  Search,
  X,
  MapPin,
  ListFilter,
  CheckCircle2,
  PauseCircle,
  WifiOff,
  EyeOff,
  Eye,
  RotateCcw,
} from 'lucide-react';
import type { TraccarGeofence, LiveDevice } from '../types';
import type { UseLiveFiltersReturn } from '../hooks/useLiveFilters';
import MobileFilterSheet from '../../shared/components/ui/MobileFilterSheet';
import MultiSelectCombobox from '../../shared/components/ui/MultiSelectCombobox';

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
    toggleGeofenceId,
    clearGeofenceIds,
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

  const opcionesZonas = React.useMemo(
    () => geofences.map((g) => ({ value: g.id, label: g.name })),
    [geofences]
  );

  // Contador de filtros "secundarios" (los que viven detrás del botón Filtros en mobile)
  const activeSheetFilterCount = [
    filters.geofenceIds.length > 0,
    filters.sectorFiltro !== 'TODOS',
    filters.estadoFiltro !== 'TODOS',
    filters.ocultarDesconectados,
  ].filter(Boolean).length;

  const estadoSegmentado = (variant: 'inline' | 'sheet') => (
    <div
      className={
        variant === 'inline'
          ? 'hidden lg:flex items-center h-8 p-0.5 rounded-xl bg-zinc-100/90 dark:bg-zinc-800/80 border border-zinc-200/50 dark:border-white/[0.04] text-[11px] font-medium shrink-0 gap-0.5'
          : 'flex items-center h-9 p-0.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/50 dark:border-white/[0.04] text-[12px] font-medium gap-0.5'
      }
    >
      <button
        type="button"
        onClick={() => setEstadoFiltro('TODOS')}
        className={`flex-1 h-full px-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
          filters.estadoFiltro === 'TODOS'
            ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold'
            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
        }`}
      >
        <ListFilter size={11} />
        <span>Todos</span>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-zinc-200/60 dark:bg-zinc-700/60 text-zinc-700 dark:text-zinc-300 tabular-nums">
          {counts.visibles}
        </span>
      </button>

      <button
        type="button"
        onClick={() => setEstadoFiltro('ACTIVOS')}
        className={`flex-1 h-full flex items-center justify-center gap-1.5 px-2.5 rounded-lg transition-all cursor-pointer ${
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
        className={`flex-1 h-full flex items-center justify-center gap-1.5 px-2.5 rounded-lg transition-all cursor-pointer ${
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
        className={`flex-1 h-full flex items-center justify-center gap-1.5 px-2.5 rounded-lg transition-all cursor-pointer ${
          filters.estadoFiltro === 'DESCONECTADOS'
            ? 'bg-zinc-700 text-white shadow-xs font-semibold'
            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60'
        }`}
      >
        <WifiOff size={12} className={filters.estadoFiltro === 'DESCONECTADOS' ? 'text-white' : 'text-zinc-500'} />
        <span className="font-mono tabular-nums">{counts.desconectados}</span>
      </button>
    </div>
  );

  return (
    <div className="absolute top-3 z-20 transition-all duration-300 left-3 md:left-[21.5rem] lg:left-[22.5rem]">
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/85 dark:bg-zinc-900/85 backdrop-blur-2xl border border-zinc-200/80 dark:border-white/10 shadow-xl max-w-[calc(100vw-1.5rem)]">
        {/* Buscador Integrado (Altura h-8 exacta) */}
        <div className="relative w-36 sm:w-44 lg:w-52 h-8 flex items-center shrink-0">
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

        {/* Selector Múltiple de Zonas / Geocercas — oculto en mobile/tablet, vive en la hoja */}
        {geofences.length > 0 && (
          <div className="hidden lg:block shrink-0">
            <MultiSelectCombobox
              icon={<MapPin size={12} className="text-blue-500" />}
              label="Zonas"
              options={opcionesZonas}
              selectedValues={filters.geofenceIds}
              onToggle={(v) => toggleGeofenceId(Number(v))}
              onClear={clearGeofenceIds}
              placeholder="Buscar zona..."
            />
          </div>
        )}

        {/* Selector de Sectores si no hay geocercas — oculto en mobile/tablet, vive en la hoja */}
        {geofences.length === 0 && sectoresDisponibles.length > 0 && (
          <select
            value={filters.sectorFiltro}
            onChange={(e) => setSectorFiltro(e.target.value)}
            className="hidden lg:block h-8 px-2.5 text-[11.5px] font-medium rounded-xl bg-zinc-100/90 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-white/[0.08] text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50 cursor-pointer"
          >
            <option value="TODOS">Todos los sectores</option>
            {sectoresDisponibles.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}

        {/* Segmented Control de Estados (macOS Segment Control) — solo desktop ancho */}
        {estadoSegmentado('inline')}

        {/* Toggle Ocultar Desconectados - Sólido — solo desktop ancho */}
        <button
          type="button"
          onClick={() => setOcultarDesconectados((prev) => !prev)}
          className={`hidden lg:flex items-center h-8 gap-1.5 px-2.5 rounded-xl text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
            filters.ocultarDesconectados
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
              : 'bg-zinc-200/80 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-300/80 dark:border-zinc-700'
          }`}
        >
          {filters.ocultarDesconectados ? <EyeOff size={12} /> : <Eye size={12} />}
          <span>{filters.ocultarDesconectados ? 'Sin desconectados' : 'Todos'}</span>
        </button>

        {/* Botón Filtros + Hoja Inferior — solo mobile/tablet (mismo corte que los controles ocultos arriba) */}
        <MobileFilterSheet activeCount={activeSheetFilterCount} className="lg:hidden shrink-0">
          {geofences.length > 0 && (
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                Zona
              </label>
              <MultiSelectCombobox
                icon={<MapPin size={14} className="text-blue-500" />}
                label={filters.geofenceIds.length > 0 ? 'Zonas seleccionadas' : 'Todas las zonas'}
                options={opcionesZonas}
                selectedValues={filters.geofenceIds}
                onToggle={(v) => toggleGeofenceId(Number(v))}
                onClear={clearGeofenceIds}
                placeholder="Buscar zona..."
                variant="block"
              />
            </div>
          )}

          {geofences.length === 0 && sectoresDisponibles.length > 0 && (
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                Sector
              </label>
              <select
                value={filters.sectorFiltro}
                onChange={(e) => setSectorFiltro(e.target.value)}
                className="w-full h-9 px-3 text-[13px] font-medium rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-white/[0.08] text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50 cursor-pointer"
              >
                <option value="TODOS">Todos los sectores</option>
                {sectoresDisponibles.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
              Estado
            </label>
            {estadoSegmentado('sheet')}
          </div>

          <button
            type="button"
            onClick={() => setOcultarDesconectados((prev) => !prev)}
            className={`flex items-center h-10 gap-2 px-3.5 rounded-xl text-[13px] font-semibold transition-all cursor-pointer ${
              filters.ocultarDesconectados
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-300/80 dark:border-zinc-700'
            }`}
          >
            {filters.ocultarDesconectados ? <EyeOff size={14} /> : <Eye size={14} />}
            <span>{filters.ocultarDesconectados ? 'Ocultando desconectados' : 'Mostrando todos'}</span>
          </button>

          {hayFiltrosActivos && (
            <button
              type="button"
              onClick={limpiarFiltros}
              className="flex items-center justify-center h-10 gap-1.5 px-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs text-[13px] font-semibold transition-all cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Limpiar filtros</span>
            </button>
          )}
        </MobileFilterSheet>

        {/* Botón Limpiar Filtros - Sólido Rojo (siempre visible cuando hay algo activo) */}
        {hayFiltrosActivos && (
          <button
            type="button"
            onClick={limpiarFiltros}
            title="Restablecer filtros"
            className="hidden lg:flex items-center h-8 gap-1 px-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs text-[11px] font-semibold transition-all shrink-0 cursor-pointer"
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
