import React, { useMemo, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import L, { type LatLngBoundsExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { LiveDevice, TraccarGeofence } from '../../types';
import { CENTRO_TACNA } from '../../../shared/components/map/MapaBase';
import { useLiveDeviceRoute } from '../../hooks/useLiveDeviceRoute';
import LiveMarker from '../LiveMarker';
import { LiveMapCamera } from './LiveMapCamera';
import { LiveMapGeofenceLayer } from './LiveMapGeofenceLayer';
import { LiveMapRouteLayer, LiveMapRouteIndicator } from './LiveMapRouteLayer';
import { LiveMapToolbar } from './LiveMapToolbar';

/**
 * Constantes cartográficas y visuales del mapa en vivo
 */
export const CENTRO_PREDETERMINADO: [number, number] = CENTRO_TACNA;
export const DEFAULT_MAP_ZOOM = 13;
export const MAX_MAP_ZOOM = 19;
export const LABEL_VISIBILITY_ZOOM_THRESHOLD = 13;
export const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

interface LiveMapProps {
  devices: LiveDevice[];
  geofences: TraccarGeofence[];
  selectedDevice: LiveDevice | null;
  focusTrigger?: number;
  onSelectDevice: (device: LiveDevice) => void;
}

export const LiveMap: React.FC<LiveMapProps> = ({
  devices,
  geofences,
  selectedDevice,
  focusTrigger = 0,
  onSelectDevice,
}) => {
  const [mostrarGeocercas, setMostrarGeocercas] = useState(true);
  const [mostrarRecorrido, setMostrarRecorrido] = useState(false);
  const [currentZoom, setCurrentZoom] = useState<number>(13);
  const [fitBoundsTrigger, setFitBoundsTrigger] = useState<LatLngBoundsExpression | null>(null);

  const { rutaDispositivo, cargandoRuta, distanciaTotalKm } = useLiveDeviceRoute(
    selectedDevice,
    mostrarRecorrido
  );

  // Encuadrar toda la ruta en pantalla
  const handleAjustarRuta = () => {
    if (rutaDispositivo.length > 0) {
      setFitBoundsTrigger(L.latLngBounds(rutaDispositivo));
    }
  };

  // Posición destino estricta
  const targetPos = useMemo<[number, number] | null>(() => {
    if (selectedDevice && selectedDevice.lat !== null && selectedDevice.lon !== null) {
      return [selectedDevice.lat, selectedDevice.lon];
    }
    return null;
  }, [selectedDevice?.id, selectedDevice?.lat, selectedDevice?.lon]);

  // Centrar vista en todos los dispositivos activos
  const handleAjustarTodos = () => {
    const coordsConPosicion = devices
      .filter((d) => d.lat !== null && d.lon !== null)
      .map((d) => [d.lat as number, d.lon as number] as [number, number]);

    if (coordsConPosicion.length > 0) {
      setFitBoundsTrigger(L.latLngBounds(coordsConPosicion));
    }
  };

  // Las etiquetas de zonas solo se muestran a partir del umbral de zoom configurado
  const mostrarEtiquetasZonas = currentZoom >= LABEL_VISIBILITY_ZOOM_THRESHOLD;

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={CENTRO_PREDETERMINADO}
        zoom={DEFAULT_MAP_ZOOM}
        className="w-full h-full z-0"
        scrollWheelZoom={true}
        zoomControl={false}
      >
        <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} maxZoom={MAX_MAP_ZOOM} />

        <LiveMapCamera
          target={targetPos}
          selectedDeviceId={selectedDevice?.id ?? null}
          focusTrigger={focusTrigger}
          boundsToFit={fitBoundsTrigger}
          devices={devices}
          onZoomChange={setCurrentZoom}
        />

        <LiveMapGeofenceLayer
          geofences={geofences}
          visible={mostrarGeocercas}
          mostrarEtiquetas={mostrarEtiquetasZonas}
          currentZoom={currentZoom}
        />

        <LiveMapRouteLayer
          visible={mostrarRecorrido}
          selectedDevice={selectedDevice}
          rutaDispositivo={rutaDispositivo}
        />

        {/* Marcadores de Dispositivos */}
        {devices.map((device) => (
          <LiveMarker
            key={device.id}
            device={device}
            isSelected={selectedDevice?.id === device.id}
            onSelect={onSelectDevice}
          />
        ))}
      </MapContainer>

      <LiveMapRouteIndicator
        visible={mostrarRecorrido}
        selectedDevice={selectedDevice}
        distanciaTotalKm={distanciaTotalKm}
        puntosCount={rutaDispositivo.length}
        cargandoRuta={cargandoRuta}
        onAjustarRuta={handleAjustarRuta}
      />

      <LiveMapToolbar
        onCenterAll={handleAjustarTodos}
        mostrarRecorrido={mostrarRecorrido}
        onToggleRecorrido={() => setMostrarRecorrido((prev) => !prev)}
        mostrarGeocercas={mostrarGeocercas}
        onToggleGeocercas={() => setMostrarGeocercas((prev) => !prev)}
      />
    </div>
  );
};

export default React.memo(LiveMap);
