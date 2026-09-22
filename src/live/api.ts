import type { TraccarDevice, TraccarPosition, TraccarGeofence } from './types';

/**
 * Cliente de API exclusivo para el módulo Live contra el backend de Traccar.
 */

const TRACCAR_TOKEN: string = (import.meta.env.VITE_TRACCAR_TOKEN as string | undefined) || '';

/**
 * Construye la URL para las peticiones a Traccar incluyendo el token de autenticación.
 */
function buildTraccarUrl(endpoint: string): string {
  // En desarrollo, usamos ruta relativa para aprovechar el proxy configurado en Vite y evitar CORS
  const base = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = new URL(base, window.location.origin);
  
  if (TRACCAR_TOKEN) {
    url.searchParams.set('token', TRACCAR_TOKEN);
  }
  return url.pathname + url.search;
}

/**
 * Headers estándar para peticiones a Traccar.
 */
function getTraccarHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (TRACCAR_TOKEN) {
    headers['Authorization'] = `Bearer ${TRACCAR_TOKEN}`;
  }
  return headers;
}

/**
 * Verifica el estado de la sesión o usuario con el token configurado.
 */
export async function obtenerSesionTraccar(): Promise<any> {
  const url = buildTraccarUrl('/api/session');
  const res = await fetch(url, { headers: getTraccarHeaders() });
  if (!res.ok) {
    throw new Error(`Error obteniendo sesión de Traccar: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * Obtiene la lista completa de dispositivos accesibles en Traccar.
 */
export async function obtenerDispositivosTraccar(): Promise<TraccarDevice[]> {
  const url = buildTraccarUrl('/api/devices');
  const res = await fetch(url, { headers: getTraccarHeaders() });
  if (!res.ok) {
    throw new Error(`Error al obtener dispositivos de Traccar: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * Obtiene las últimas posiciones registradas para todos los dispositivos.
 */
export async function obtenerPosicionesTraccar(): Promise<TraccarPosition[]> {
  const url = buildTraccarUrl('/api/positions');
  const res = await fetch(url, { headers: getTraccarHeaders() });
  if (!res.ok) {
    throw new Error(`Error al obtener posiciones de Traccar: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * Obtiene las geocercas (sectores/zonas) configuradas en Traccar.
 */
export async function obtenerGeocercasTraccar(): Promise<TraccarGeofence[]> {
  const url = buildTraccarUrl('/api/geofences');
  const res = await fetch(url, { headers: getTraccarHeaders() });
  if (!res.ok) {
    throw new Error(`Error al obtener geocercas de Traccar: ${res.status} ${res.statusText}`);
  }
  return res.json();
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
  const res = await fetch(url, { headers: getTraccarHeaders() });
  if (!res.ok) {
    throw new Error(`Error al obtener recorrido de Traccar: ${res.status} ${res.statusText}`);
  }
  return res.json();
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
      const socketUrl = `${protocolo}//${host}/api/socket${TRACCAR_TOKEN ? `?token=${encodeURIComponent(TRACCAR_TOKEN)}` : ''}`;

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
