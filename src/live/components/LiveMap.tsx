import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Popup, Marker, Polyline, useMap } from 'react-leaflet';
import L, { type LatLngBoundsExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Maximize2, Layers, Route, Loader2 } from 'lucide-react';
import type { LiveDevice, TraccarGeofence } from '../types';
import { parseTraccarGeofence } from '../utils/geofenceParser';
import { obtenerRecorridoTraccar } from '../api';
import { CENTRO_TACNA } from '../../shared/components/map/MapaBase';
import LiveMarker from './LiveMarker';

/**
 * Constantes cartográficas y visuales del mapa en vivo
 */
export const CENTRO_PREDETERMINADO: [number, number] = CENTRO_TACNA;
export const DEFAULT_MAP_ZOOM = 13;
export const MAX_MAP_ZOOM = 19;
export const LABEL_VISIBILITY_ZOOM_THRESHOLD = 13;
export const DEFAULT_ZONE_COLOR = '#2563eb';
export const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

/**
 * Calcula el centroide de un polígono GeoJSON para posicionar la insignia de la zona.
 */
function calcularCentroideGeocerca(coords: any): [number, number] | null {
  if (!Array.isArray(coords) || coords.length === 0) return null;
  let sumLat = 0;
  let sumLon = 0;
  let count = 0;
  for (const pt of coords) {
    if (Array.isArray(pt) && pt.length >= 2) {
      sumLon += pt[0]; // [lon, lat]
      sumLat += pt[1];
      count++;
    }
  }
  return count > 0 ? [sumLat / count, sumLon / count] : null;
}

/**
 * Controlador de cámara para centrar suavemente el mapa al seleccionar un perifoneador.
 * Evita bucles infinitos de flyTo verificando que el cambio sea por acción del usuario.
 */
const CameraController: React.FC<{
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

/**
 * Configuración visual de la etiqueta de zona según el nivel de zoom:
 * - Zoom < 13: Oculto completamente (-zoom) para no saturar la vista distrital.
 * - Zoom 13: Sutil, menor tamaño y opacidad suave.
 * - Zoom >= 14: Más visible y legible (+zoom).
 * - Zoom >= 16: Grande, prominente y nítido.
 */
function obtenerEstiloEtiquetaZona(zoom: number) {
  if (zoom >= 16) {
    return {
      fontSize: '16px',
      opacity: 1,
      letterSpacing: '0.08em',
      size: [80, 26] as [number, number],
      anchor: [40, 13] as [number, number],
    };
  }
  if (zoom >= 14) {
    return {
      fontSize: '13px',
      opacity: 0.95,
      letterSpacing: '0.05em',
      size: [60, 20] as [number, number],
      anchor: [30, 10] as [number, number],
    };
  }
  // Zoom 13 (sutil cuando se empieza a alejar)
  return {
    fontSize: '11px',
    opacity: 0.65,
    letterSpacing: '0.03em',
    size: [50, 18] as [number, number],
    anchor: [25, 9] as [number, number],
  };
}

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
  const [rutaDispositivo, setRutaDispositivo] = useState<[number, number][]>([]);
  const [cargandoRuta, setCargandoRuta] = useState(false);
  const [currentZoom, setCurrentZoom] = useState<number>(13);
  const [fitBoundsTrigger, setFitBoundsTrigger] = useState<LatLngBoundsExpression | null>(null);

  // Cargar recorrido histórico de hoy cuando se activa mostrarRecorrido o cambia de dispositivo seleccionado
  useEffect(() => {
    if (!mostrarRecorrido || !selectedDevice) {
      setRutaDispositivo([]);
      setCargandoRuta(false);
      return;
    }

    let cancelado = false;

    const cargarRuta = async () => {
      setCargandoRuta(true);
      try {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const fromIso = hoy.toISOString();
        const toIso = new Date().toISOString();

        const posiciones = await obtenerRecorridoTraccar(selectedDevice.id, fromIso, toIso);
        if (cancelado) return;

        const coords: [number, number][] = posiciones
          .filter((p) => p.latitude !== null && p.longitude !== null)
          .map((p) => [p.latitude, p.longitude]);

        // Agregar la posición actual en vivo si no está presente
        if (selectedDevice.lat !== null && selectedDevice.lon !== null) {
          const ultimo = coords[coords.length - 1];
          if (!ultimo || ultimo[0] !== selectedDevice.lat || ultimo[1] !== selectedDevice.lon) {
            coords.push([selectedDevice.lat, selectedDevice.lon]);
          }
        }

        setRutaDispositivo(coords);
      } catch (err) {
        console.warn('[LiveMap] Error cargando recorrido de hoy:', err);
      } finally {
        if (!cancelado) setCargandoRuta(false);
      }
    };

    cargarRuta();

    return () => {
      cancelado = true;
    };
  }, [mostrarRecorrido, selectedDevice?.id]);

  // Actualizar recorrido en tiempo real conforme el dispositivo seleccionado se mueve
  useEffect(() => {
    if (!mostrarRecorrido || !selectedDevice || selectedDevice.lat === null || selectedDevice.lon === null) {
      return;
    }

    setRutaDispositivo((prev) => {
      if (prev.length === 0) {
        return [[selectedDevice.lat as number, selectedDevice.lon as number]];
      }
      const ultimo = prev[prev.length - 1];
      if (ultimo[0] !== selectedDevice.lat || ultimo[1] !== selectedDevice.lon) {
        return [...prev, [selectedDevice.lat as number, selectedDevice.lon as number]];
      }
      return prev;
    });
  }, [selectedDevice?.lat, selectedDevice?.lon, mostrarRecorrido]);

  // Distancia calculada del recorrido en kilómetros
  const distanciaTotalKm = useMemo(() => {
    if (rutaDispositivo.length < 2) return 0;
    let total = 0;
    for (let i = 1; i < rutaDispositivo.length; i++) {
      const [lat1, lon1] = rutaDispositivo[i - 1];
      const [lat2, lon2] = rutaDispositivo[i];
      total += L.latLng(lat1, lon1).distanceTo(L.latLng(lat2, lon2)) / 1000;
    }
    return total;
  }, [rutaDispositivo]);

  // Encuadrar toda la ruta en pantalla
  const handleAjustarRuta = () => {
    if (rutaDispositivo.length > 0) {
      setFitBoundsTrigger(L.latLngBounds(rutaDispositivo));
    }
  };

  // Parsear geocercas a Features GeoJSON
  const geofenceFeatures = useMemo(() => {
    return geofences
      .map((g) => parseTraccarGeofence(g))
      .filter(Boolean);
  }, [geofences]);

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
      const bounds = L.latLngBounds(coordsConPosicion);
      setFitBoundsTrigger(bounds);
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
        <TileLayer
          url={OSM_TILE_URL}
          attribution={OSM_ATTRIBUTION}
          maxZoom={MAX_MAP_ZOOM}
        />

        <CameraController
          target={targetPos}
          selectedDeviceId={selectedDevice?.id ?? null}
          focusTrigger={focusTrigger}
          boundsToFit={fitBoundsTrigger}
          devices={devices}
          onZoomChange={setCurrentZoom}
        />

        {/* Capa de Geocercas de Traccar con Nombres Reales (A1, B2, etc.) */}
        {mostrarGeocercas &&
          geofenceFeatures.map((feat) => {
            if (!feat) return null;
            const rawColor = feat.properties?.color;
            const color = rawColor && rawColor.toLowerCase() !== '#ffffff' ? rawColor : DEFAULT_ZONE_COLOR;
            const nombreZona = feat.properties?.name || 'Zona';
            const centro = calcularCentroideGeocerca(feat.geometry.coordinates?.[0]);

            const estiloEtiqueta = obtenerEstiloEtiquetaZona(currentZoom);

            // Etiqueta tipográfica pura (sin recuadro de fondo) con halo cartográfico nítido
            const badgeIcon = centro
              ? L.divIcon({
                  className: 'custom-geofence-badge',
                  html: `<div class="zone-code-label" style="color: ${color}; font-size: ${estiloEtiqueta.fontSize}; opacity: ${estiloEtiqueta.opacity}; letter-spacing: ${estiloEtiqueta.letterSpacing};">
                           ${nombreZona}
                         </div>`,
                  iconSize: estiloEtiqueta.size,
                  iconAnchor: estiloEtiqueta.anchor,
                })
              : null;

            return (
              <React.Fragment key={feat.id}>
                <GeoJSON
                  data={feat}
                  style={{
                    color,
                    weight: 2,
                    dashArray: '4, 4',
                    fillColor: color,
                    fillOpacity: 0.12,
                  }}
                >
                  <Popup>
                    <div className="text-xs font-semibold">
                      <span className="text-zinc-900 dark:text-zinc-100 font-bold">
                        Zona: {nombreZona}
                      </span>
                    </div>
                  </Popup>
                </GeoJSON>

                {/* Etiqueta visible con +zoom (>= 13) y oculta con -zoom (< 13) */}
                {mostrarEtiquetasZonas && centro && badgeIcon && (
                  <Marker position={centro} icon={badgeIcon} interactive={false} />
                )}
              </React.Fragment>
            );
          })}

        {/* Recorrido en Tiempo Real: Únicamente para el dispositivo marcado en el sidebar */}
        {mostrarRecorrido && selectedDevice && rutaDispositivo.length > 1 && (
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
        )}

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

      {/* Indicador Flotante Superior del Recorrido en Tiempo Real estilo Traccar */}
      {mostrarRecorrido && (
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
                · {rutaDispositivo.length} pts
              </span>
              {rutaDispositivo.length > 0 && (
                <button
                  type="button"
                  onClick={handleAjustarRuta}
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
      )}

      {/* Paleta flotante de herramientas del mapa estilo macOS */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1 p-1 rounded-2xl bg-white/85 dark:bg-zinc-900/85 backdrop-blur-2xl border border-zinc-200/80 dark:border-white/10 shadow-xl select-none">
        <button
          type="button"
          onClick={handleAjustarTodos}
          title="Centrar en todos los dispositivos"
          className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <Maximize2 size={15} />
        </button>

        {/* Botón de Recorrido en Tiempo Real */}
        <button
          type="button"
          onClick={() => setMostrarRecorrido((prev) => !prev)}
          title={mostrarRecorrido ? 'Ocultar recorrido' : 'Ver recorrido en tiempo real'}
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
            mostrarRecorrido
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Route size={15} />
        </button>

        {/* Botón de Geocercas */}
        <button
          type="button"
          onClick={() => setMostrarGeocercas((prev) => !prev)}
          title={mostrarGeocercas ? 'Ocultar Geocercas' : 'Mostrar Geocercas'}
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
            mostrarGeocercas
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Layers size={15} />
        </button>
      </div>
    </div>
  );
};

export default React.memo(LiveMap);
