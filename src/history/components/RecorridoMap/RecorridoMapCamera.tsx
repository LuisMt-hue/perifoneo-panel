import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import type { LatLngBoundsExpression } from 'leaflet';

interface RecorridoMapCameraProps {
  boundsToFit: LatLngBoundsExpression | null;
  /** Cambiar este número (ej. Date.now()) fuerza un nuevo fitBounds aunque `boundsToFit` no haya cambiado de identidad. */
  fitTrigger?: number;
}

/**
 * Versión mínima de LiveMapCamera: ajusta la cámara a los bounds de la ruta cargada,
 * tanto automáticamente (cambia de viaje) como a pedido (botón "Encuadrar" del reproductor).
 * Sin lógica de flyTo/selección de dispositivo (no aplica en el detalle histórico).
 */
export const RecorridoMapCamera: React.FC<RecorridoMapCameraProps> = ({ boundsToFit, fitTrigger }) => {
  const map = useMap();

  useEffect(() => {
    if (boundsToFit) {
      map.fitBounds(boundsToFit, { padding: [50, 50], maxZoom: 16 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boundsToFit, map, fitTrigger]);

  return null;
};

export default RecorridoMapCamera;
