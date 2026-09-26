import React from 'react';
import { Route as RouteIcon, CheckCircle2, X } from 'lucide-react';
import { obtenerDuracionSegundos, type TraccarReportTrip } from '../api';
import { tripKey } from '../hooks/useViajeSeleccionado';
import { formatearHora, formatearDuracion } from '../../shared/utils/formato';

interface ViajesSidebarProps {
  trips: TraccarReportTrip[];
  selectedTripKeys: Set<string>;
  onToggleTrip: (trip: TraccarReportTrip) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  cargando: boolean;
}

/**
 * Lista de viajes (trips) del rango seleccionado en el Historial, como tarjetas
 * seleccionables: un tap alterna su membresía en la selección (comportamiento de
 * checkbox, sin checkbox visible) y pueden quedar varias marcadas a la vez. Cada
 * cambio de selección dispara la carga diferida de esos recorridos combinados
 * (ver useViajeSeleccionado). Sin ninguna marcada, se ve el recorrido completo del
 * rango.
 *
 * Ocupa exactamente el alto de la fila (h-full en desktop, altura fija en mobile) y
 * solo su lista interna scrollea si hay más viajes de los que entran — el resto de la
 * página nunca hace scroll.
 */
export const ViajesSidebar: React.FC<ViajesSidebarProps> = ({
  trips,
  selectedTripKeys,
  onToggleTrip,
  onSelectAll,
  onClearSelection,
  cargando,
}) => {
  const haySeleccion = selectedTripKeys.size > 0;

  return (
    <div className="w-full lg:w-64 h-36 lg:h-full shrink-0 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col overflow-hidden">
      <div className="px-3.5 py-2.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <RouteIcon size={13} className="text-[#155BD0] dark:text-blue-400 shrink-0" />
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 truncate">
            Viajes ({trips.length})
            {haySeleccion && (
              <span className="ml-1 font-mono text-[#155BD0] dark:text-blue-400">
                · {selectedTripKeys.size} sel.
              </span>
            )}
          </h2>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {trips.length > 0 && selectedTripKeys.size < trips.length && (
            <button
              type="button"
              onClick={onSelectAll}
              title="Seleccionar todos los viajes"
              className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold text-zinc-500 hover:text-[#155BD0] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
            >
              Todos
            </button>
          )}
          {haySeleccion && (
            <button
              type="button"
              onClick={onClearSelection}
              title="Ver el recorrido completo del rango"
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold text-zinc-500 hover:text-[#155BD0] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
            >
              <X size={10} />
              <span>Limpiar</span>
            </button>
          )}
        </div>
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
            const seleccionado = selectedTripKeys.has(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => onToggleTrip(trip)}
                aria-pressed={seleccionado}
                className={`text-left px-2.5 py-2 rounded-lg border transition-colors cursor-pointer ${
                  seleccionado
                    ? 'bg-[#155BD0]/10 border-[#155BD0]/40'
                    : 'border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-200 font-mono">
                    {formatearHora(trip.startTime)} – {formatearHora(trip.endTime)}
                  </span>
                  <CheckCircle2
                    size={14}
                    className={seleccionado ? 'text-[#155BD0]' : 'text-zinc-300 dark:text-zinc-700'}
                  />
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
