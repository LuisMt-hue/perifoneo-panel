import type { TraccarDevice, TraccarGeofence, TraccarGroup } from '../../live/types';
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

export async function obtenerGruposTraccar(): Promise<TraccarGroup[]> {
  const url = buildTraccarUrl('/api/groups');
  return fetchTraccarJson<TraccarGroup[]>(url, { headers: getTraccarHeaders() });
}

/**
 * CRUD del grupo nativo de Traccar (`/api/groups`). A diferencia de "Base" (atributo
 * de texto libre sobre el dispositivo), un grupo es una entidad real con su propio ID.
 */
export async function crearGrupoTraccar(name: string): Promise<TraccarGroup> {
  const url = buildTraccarUrl('/api/groups');
  return fetchTraccarJson<TraccarGroup>(url, {
    method: 'POST',
    headers: getTraccarHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ name }),
  });
}

export async function renombrarGrupoTraccar(grupo: TraccarGroup, nuevoNombre: string): Promise<TraccarGroup> {
  const url = buildTraccarUrl(`/api/groups/${grupo.id}`);
  return fetchTraccarJson<TraccarGroup>(url, {
    method: 'PUT',
    headers: getTraccarHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ ...grupo, name: nuevoNombre }),
  });
}

export async function eliminarGrupoTraccar(id: number): Promise<void> {
  const url = buildTraccarUrl(`/api/groups/${id}`);
  const res = await fetch(url, {
    method: 'DELETE',
    headers: getTraccarHeaders(),
    credentials: 'include',
  });
  if (!res.ok) {
    let detalle = '';
    try {
      detalle = await res.text();
    } catch {
      // Ignorar
    }
    throw new Error(`Error al eliminar el grupo (${res.status}): ${detalle || res.statusText}`);
  }
}
