import type { TraccarDevice, CreateDevicePayload } from './types';
import { ALLOWED_TRACCAR_DEVICE_KEYS } from './constants';
import {
  getTraccarToken,
  buildTraccarUrl,
  getTraccarHeaders as getBaseTraccarHeaders,
  fetchTraccarJson,
} from '../shared/services/traccarClient';

/**
 * Constantes de procesamiento para el módulo de dispositivos
 */
export const BATCH_CHUNK_SIZE = 5;

export { getTraccarToken, buildTraccarUrl };

/**
 * Headers específicos para peticiones CRUD de dispositivos (incluye Content-Type application/json)
 */
export function getTraccarHeaders(): Record<string, string> {
  return getBaseTraccarHeaders({ 'Content-Type': 'application/json' });
}

/**
 * Sanitiza estrictamente un objeto de dispositivo para cumplir con el deserializador Jackson de Traccar.
 * Elimina 'isOnline' y cualquier otra propiedad ajena que provoque el error 400 Bad Request.
 */
export function sanitizeDeviceForTraccar(device: Partial<TraccarDevice>): Record<string, any> {
  const clean: Record<string, any> = {};

  for (const key of Object.keys(device)) {
    if (ALLOWED_TRACCAR_DEVICE_KEYS.has(key)) {
      const val = (device as any)[key];
      if (val !== undefined) {
        clean[key] = val;
      }
    }
  }

  // Asegurar que attributes sea un objeto y no contenga llaves con valores undefined
  const rawAttrs = device.attributes || {};
  const cleanAttrs: Record<string, any> = {};
  for (const [k, v] of Object.entries(rawAttrs)) {
    if (v !== undefined) {
      cleanAttrs[k] = v;
    }
  }
  clean.attributes = cleanAttrs;

  return clean;
}

/**
 * Crea un nuevo dispositivo en Traccar (POST /api/devices).
 * Mapea propiedades estándar; base y sector se guardan en attributes, groupId es un campo nativo.
 */
export async function crearDispositivoTraccar(payload: CreateDevicePayload): Promise<TraccarDevice> {
  const attributes: Record<string, any> = { ...(payload.attributes || {}) };

  if (payload.base?.trim()) attributes.base = payload.base.trim();
  if (payload.sector?.trim()) attributes.sector = payload.sector.trim();

  const deviceData: Partial<TraccarDevice> = {
    name: payload.name.trim(),
    uniqueId: payload.uniqueId.trim(),
    phone: payload.phone?.trim() || undefined,
    contact: payload.contact?.trim() || undefined,
    category: payload.category?.trim() || undefined,
    disabled: Boolean(payload.disabled),
    groupId: payload.groupId,
    attributes,
  };

  const cleanPayload = sanitizeDeviceForTraccar(deviceData);

  const url = buildTraccarUrl('/api/devices');
  return fetchTraccarJson<TraccarDevice>(url, {
    method: 'POST',
    headers: getTraccarHeaders(),
    body: JSON.stringify(cleanPayload),
  });
}

/**
 * Actualiza un dispositivo completo en Traccar vía PUT /api/devices/{id}.
 * Aplica sanitización estricta para garantizar que Jackson no falle con campos como isOnline.
 */
export async function guardarDispositivoTraccar(device: Partial<TraccarDevice>): Promise<TraccarDevice> {
  if (!device.id) {
    throw new Error('No se puede actualizar un dispositivo sin ID.');
  }

  const cleanPayload = sanitizeDeviceForTraccar(device);
  const url = buildTraccarUrl(`/api/devices/${device.id}`);

  return fetchTraccarJson<TraccarDevice>(url, {
    method: 'PUT',
    headers: getTraccarHeaders(),
    body: JSON.stringify(cleanPayload),
  });
}

/**
 * Elimina un dispositivo en Traccar (DELETE /api/devices/{id}).
 */
export async function eliminarDispositivoTraccar(id: number): Promise<void> {
  const url = buildTraccarUrl(`/api/devices/${id}`);
  const res = await fetch(url, {
    method: 'DELETE',
    headers: getTraccarHeaders(),
    credentials: 'include',
  });

  if (!res.ok) {
    let bodySnippet = '';
    try {
      bodySnippet = await res.text();
    } catch {}
    throw new Error(`Error al eliminar dispositivo (${res.status}): ${bodySnippet || res.statusText}`);
  }
}

/**
 * Actualiza una propiedad estándar o un atributo específico de un dispositivo.
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
 * Propaga un campo masivamente a una lista de dispositivos: puede ser un atributo de texto
 * (`isAttribute: true`, ej. base/sector) o un campo nativo de Traccar (`isAttribute: false`,
 * ej. `groupId`).
 */
export async function propagarAtributoEnLote(
  devices: TraccarDevice[],
  targetIds: number[],
  fieldOrKey: string,
  value: any,
  onProgress?: (completados: number, total: number) => void,
  isAttribute: boolean = true
): Promise<{ exitosos: number; fallidos: number; actualizados: TraccarDevice[] }> {
  const dispositivosAfectados = devices.filter((d) => targetIds.includes(d.id));
  const total = dispositivosAfectados.length;
  let completados = 0;
  let exitosos = 0;
  let fallidos = 0;
  const actualizados: TraccarDevice[] = [];

  for (let i = 0; i < dispositivosAfectados.length; i += BATCH_CHUNK_SIZE) {
    const chunk = dispositivosAfectados.slice(i, i + BATCH_CHUNK_SIZE);
    await Promise.all(
      chunk.map(async (dev) => {
        try {
          const res = await actualizarCampoOAtributo(dev, fieldOrKey, value, isAttribute);
          actualizados.push(res);
          exitosos++;
        } catch (err) {
          console.error(`Error actualizando "${fieldOrKey}" en dispositivo ${dev.id}:`, err);
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
