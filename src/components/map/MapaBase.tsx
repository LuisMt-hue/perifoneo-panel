import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { type LatLngExpression } from 'leaflet';

// Importación de iconos predeterminados de Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

// Corrección de los iconos de marcadores para Leaflet en entornos empaquetados por Vite
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconRetinaUrl: iconRetina,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Coordenadas céntricas de la ciudad de Tacna, Perú
export const CENTRO_TACNA: [number, number] = [-18.0146, -70.2536];

export interface MapaBaseProps {
  children?: React.ReactNode;
  centro?: LatLngExpression;
  center?: LatLngExpression;
  zoom?: number;
  className?: string;
}

/**
 * Contenedor Cartográfico Base (`MapaBase`).
 *
 * Utiliza OpenStreetMap estándar oficial (100% gratuito y sin requerimiento de API Key).
 * El modo oscuro se genera de forma fluida mediante filtrado óptico CSS de la capa de teselas (tile-pane),
 * manteniendo marcadores, geocercas y rutas en sus colores vibrantes originales.
 */
export const MapaBase: React.FC<MapaBaseProps> = ({
  children,
  centro,
  center,
  zoom = 13,
  className = '',
}) => {
  const posicion: LatLngExpression = centro || center || CENTRO_TACNA;

  return (
    <MapContainer
      center={posicion}
      zoom={zoom}
      className={`w-full h-full ${className}`}
      style={{ zIndex: 0 }}
      scrollWheelZoom={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
        maxZoom={19}
      />
      {children}
    </MapContainer>
  );
};

export default MapaBase;
