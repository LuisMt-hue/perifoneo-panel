import type { Feature, Polygon } from 'geojson';
import type { TraccarGeofence } from '../types';

/**
 * Convierte un área de geocerca en formato WKT de Traccar (POLYGON o CIRCLE)
 * a un Feature GeoJSON estándar compatible con Leaflet.
 */
export function parseTraccarGeofence(geofence: TraccarGeofence): Feature<Polygon> | null {
  if (!geofence.area || typeof geofence.area !== 'string') return null;

  const areaText = geofence.area.trim();
  const upper = areaText.toUpperCase();

  try {
    // Caso 1: POLYGON ((lat lon, lat lon, ...)) o ((lon lat, ...))
    if (upper.startsWith('POLYGON')) {
      const inside = areaText.substring(areaText.indexOf('((') + 2, areaText.lastIndexOf('))'));
      const rawPoints = inside.split(',').map((p) => p.trim()).filter(Boolean);

      if (rawPoints.length < 3) return null;

      // Detectar orden: Traccar habitualmente envía latitud primero en WKT (ej. -18.01 -70.25).
      // En GeoJSON estándar se requiere [longitud, latitud].
      const coords: [number, number][] = rawPoints.map((pt) => {
        const [a, b] = pt.split(/\s+/).map(Number);
        // Si |a| <= 90 y |b| > 90 (como en Perú: lat ~ -18, lon ~ -70), a es lat y b es lon.
        // Convertimos a [lon, lat] para GeoJSON:
        if (Math.abs(a) <= 90 && Math.abs(b) > 40) {
          return [b, a];
        }
        // Si ya viene [lon, lat]:
        return [a, b];
      });

      // Asegurar polígono cerrado
      if (coords.length > 0) {
        const first = coords[0];
        const last = coords[coords.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) {
          coords.push([first[0], first[1]]);
        }
      }

      return {
        type: 'Feature',
        id: geofence.id,
        geometry: {
          type: 'Polygon',
          coordinates: [coords],
        },
        properties: {
          id: geofence.id,
          name: geofence.name,
          description: geofence.description,
          color: geofence.attributes?.color || '#3b82f6',
        },
      };
    }

    // Caso 2: CIRCLE (lat, lon, radio_en_metros)
    if (upper.startsWith('CIRCLE')) {
      const inside = areaText.substring(areaText.indexOf('(') + 1, areaText.lastIndexOf(')'));
      const parts = inside.split(',').map((s) => s.trim());
      if (parts.length < 3) return null;

      const lat = Number(parts[0]);
      const lon = Number(parts[1]);
      const radiusMeters = Number(parts[2]);

      if (Number.isNaN(lat) || Number.isNaN(lon) || Number.isNaN(radiusMeters)) return null;

      // Generar círculo como polígono de 32 vértices
      const points: [number, number][] = [];
      const steps = 32;
      const earthRadius = 6378137; // metros

      for (let i = 0; i <= steps; i++) {
        const theta = (i * 2 * Math.PI) / steps;
        const dLat = (radiusMeters / earthRadius) * (180 / Math.PI);
        const dLon = ((radiusMeters / earthRadius) * (180 / Math.PI)) / Math.cos((lat * Math.PI) / 180);

        const pLat = lat + dLat * Math.sin(theta);
        const pLon = lon + dLon * Math.cos(theta);
        points.push([pLon, pLat]); // GeoJSON es [lon, lat]
      }

      return {
        type: 'Feature',
        id: geofence.id,
        geometry: {
          type: 'Polygon',
          coordinates: [points],
        },
        properties: {
          id: geofence.id,
          name: geofence.name,
          description: geofence.description,
          color: geofence.attributes?.color || '#3b82f6',
        },
      };
    }
  } catch (err) {
    console.warn(`[geofenceParser] Error parseando geocerca ${geofence.name}:`, err);
  }

  return null;
}
