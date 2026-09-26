import React from 'react';
import { Polyline, CircleMarker, Popup } from 'react-leaflet';
import type { PuntoRecorrido } from '../../types/perifoneo.types';
import { formatearHora } from '../../utils/formato';

/**
 * Constantes visuales de la ruta — azul macOS consistente con el resto de la app
 * (antes bicolor verde/rojo según dentro/fuera de sector; ahora un único trazo).
 */
export const COLOR_RUTA = '#155BD0';
export const RUTA_LINE_WEIGHT = 4;
export const RUTA_LINE_OPACITY = 0.9;
export const PUNTO_HITO_RADIUS = 6;
export const PUNTO_HITO_BORDER_WEIGHT = 2;
export const COLOR_HITO_BORDE = '#ffffff';
export const COLOR_HITO_INICIO = '#22c55e';
export const COLOR_HITO_FIN = '#ef4444';

export interface RutaBicolorProps {
  puntos?: PuntoRecorrido[];
}

/**
 * Visualizador de Trayectoria (`RutaBicolor`).
 *
 * Pinta el recorrido completo en azul (estilo macOS de la app), señalando los
 * hitos de partida (verde) y llegada (rojo) como marcadores distintivos.
 */
export const RutaBicolor: React.FC<RutaBicolorProps> = ({ puntos = [] }) => {
  if (!puntos || puntos.length === 0) return null;

  const coords: [number, number][] = puntos.map((p) => [p.lat, p.lon]);
  const inicio = puntos[0];
  const fin = puntos[puntos.length - 1];

  return (
    <>
      <Polyline positions={coords} color={COLOR_RUTA} weight={RUTA_LINE_WEIGHT} opacity={RUTA_LINE_OPACITY} />

      {/* Marcador de Inicio */}
      <CircleMarker
        center={[inicio.lat, inicio.lon]}
        radius={PUNTO_HITO_RADIUS}
        pathOptions={{
          color: COLOR_HITO_BORDE,
          fillColor: COLOR_HITO_INICIO,
          fillOpacity: 1,
          weight: PUNTO_HITO_BORDER_WEIGHT,
        }}
      >
        <Popup>
          <div className="text-xs text-zinc-800 dark:text-zinc-200">
            <p className="font-bold text-emerald-600 dark:text-emerald-400">Punto de Inicio</p>
            <p>Hora: {formatearHora(inicio.device_time)}</p>
          </div>
        </Popup>
      </CircleMarker>

      {/* Marcador de Fin */}
      <CircleMarker
        center={[fin.lat, fin.lon]}
        radius={PUNTO_HITO_RADIUS}
        pathOptions={{
          color: COLOR_HITO_BORDE,
          fillColor: COLOR_HITO_FIN,
          fillOpacity: 1,
          weight: PUNTO_HITO_BORDER_WEIGHT,
        }}
      >
        <Popup>
          <div className="text-xs text-zinc-800 dark:text-zinc-200">
            <p className="font-bold text-rose-600 dark:text-rose-400">Punto de Cierre</p>
            <p>Hora: {formatearHora(fin.device_time)}</p>
          </div>
        </Popup>
      </CircleMarker>
    </>
  );
};

export default RutaBicolor;
