import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L, { type LatLngBoundsExpression } from 'leaflet';
import type { LiveDevice } from '../../types';

/**
 * Controlador de cámara para centrar suavemente el mapa al seleccionar un perifoneador.
 * Evita bucles infinitos de flyTo verificando que el cambio sea por acción del usuario.
 */
export const LiveMapCamera: React.FC<{
  target: [number, number] | null;
  selectedDeviceId: number | null;
  focusTrigger: number;
  boundsToFit: LatLngBoundsExpression | null;
  devices: LiveDevice[];
  onZoomChange: (zoom: number) => void;
}> = ({ target, selectedDeviceId, focusTrigger, boundsToFit, devices, onZoomChange }) => {
  const map = useMap();
  const lastCenteredDeviceIdRef = React.useRef<number | null>(null);
  const lastFocusTriggerRef = React.useRef<number>(0);
  const initialFitDoneRef = React.useRef(false);

  // Notificar nivel de zoom inicial y en cambios (zoom y zoomend)
  useEffect(() => {
    const handleZoom = () => {
      onZoomChange(Math.round(map.getZoom()));
    };
    handleZoom();
    map.on('zoom', handleZoom);
    map.on('zoomend', handleZoom);
    return () => {
      map.off('zoom', handleZoom);
      map.off('zoomend', handleZoom);
    };
  }, [map, onZoomChange]);

  // Ajuste inicial de vista a los dispositivos una sola vez al cargar
  useEffect(() => {
    if (!initialFitDoneRef.current && devices.length > 0) {
      const coords = devices
        .filter((d) => d.lat !== null && d.lon !== null)
        .map((d) => [d.lat as number, d.lon as number] as [number, number]);

      if (coords.length > 0) {
        initialFitDoneRef.current = true;
        map.fitBounds(L.latLngBounds(coords), { padding: [60, 60], maxZoom: 15 });
      }
    }
  }, [devices, map]);

  // Centrar con flyTo SOLO cuando el usuario selecciona un nuevo dispositivo o pulsa enfocar
  useEffect(() => {
    if (!target) {
      lastCenteredDeviceIdRef.current = null;
      return;
    }

    const esNuevoDispositivo = selectedDeviceId !== lastCenteredDeviceIdRef.current;
    const esFocoExplicito = focusTrigger > 0 && focusTrigger !== lastFocusTriggerRef.current;

    if (esNuevoDispositivo || esFocoExplicito) {
      lastCenteredDeviceIdRef.current = selectedDeviceId;
      lastFocusTriggerRef.current = focusTrigger;
      map.flyTo(target, 16, { duration: 0.8 });
    }
  }, [target, selectedDeviceId, focusTrigger, map]);

  useEffect(() => {
    if (boundsToFit) {
      map.fitBounds(boundsToFit, { padding: [50, 50], maxZoom: 16 });
    }
  }, [boundsToFit, map]);

  return null;
};

export default LiveMapCamera;
