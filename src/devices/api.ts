import type { TraccarDevice } from './types';

const TRACCAR_TOKEN: string = (import.meta.env.VITE_TRACCAR_TOKEN as string | undefined) || '';

function buildTraccarUrl(endpoint: string): string {
  const base = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = new URL(base, window.location.origin);
  if (TRACCAR_TOKEN) {
    url.searchParams.set('token', TRACCAR_TOKEN);
  }
  return url.pathname + url.search;
}

function getTraccarHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (TRACCAR_TOKEN) {
    headers['Authorization'] = `Bearer ${TRACCAR_TOKEN}`;
  }
  return headers;
}

/**
 * Obtiene la lista completa de dispositivos registrados en Traccar.
 */
export async function listarDispositivosTraccar(): Promise<TraccarDevice[]> {
  const url = buildTraccarUrl('/api/devices');
  const res = await fetch(url, { headers: getTraccarHeaders() });
  if (!res.ok) {
    throw new Error(`Error obteniendo dispositivos de Traccar: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * Actualiza un dispositivo completo en Traccar vía PUT /api/devices/{id}.
 */
export async function guardarDispositivoTraccar(device: TraccarDevice): Promise<TraccarDevice> {
  const url = buildTraccarUrl(`/api/devices/${device.id}`);
  const res = await fetch(url, {
    method: 'PUT',
    headers: getTraccarHeaders(),
    body: JSON.stringify(device),
  });
  if (!res.ok) {
    const errorBody = await res.text().catch(() => '');
    throw new Error(`Error al actualizar dispositivo (${res.status}): ${errorBody || res.statusText}`);
  }
  return res.json();
}

/**
 * Actualiza una propiedad o un atributo específico de un dispositivo.
 */
export async function actualizarCampoOAtributo(
  device: TraccarDevice,
  fieldOrKey: string,
  value: any,
  isAttribute: boolean
): Promise<TraccarDevice> {
  const updated: TraccarDevice = { ...device };

  if (isAttribute) {
    const currentAttrs = { ...(device.attributes || {}) };
    if (value === null || value === undefined || value === '') {
      delete currentAttrs[fieldOrKey];
    } else {
      currentAttrs[fieldOrKey] = value;
    }
    updated.attributes = currentAttrs;
  } else {
    // Propiedad estándar de Traccar (name, uniqueId, phone, contact, category, disabled)
    (updated as any)[fieldOrKey] = value;
  }

  return guardarDispositivoTraccar(updated);
}

/**
 * Agrega o actualiza un atributo de forma masiva en una lista de dispositivos.
 * Ejecuta en lotes concurrentes para máxima velocidad y fiabilidad.
 */
export async function propagarAtributoEnLote(
  devices: TraccarDevice[],
  targetIds: number[],
  attributeKey: string,
  attributeValue: any,
  onProgress?: (completados: number, total: number) => void
): Promise<{ exitosos: number; fallidos: number; actualizados: TraccarDevice[] }> {
  const dispositivosAfectados = devices.filter((d) => targetIds.includes(d.id));
  const total = dispositivosAfectados.length;
  let completados = 0;
  let exitosos = 0;
  let fallidos = 0;
  const actualizados: TraccarDevice[] = [];

  // Tamaño de bloque concurrente (5 peticiones en paralelo)
  const CHUNK_SIZE = 5;

  for (let i = 0; i < dispositivosAfectados.length; i += CHUNK_SIZE) {
    const chunk = dispositivosAfectados.slice(i, i + CHUNK_SIZE);
    await Promise.all(
      chunk.map(async (dev) => {
        try {
          const res = await actualizarCampoOAtributo(dev, attributeKey, attributeValue, true);
          actualizados.push(res);
          exitosos++;
        } catch (err) {
          console.error(`Error actualizando atributo en dispositivo ${dev.id}:`, err);
          fallidos++;
        } finally {
          completados++;
          onProgress?.(completados, total);
        }
      })
    );
  }

  return { exitosos, fallidos, actualizados };
}

/**
 * Elimina un atributo de forma masiva en una lista de dispositivos.
 */
export async function eliminarAtributoEnLote(
  devices: TraccarDevice[],
  targetIds: number[],
  attributeKey: string,
  onProgress?: (completados: number, total: number) => void
): Promise<{ exitosos: number; fallidos: number; actualizados: TraccarDevice[] }> {
  return propagarAtributoEnLote(devices, targetIds, attributeKey, '', onProgress);
}

/**
 * Crea un nuevo dispositivo en Traccar.
 */
export async function crearDispositivoTraccar(device: Partial<TraccarDevice>): Promise<TraccarDevice> {
  const url = buildTraccarUrl('/api/devices');
  const res = await fetch(url, {
    method: 'POST',
    headers: getTraccarHeaders(),
    body: JSON.stringify(device),
  });
  if (!res.ok) {
    const errorBody = await res.text().catch(() => '');
    throw new Error(`Error al crear dispositivo (${res.status}): ${errorBody || res.statusText}`);
  }
  return res.json();
}

/**
 * Elimina un dispositivo en Traccar.
 */
export async function eliminarDispositivoTraccar(id: number): Promise<void> {
  const url = buildTraccarUrl(`/api/devices/${id}`);
  const res = await fetch(url, {
    method: 'DELETE',
    headers: getTraccarHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Error al eliminar dispositivo (${res.status}): ${res.statusText}`);
  }
}
