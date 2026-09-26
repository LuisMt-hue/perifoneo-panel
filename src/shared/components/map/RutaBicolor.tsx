import React from 'react';
import { Polyline, CircleMarker, Popup } from 'react-leaflet';
import type { PuntoRecorrido } from '../../types/perifoneo.types';
import { formatearHora } from '../../utils/formato';

/**
 * Constantes visuales para la representación bicolor de rutas
 */
export const COLOR_DENTRO_SECTOR = '#22c55e';
export const COLOR_FUERA_SECTOR = '#ef4444';
export const RUTA_LINE_WEIGHT = 4;
export const RUTA_LINE_OPACITY = 0.9;
export const PUNTO_HITO_RADIUS = 6;
export const PUNTO_HITO_BORDER_WEIGHT = 2;
export const COLOR_HITO_BORDE = '#ffffff';

interface TramoRuta {
  dentro: boolean;
  coords: [number, number][];
}

/**
 * Agrupa los puntos GPS contiguos en tramos continuos clasificados como
 * "dentro del sector" (ambos extremos válidos) o "fuera del sector".
 */
function agruparTramos(puntos: PuntoRecorrido[]): TramoRuta[] {
  const tramos: TramoRuta[] = [];
  let actual: TramoRuta | null = null;
  if (!puntos || puntos.length === 0) return tramos;

  if (puntos.length === 1) {
    const esDentro = Boolean(puntos[0].dentro_sector === 1 || puntos[0].dentro_sector === true);
    tramos.push({
      dentro: esDentro,
      coords: [[puntos[0].lat, puntos[0].lon]],
    });
    return tramos;
  }

  for (let i = 1; i < puntos.length; i++) {
    const a = puntos[i - 1];
    const b = puntos[i];
    const aDentro = Boolean(a.dentro_sector === 1 || a.dentro_sector === true);
    const bDentro = Boolean(b.dentro_sector === 1 || b.dentro_sector === true);
    // Regla de negocio §4.2: Un tramo cuenta como dentro solo si AMBOS extremos están dentro
    const dentro = aDentro && bDentro;

    if (!actual || actual.dentro !== dentro) {
      actual = { dentro, coords: [[a.lat, a.lon]] };
      tramos.push(actual);
    }
    actual.coords.push([b.lat, b.lon]);
  }

  return tramos;
}

export interface RutaBicolorProps {
  puntos?: PuntoRecorrido[];
}

/**
 * Visualizador de Trayectoria en Dos Colores (`RutaBicolor`).
 *
 * Pinta la ruta recorrida en verde para los tramos dentro del sector asignado
 * y en rojo para las desviaciones fuera de zona, señalando los hitos de partida y llegada.
 */
export const RutaBicolor: React.FC<RutaBicolorProps> = ({ puntos = [] }) => {
  if (!puntos || puntos.length === 0) return null;

  const tramos = agruparTramos(puntos);
  const inicio = puntos[0];
  const fin = puntos[puntos.length - 1];

  return (
    <>
      {/* Trazos segmentados según permanencia */}
      {tramos.map((tramo, idx) => (
        <Polyline
          key={`tramo-${idx}`}
          positions={tramo.coords}
          color={tramo.dentro ? COLOR_DENTRO_SECTOR : COLOR_FUERA_SECTOR}
          weight={RUTA_LINE_WEIGHT}
          opacity={RUTA_LINE_OPACITY}
        />
      ))}

      {/* Marcador de Inicio (Círculo Verde) */}
      <CircleMarker
        center={[inicio.lat, inicio.lon]}
        radius={PUNTO_HITO_RADIUS}
        pathOptions={{
          color: COLOR_HITO_BORDE,
          fillColor: COLOR_DENTRO_SECTOR,
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

      {/* Marcador de Fin (Círculo Rojo) */}
      <CircleMarker
        center={[fin.lat, fin.lon]}
        radius={PUNTO_HITO_RADIUS}
        pathOptions={{
          color: COLOR_HITO_BORDE,
          fillColor: COLOR_FUERA_SECTOR,
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
