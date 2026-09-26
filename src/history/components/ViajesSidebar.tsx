import React from 'react';
import { Route as RouteIcon, ChevronRight } from 'lucide-react';
import { obtenerDuracionSegundos, type TraccarReportTrip } from '../api';
import { tripKey } from '../hooks/useViajeSeleccionado';
import { formatearHora, formatearDuracion } from '../../shared/utils/formato';

interface ViajesSidebarProps {
  trips: TraccarReportTrip[];
  selectedTripKey: string | null;
  onSelectTrip: (trip: TraccarReportTrip) => void;
  cargando: boolean;
}

/**
 * Lista de viajes individuales (trips) del rango seleccionado. Al hacer clic en uno,
 * dispara la carga diferida de su recorrido punto-a-punto (ver useViajeSeleccionado).
 */
export const ViajesSidebar: React.FC<ViajesSidebarProps> = ({
  trips,
  selectedTripKey,
  onSelectTrip,
  cargando,
}) => {
  return (
    <div className="w-full lg:w-72 shrink-0 rounded-[21px] border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2 shrink-0">
        <RouteIcon size={15} className="text-[#155BD0] dark:text-blue-400" />
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
          Viajes ({trips.length})
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5 min-h-[240px]">
        {cargando ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
          ))
        ) : trips.length === 0 ? (
          <p className="text-center text-xs text-zinc-400 py-8 px-2">
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
                className={`text-left p-3 rounded-xl border transition-colors cursor-pointer ${
                  activo
                    ? 'bg-[#155BD0]/5 border-[#155BD0]/40'
                    : 'border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 font-mono">
                    {formatearHora(trip.startTime)} – {formatearHora(trip.endTime)}
                  </span>
                  <ChevronRight size={13} className={activo ? 'text-[#155BD0]' : 'text-zinc-300'} />
                </div>
                <div className="flex items-center gap-2 mt-1 text-2xs text-zinc-500 dark:text-zinc-400">
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
