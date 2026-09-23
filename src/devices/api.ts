import type { TraccarDevice, CreateDevicePayload } from './types';
import { ALLOWED_TRACCAR_DEVICE_KEYS } from './constants';
import { tokenStorage } from '../services/auth/tokenStorage';

const DEFAULT_TRACCAR_TOKEN =
  'RzBFAiEA3qbpLvWKt4B55qCwmjZ1eD4a52-aKijzGBugs6BI2OwCIEsmKlE7xhY2-wMIrbarNl91OhYe_71TA5AEm9VAMS3QeyJpIjo2OTkxMjg1MjM0MjMxMzAwMjA5LCJ1IjoxLCJlIjoiMjAyNi0wOS0yOVQwNTowMDowMC4wMDArMDA6MDAifQ';

/**
 * Obtiene el token activo de Traccar, priorizando la sesión del usuario conectado.
 */
export function getTraccarToken(): string {
  return tokenStorage.getToken() || (import.meta.env.VITE_TRACCAR_TOKEN as string | undefined) || DEFAULT_TRACCAR_TOKEN;
}

export const TRACCAR_TOKEN: string =
  (import.meta.env.VITE_TRACCAR_TOKEN as string | undefined) || DEFAULT_TRACCAR_TOKEN;

export function buildTraccarUrl(endpoint: string): string {
  const base = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = new URL(base, window.location.origin);
  const token = getTraccarToken();
  if (token) {
    url.searchParams.set('token', token);
  }
  return url.pathname + url.search;
}

export function getTraccarHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  const token = getTraccarToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
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

async function fetchTraccarJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    ...init,
  });

  if (!res.ok) {
    let bodySnippet = '';
    try {
      bodySnippet = await res.text();
    } catch {}
    throw new Error(
      `Error de Traccar (${res.status} ${res.statusText}): ${bodySnippet.slice(0, 200)}`
    );
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(
      `Respuesta inesperada de Traccar: se esperaba JSON pero se recibió "${contentType}". Verifica el proxy /api en el servidor.`
    );
  }

  return res.json();
}

/**
 * Obtiene la lista completa de dispositivos registrados en Traccar.
 */
export async function listarDispositivosTraccar(): Promise<TraccarDevice[]> {
  const url = buildTraccarUrl('/api/devices');
  return fetchTraccarJson<TraccarDevice[]>(url, { headers: getTraccarHeaders() });
}

/**
 * Crea un nuevo dispositivo en Traccar (POST /api/devices).
 * Mapea propiedades estándar y almacena base, distrito, placa, sector en attributes.
 */
export async function crearDispositivoTraccar(payload: CreateDevicePayload): Promise<TraccarDevice> {
  const attributes: Record<string, any> = { ...(payload.attributes || {}) };

  if (payload.base?.trim()) attributes.base = payload.base.trim();
  if (payload.distrito?.trim()) attributes.distrito = payload.distrito.trim();
  if (payload.placa?.trim()) attributes.placa = payload.placa.trim();
  if (payload.sector?.trim()) attributes.sector = payload.sector.trim();

  const deviceData: Partial<TraccarDevice> = {
    name: payload.name.trim(),
    uniqueId: payload.uniqueId.trim(),
    phone: payload.phone?.trim() || undefined,
    contact: payload.contact?.trim() || undefined,
    category: payload.category?.trim() || undefined,
    disabled: Boolean(payload.disabled),
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
 * Propaga un atributo masivamente a una lista de dispositivos.
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
          console.error(`Error actualizando atributo "${attributeKey}" en dispositivo ${dev.id}:`, err);
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
 * Renombra una clave de atributo en todos los dispositivos que la contengan.
 */
export async function renombrarAtributoEnLote(
  devices: TraccarDevice[],
  oldKey: string,
  newKey: string,
  onProgress?: (completados: number, total: number) => void
): Promise<{ exitosos: number; fallidos: number; actualizados: TraccarDevice[] }> {
  const cleanNewKey = newKey.trim();
  if (!cleanNewKey || oldKey === cleanNewKey) {
    return { exitosos: 0, fallidos: 0, actualizados: [] };
  }

  const dispositivosAfectados = devices.filter(
    (d) => d.attributes && oldKey in d.attributes
  );
  const total = dispositivosAfectados.length;
  let completados = 0;
  let exitosos = 0;
  let fallidos = 0;
  const actualizados: TraccarDevice[] = [];

  const CHUNK_SIZE = 5;

  for (let i = 0; i < dispositivosAfectados.length; i += CHUNK_SIZE) {
    const chunk = dispositivosAfectados.slice(i, i + CHUNK_SIZE);
    await Promise.all(
      chunk.map(async (dev) => {
        try {
          const valor = dev.attributes?.[oldKey];
          const currentAttrs = { ...(dev.attributes || {}) };
          delete currentAttrs[oldKey];
          currentAttrs[cleanNewKey] = valor;

          const res = await guardarDispositivoTraccar({
            ...dev,
            attributes: currentAttrs,
          });

          actualizados.push(res);
          exitosos++;
        } catch (err) {
          console.error(`Error renombrando atributo "${oldKey}" a "${newKey}" en dispositivo ${dev.id}:`, err);
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
  const dispositivosAfectados = devices.filter(
    (d) => targetIds.includes(d.id) && d.attributes && attributeKey in d.attributes
  );
  const total = dispositivosAfectados.length;
  let completados = 0;
  let exitosos = 0;
  let fallidos = 0;
  const actualizados: TraccarDevice[] = [];

  const CHUNK_SIZE = 5;

  for (let i = 0; i < dispositivosAfectados.length; i += CHUNK_SIZE) {
    const chunk = dispositivosAfectados.slice(i, i + CHUNK_SIZE);
    await Promise.all(
      chunk.map(async (dev) => {
        try {
          const currentAttrs = { ...(dev.attributes || {}) };
          delete currentAttrs[attributeKey];

          const res = await guardarDispositivoTraccar({
            ...dev,
            attributes: currentAttrs,
          });

          actualizados.push(res);
          exitosos++;
        } catch (err) {
          console.error(`Error eliminando atributo "${attributeKey}" en dispositivo ${dev.id}:`, err);
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
