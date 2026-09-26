import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import type { LatLngBoundsExpression } from 'leaflet';

interface RecorridoMapCameraProps {
  boundsToFit: LatLngBoundsExpression | null;
}

/**
 * Versión mínima de LiveMapCamera: solo ajusta la cámara a los bounds de la ruta
 * cargada (se dispara cada vez que cambian los puntos, ej. al elegir otro viaje).
 * Sin lógica de flyTo/selección de dispositivo (no aplica en el detalle histórico).
 */
export const RecorridoMapCamera: React.FC<RecorridoMapCameraProps> = ({ boundsToFit }) => {
  const map = useMap();

  useEffect(() => {
    if (boundsToFit) {
      map.fitBounds(boundsToFit, { padding: [50, 50], maxZoom: 16 });
    }
  }, [boundsToFit, map]);

  return null;
};

export default RecorridoMapCamera;
