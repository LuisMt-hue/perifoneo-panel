import React from 'react';
import { Route as RouteIcon, ChevronRight, X } from 'lucide-react';
import { obtenerDuracionSegundos, type TraccarReportTrip } from '../api';
import { tripKey } from '../hooks/useViajeSeleccionado';
import { formatearHora, formatearDuracion } from '../../shared/utils/formato';

interface ViajesSidebarProps {
  trips: TraccarReportTrip[];
  selectedTripKey: string | null;
  onSelectTrip: (trip: TraccarReportTrip) => void;
  onClearSelection: () => void;
  cargando: boolean;
}

/**
 * Lista de viajes individuales (trips) del rango seleccionado. Al hacer clic en uno,
 * dispara la carga diferida de su recorrido punto-a-punto (ver useViajeSeleccionado).
 *
 * Ocupa exactamente el alto de la fila (h-full en desktop, altura fija en mobile) y
 * solo su lista interna scrollea si hay más viajes de los que entran — el resto de la
 * página nunca hace scroll.
 */
export const ViajesSidebar: React.FC<ViajesSidebarProps> = ({
  trips,
  selectedTripKey,
  onSelectTrip,
  onClearSelection,
  cargando,
}) => {
  return (
    <div className="w-full lg:w-64 h-48 lg:h-full shrink-0 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col overflow-hidden">
      <div className="px-3.5 py-2.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <RouteIcon size={13} className="text-[#155BD0] dark:text-blue-400 shrink-0" />
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 truncate">
            Viajes ({trips.length})
          </h2>
        </div>
        {selectedTripKey && (
          <button
            type="button"
            onClick={onClearSelection}
            title="Ver el recorrido completo del rango"
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold text-zinc-500 hover:text-[#155BD0] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer shrink-0"
          >
            <X size={10} />
            <span>Ver todo</span>
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-2 flex flex-col gap-1">
        {cargando ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
          ))
        ) : trips.length === 0 ? (
          <p className="text-center text-[12px] text-zinc-400 py-6 px-2">
            Sin viajes registrados en este rango
          </p>
        ) : (
          trips.map((trip) => {
            const key = tripKey(trip);
            const activo = key === selectedTripKey;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelectTrip(trip)}
                className={`text-left px-2.5 py-2 rounded-lg border transition-colors cursor-pointer ${
                  activo
                    ? 'bg-[#155BD0]/10 border-[#155BD0]/40'
                    : 'border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-200 font-mono">
                    {formatearHora(trip.startTime)} – {formatearHora(trip.endTime)}
                  </span>
                  <ChevronRight size={12} className={activo ? 'text-[#155BD0]' : 'text-zinc-300'} />
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span>{formatearDuracion(Math.round(obtenerDuracionSegundos(trip) / 60))}</span>
                  <span>·</span>
                  <span>{((trip.distance || 0) / 1000).toFixed(1)} km</span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ViajesSidebar;
