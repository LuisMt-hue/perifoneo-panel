import type { TraccarDevice, TraccarGeofence } from '../../live/types';
import { buildTraccarUrl, getTraccarHeaders, fetchTraccarJson } from './traccarClient';

/**
 * Consultas de catálogo de Traccar compartidas entre los módulos Live, Historial y Reportes.
 * Centralizadas aquí para que todos consuman exactamente la misma fuente y, en combinación
 * con TanStack Query, la misma entrada de cache (evita peticiones duplicadas al servidor).
 */

export async function obtenerDispositivosTraccar(): Promise<TraccarDevice[]> {
  const url = buildTraccarUrl('/api/devices');
  return fetchTraccarJson<TraccarDevice[]>(url, { headers: getTraccarHeaders() });
}

export async function obtenerGeocercasTraccar(): Promise<TraccarGeofence[]> {
  const url = buildTraccarUrl('/api/geofences');
  return fetchTraccarJson<TraccarGeofence[]>(url, { headers: getTraccarHeaders() });
}
