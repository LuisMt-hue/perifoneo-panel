import type { TraccarDevice, TraccarPosition, TraccarGeofence } from './types';
import { tokenStorage } from '../services/auth/tokenStorage';

/**
 * Cliente de API exclusivo para el módulo Live contra el backend de Traccar.
 */

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

/**
 * Construye la URL para las peticiones a Traccar incluyendo el token de autenticación.
 * Utiliza ruta relativa al origen actual para aprovechar el proxy (tanto en Vite dev como en Nginx producción).
 */
export function buildTraccarUrl(endpoint: string): string {
  const base = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = new URL(base, window.location.origin);
  const token = getTraccarToken();

  if (token) {
    url.searchParams.set('token', token);
  }
  return url.pathname + url.search;
}

/**
 * Headers estándar para peticiones a Traccar.
 */
export function getTraccarHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  const token = getTraccarToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Realiza una petición HTTP a Traccar y valida que la respuesta sea JSON válido.
 * Si el servidor devuelve HTML (por ejemplo si el proxy no estuviera activo y respondiera index.html),
 * emite un mensaje descriptivo y claro en lugar de un SyntaxError de JSON inesperado.
 */
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
      `Error de Traccar (${res.status} ${res.statusText}): ${bodySnippet.slice(0, 150)}`
    );
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(
      `Respuesta inesperada de Traccar: se esperaba JSON pero se recibió "${contentType}". Verifica la configuración de proxy de Traccar (/api) en el servidor web.`
    );
  }

  return res.json();
}

/**
 * Verifica el estado de la sesión o usuario con el token configurado.
 */
export async function obtenerSesionTraccar(): Promise<any> {
  const url = buildTraccarUrl('/api/session');
  return fetchTraccarJson(url, { headers: getTraccarHeaders() });
}

/**
 * Obtiene la lista completa de dispositivos accesibles en Traccar.
 */
export async function obtenerDispositivosTraccar(): Promise<TraccarDevice[]> {
  const url = buildTraccarUrl('/api/devices');
  return fetchTraccarJson<TraccarDevice[]>(url, { headers: getTraccarHeaders() });
}

/**
 * Obtiene las últimas posiciones registradas para todos los dispositivos.
 */
export async function obtenerPosicionesTraccar(): Promise<TraccarPosition[]> {
  const url = buildTraccarUrl('/api/positions');
  return fetchTraccarJson<TraccarPosition[]>(url, { headers: getTraccarHeaders() });
}

/**
 * Obtiene las geocercas (sectores/zonas) configuradas en Traccar.
 */
export async function obtenerGeocercasTraccar(): Promise<TraccarGeofence[]> {
  const url = buildTraccarUrl('/api/geofences');
  return fetchTraccarJson<TraccarGeofence[]>(url, { headers: getTraccarHeaders() });
}

/**
 * Obtiene el recorrido histórico / ruta de un dispositivo en un rango de fechas (ISO 8601).
 */
export async function obtenerRecorridoTraccar(
  deviceId: number,
  from: string,
  to: string,
): Promise<TraccarPosition[]> {
  const params = new URLSearchParams({
    deviceId: String(deviceId),
    from,
    to,
  });
  const url = buildTraccarUrl(`/api/reports/route?${params.toString()}`);
  return fetchTraccarJson<TraccarPosition[]>(url, { headers: getTraccarHeaders() });
}

export interface SocketHandlers {
  onDevices?: (devices: TraccarDevice[]) => void;
  onPositions?: (positions: TraccarPosition[]) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (err: Event) => void;
}

/**
 * Establece conexión en tiempo real vía WebSocket con Traccar (`/api/socket`).
 * Gestiona reconexión automática y emisión de eventos de posiciones y dispositivos.
 */
export function conectarSocketTraccar(handlers: SocketHandlers): () => void {
  let ws: WebSocket | null = null;
  let reintentarTimeout: any = null;
  let estaCerradoManualmente = false;

  const conectar = () => {
    if (estaCerradoManualmente) return;

    try {
      const protocolo = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const token = getTraccarToken();
      const socketUrl = `${protocolo}//${host}/api/socket${token ? `?token=${encodeURIComponent(token)}` : ''}`;

      ws = new WebSocket(socketUrl);

      ws.onopen = () => {
        console.log('[LiveSocket] Conectado en tiempo real a Traccar WebSocket');
        handlers.onOpen?.();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.devices && handlers.onDevices) {
            handlers.onDevices(data.devices);
          }
          if (data.positions && handlers.onPositions) {
            handlers.onPositions(data.positions);
          }
        } catch (e) {
          console.warn('[LiveSocket] Mensaje no procesable:', event.data);
        }
      };

      ws.onerror = (err) => {
        console.warn('[LiveSocket] Error en conexión WebSocket:', err);
        handlers.onError?.(err);
      };

      ws.onclose = () => {
        handlers.onClose?.();
        if (!estaCerradoManualmente) {
          console.log('[LiveSocket] Socket cerrado. Reintentando conexión en 5 segundos...');
          reintentarTimeout = setTimeout(conectar, 5000);
        }
      };
    } catch (err) {
      console.error('[LiveSocket] Error al inicializar WebSocket:', err);
      if (!estaCerradoManualmente) {
        reintentarTimeout = setTimeout(conectar, 5000);
      }
    }
  };

  conectar();

  return () => {
    estaCerradoManualmente = true;
    if (reintentarTimeout) {
      clearTimeout(reintentarTimeout);
    }
    if (ws && ws.readyState !== WebSocket.CLOSED) {
      ws.close();
    }
  };
}
