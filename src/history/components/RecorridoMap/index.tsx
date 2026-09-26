import React, { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Loader2 } from 'lucide-react';
import MapaBase, { CENTRO_TACNA } from '../../../shared/components/map/MapaBase';
import CapaSectores from '../../../shared/components/map/CapaSectores';
import RutaBicolor from '../../../shared/components/map/RutaBicolor';
import RecorridoMapCamera from './RecorridoMapCamera';
import { formatearHora } from '../../../shared/utils/formato';
import type { PuntoRecorrido, Sector } from '../../../shared/types/perifoneo.types';

interface RecorridoMapProps {
  puntos: PuntoRecorrido[];
  sectoresFondo: Sector[];
  posicionActual: PuntoRecorrido | null;
  cargandoRuta: boolean;
  /** Cambiar este número fuerza un nuevo encuadre del mapa a todo el recorrido. */
  fitTrigger?: number;
}

/**
 * Mapa del detalle de recorrido: reusa MapaBase/CapaSectores/RutaBicolor tal cual
 * (ya son genéricos), y agrega fitBounds automático a la ruta del viaje seleccionado
 * (antes el mapa no ajustaba la cámara en absoluto).
 */
export const RecorridoMap: React.FC<RecorridoMapProps> = ({
  puntos,
  sectoresFondo,
  posicionActual,
  cargandoRuta,
  fitTrigger,
}) => {
  const centroMapa: [number, number] = puntos.length > 0 ? [puntos[0].lat, puntos[0].lon] : CENTRO_TACNA;

  const boundsToFit = useMemo(() => {
    if (puntos.length === 0) return null;
    return L.latLngBounds(puntos.map((p) => [p.lat, p.lon] as [number, number]));
  }, [puntos]);

  return (
    <div className="relative w-full h-full">
      <MapaBase centro={centroMapa} zoom={14}>
        <RecorridoMapCamera boundsToFit={boundsToFit} fitTrigger={fitTrigger} />
        {sectoresFondo.length > 0 && <CapaSectores sectores={sectoresFondo} />}
        {puntos.length > 0 && <RutaBicolor puntos={puntos} />}

        {posicionActual && posicionActual.lat != null && (
          <Marker position={[posicionActual.lat, posicionActual.lon]}>
            <Popup>
              <div className="text-xs text-zinc-800 dark:text-zinc-200">
                <p className="font-bold border-b border-zinc-200 dark:border-zinc-700 pb-1">Hora</p>
                <p className="font-mono">{formatearHora(posicionActual.device_time)}</p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapaBase>

      {!cargandoRuta && puntos.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-zinc-950/50 pointer-events-none">
          <p className="text-[13px] font-medium text-zinc-600 dark:text-zinc-300 bg-white/95 dark:bg-zinc-900/95 px-4 py-2 rounded-xl shadow-xs">
            Sin datos GPS para este rango
          </p>
        </div>
      )}

      {cargandoRuta && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/40 dark:bg-zinc-950/40 pointer-events-none">
          <Loader2 size={28} className="animate-spin text-[#155BD0]" />
        </div>
      )}
    </div>
  );
};

export default RecorridoMap;
