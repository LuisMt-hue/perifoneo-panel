import React from 'react';
import { Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Loader2 } from 'lucide-react';
import type { LiveDevice } from '../../types';

interface LiveMapRouteLayerProps {
  visible: boolean;
  selectedDevice: LiveDevice | null;
  rutaDispositivo: [number, number][];
}

/**
 * Trazo del "recorrido en tiempo real" del dispositivo seleccionado sobre el mapa.
 * Debe renderizarse dentro de <MapContainer>.
 */
export const LiveMapRouteLayer: React.FC<LiveMapRouteLayerProps> = ({
  visible,
  selectedDevice,
  rutaDispositivo,
}) => {
  if (!visible || !selectedDevice || rutaDispositivo.length <= 1) return null;

  return (
    <>
      {/* Resplandor exterior suave */}
      <Polyline
        positions={rutaDispositivo}
        pathOptions={{
          color: '#3b82f6',
          weight: 8,
          opacity: 0.28,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />
      {/* Línea principal trazada */}
      <Polyline
        positions={rutaDispositivo}
        pathOptions={{
          color: '#2563eb',
          weight: 4,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />
      {/* Marcador del punto de partida del recorrido */}
      <Marker
        position={rutaDispositivo[0]}
        icon={L.divIcon({
          className: 'custom-route-start-marker',
          html: `<div class="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-600 text-white font-bold text-3xs shadow-md border border-white/80 pointer-events-none">
                   <span class="w-1.5 h-1.5 rounded-full bg-white"></span>
                   <span>INICIO</span>
                 </div>`,
          iconSize: [46, 18],
          iconAnchor: [23, 9],
        })}
        interactive={false}
      />
    </>
  );
};

interface LiveMapRouteIndicatorProps {
  visible: boolean;
  selectedDevice: LiveDevice | null;
  distanciaTotalKm: number;
  puntosCount: number;
  cargandoRuta: boolean;
  onAjustarRuta: () => void;
}

/**
 * Indicador flotante superior estilo Traccar con el resumen del recorrido en curso.
 * Es UI de overlay, se renderiza fuera de <MapContainer>.
 */
export const LiveMapRouteIndicator: React.FC<LiveMapRouteIndicatorProps> = ({
  visible,
  selectedDevice,
  distanciaTotalKm,
  puntosCount,
  cargandoRuta,
  onAjustarRuta,
}) => {
  if (!visible) return null;

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-white/85 dark:bg-zinc-900/85 backdrop-blur-2xl border border-zinc-200/80 dark:border-white/10 shadow-xl text-[12px] font-medium animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-auto max-w-[calc(100vw-2rem)] select-none">
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        <span className="text-zinc-800 dark:text-zinc-200 font-semibold hidden sm:inline">
          Recorrido en vivo:
        </span>
      </div>

      {selectedDevice ? (
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="text-zinc-700 dark:text-zinc-300 font-medium truncate max-w-[120px] sm:max-w-none">
            {selectedDevice.conductor || selectedDevice.name}
          </span>
          <span className="text-[10.5px] font-mono font-medium px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50 shrink-0 tabular-nums">
            {distanciaTotalKm.toFixed(1)} km
          </span>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono hidden md:inline shrink-0">
            · {puntosCount} pts
          </span>
          {puntosCount > 0 && (
            <button
              type="button"
              onClick={onAjustarRuta}
              title="Encuadrar toda la ruta en pantalla"
              className="px-2 py-0.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-[10.5px] font-medium transition-colors shrink-0 cursor-pointer"
            >
              Encuadrar
            </button>
          )}
        </div>
      ) : (
        <span className="text-zinc-500 dark:text-zinc-400 text-[11px] truncate">
          Selecciona un perifoneador en el panel
        </span>
      )}

      {cargandoRuta && (
        <Loader2 size={13} className="animate-spin text-blue-500 shrink-0 ml-0.5" />
      )}
    </div>
  );
};
