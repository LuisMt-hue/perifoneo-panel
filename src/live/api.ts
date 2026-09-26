import type { TraccarPosition, TraccarDevice } from './types';
import {
  getTraccarToken,
  buildTraccarUrl,
  getTraccarHeaders,
  fetchTraccarJson,
} from '../shared/services/traccarClient';
import { obtenerDispositivosTraccar, obtenerGeocercasTraccar } from '../shared/services/traccarCatalog';

/**
 * Constantes de conexión y reintento del WebSocket del módulo Live.
 * Backoff exponencial con jitter para no martillar el servidor si Traccar
 * está caído o hay muchos paneles reconectando a la vez.
 */
export const WS_RECONNECT_BASE_MS = 1000;
export const WS_RECONNECT_MAX_MS = 30000;

export { getTraccarToken, buildTraccarUrl, getTraccarHeaders };
export { obtenerDispositivosTraccar, obtenerGeocercasTraccar };

/**
 * Obtiene las últimas posiciones registradas para todos los dispositivos.
 */
export async function obtenerPosicionesTraccar(): Promise<TraccarPosition[]> {
  const url = buildTraccarUrl('/api/positions');
  return fetchTraccarJson<TraccarPosition[]>(url, { headers: getTraccarHeaders() });
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
  /** Se dispara si no hay token de sesión: el socket no llega ni a intentar conectar. */
  onNoAuth?: () => void;
  /** Se dispara si un mensaje del socket no se puede parsear como JSON. */
  onParseError?: (raw: string, error: unknown) => void;
}

function calcularDelayReconexion(intentos: number): number {
  const base = Math.min(WS_RECONNECT_MAX_MS, WS_RECONNECT_BASE_MS * 2 ** intentos);
  return base * (0.5 + Math.random() * 0.5); // jitter para evitar reconexiones sincronizadas
}

/**
 * Establece conexión en tiempo real vía WebSocket con Traccar (`/api/socket`).
 * Gestiona reconexión automática con backoff exponencial y emisión de eventos
 * de posiciones y dispositivos. Sin token de sesión válido, no intenta conectar.
 */
export function conectarSocketTraccar(handlers: SocketHandlers): () => void {
  let ws: WebSocket | null = null;
  let reintentarTimeout: any = null;
  let estaCerradoManualmente = false;
  let intentosReconexion = 0;

  const conectar = () => {
    if (estaCerradoManualmente) return;

    const token = getTraccarToken();
    if (!token) {
      handlers.onNoAuth?.();
      return;
    }

    try {
      let socketUrl: string;

      const traccarEnv = import.meta.env.VITE_TRACCAR_URL as string | undefined;
      if (traccarEnv && (traccarEnv.startsWith('http://') || traccarEnv.startsWith('https://'))) {
        try {
          const u = new URL(traccarEnv);
          const wsProto = u.protocol === 'https:' ? 'wss:' : 'ws:';
          socketUrl = `${wsProto}//${u.host}/api/socket?token=${encodeURIComponent(token)}`;
        } catch {
          const protocolo = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          socketUrl = `${protocolo}//${window.location.host}/api/socket?token=${encodeURIComponent(token)}`;
        }
      } else {
        const protocolo = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        socketUrl = `${protocolo}//${window.location.host}/api/socket?token=${encodeURIComponent(token)}`;
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
        intentosReconexion = 0;
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
          handlers.onParseError?.(event.data, e);
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
        const delay = calcularDelayReconexion(intentosReconexion++);
        console.log(`[LiveSocket] Socket cerrado. Reintentando conexión en ${Math.round(delay / 1000)}s...`);
        reintentarTimeout = setTimeout(conectar, delay);
      };
    } catch (err) {
      if (estaCerradoManualmente) return;
      console.error('[LiveSocket] Error al inicializar WebSocket:', err);
      const delay = calcularDelayReconexion(intentosReconexion++);
      reintentarTimeout = setTimeout(conectar, delay);
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
