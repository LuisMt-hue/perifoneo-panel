import type { TraccarDevice, TraccarPosition, TraccarGeofence } from './types';
import {
  getTraccarToken,
  buildTraccarUrl,
  getTraccarHeaders,
  fetchTraccarJson,
} from '../shared/services/traccarClient';

/**
 * Constantes de conexión y reintento para el módulo Live
 */
export const WS_RECONNECT_DELAY_MS = 5000;

export { getTraccarToken, buildTraccarUrl, getTraccarHeaders };

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
      const token = getTraccarToken();
      let socketUrl: string;

      const traccarEnv = import.meta.env.VITE_TRACCAR_URL as string | undefined;
      if (traccarEnv && (traccarEnv.startsWith('http://') || traccarEnv.startsWith('https://'))) {
        try {
          const u = new URL(traccarEnv);
          const wsProto = u.protocol === 'https:' ? 'wss:' : 'ws:';
          socketUrl = `${wsProto}//${u.host}/api/socket${token ? `?token=${encodeURIComponent(token)}` : ''}`;
        } catch {
          const protocolo = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          socketUrl = `${protocolo}//${window.location.host}/api/socket${token ? `?token=${encodeURIComponent(token)}` : ''}`;
        }
      } else {
        const protocolo = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        socketUrl = `${protocolo}//${window.location.host}/api/socket${token ? `?token=${encodeURIComponent(token)}` : ''}`;
      }

      ws = new WebSocket(socketUrl);

      ws.onopen = () => {
        if (estaCerradoManualmente) {
          try {
            ws?.close();
          } catch {
            // Ignorar
          }
          return;
        }
        console.log('[LiveSocket] Conectado en tiempo real a Traccar WebSocket');
        handlers.onOpen?.();
      };

      ws.onmessage = (event) => {
        if (estaCerradoManualmente) return;
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
        if (estaCerradoManualmente) return;
        console.warn('[LiveSocket] Error en conexión WebSocket:', err);
        handlers.onError?.(err);
      };

      ws.onclose = () => {
        if (estaCerradoManualmente) return;
        handlers.onClose?.();
        console.log(`[LiveSocket] Socket cerrado. Reintentando conexión en ${WS_RECONNECT_DELAY_MS / 1000}s...`);
        reintentarTimeout = setTimeout(conectar, WS_RECONNECT_DELAY_MS);
      };
    } catch (err) {
      if (estaCerradoManualmente) return;
      console.error('[LiveSocket] Error al inicializar WebSocket:', err);
      reintentarTimeout = setTimeout(conectar, WS_RECONNECT_DELAY_MS);
    }
  };

  conectar();

  return () => {
    estaCerradoManualmente = true;
    if (reintentarTimeout) {
      clearTimeout(reintentarTimeout);
      reintentarTimeout = null;
    }
    if (ws) {
      // Desasociar listeners para que no se emitan advertencias ni cambios de estado durante el desmontaje
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;

      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      } else if (ws.readyState === WebSocket.CONNECTING) {
        // En navegadores modernos, llamar a ws.close() mientras el socket está en CONNECTING
        // produce el error en consola: "WebSocket is closed before the connection is established."
        // Al esperar a que se complete el handshake inicial, se cierra limpiamente sin advertencias rojas.
        ws.onopen = () => {
          try {
            ws?.close();
          } catch {
            // Ignorar
          }
        };
      }
      ws = null;
    }
  };
}
