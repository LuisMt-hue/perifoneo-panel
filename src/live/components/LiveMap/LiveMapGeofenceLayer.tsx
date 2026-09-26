import React, { useMemo } from 'react';
import { GeoJSON, Popup, Marker } from 'react-leaflet';
import L from 'leaflet';
import type { TraccarGeofence } from '../../types';
import { parseTraccarGeofence } from '../../utils/geofenceParser';
import { calcularCentroideGeocerca, obtenerEstiloEtiquetaZona } from '../../utils/mapLabelStyle';

export const DEFAULT_ZONE_COLOR = '#2563eb';

interface LiveMapGeofenceLayerProps {
  geofences: TraccarGeofence[];
  visible: boolean;
  mostrarEtiquetas: boolean;
  currentZoom: number;
}

/**
 * Capa de geocercas de Traccar: polígonos con nombre real (A1, B2, etc.) y su
 * etiqueta flotante, cuya visibilidad/tamaño depende del nivel de zoom actual.
 */
export const LiveMapGeofenceLayer: React.FC<LiveMapGeofenceLayerProps> = ({
  geofences,
  visible,
  mostrarEtiquetas,
  currentZoom,
}) => {
  const geofenceFeatures = useMemo(() => {
    return geofences.map((g) => parseTraccarGeofence(g)).filter(Boolean);
  }, [geofences]);

  if (!visible) return null;

  return (
    <>
      {geofenceFeatures.map((feat) => {
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
            {mostrarEtiquetas && centro && badgeIcon && (
              <Marker position={centro} icon={badgeIcon} interactive={false} />
            )}
          </React.Fragment>
        );
      })}
    </>
  );
};

export default React.memo(LiveMapGeofenceLayer);
