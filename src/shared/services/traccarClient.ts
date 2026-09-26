import { tokenStorage, notifySessionExpired } from './tokenStorage';

/**
 * Cliente HTTP unificado y seguro para el backend de Traccar.
 *
 * Centraliza la resolución de tokens de sesión (sin fallbacks a tokens hardcodeados),
 * construcción de endpoints, cabeceras seguras y validación de respuestas JSON.
 */

/**
 * Obtiene el token activo de Traccar: únicamente el de la sesión del usuario autenticado.
 * Sin sesión válida no existe token, lo que obliga a pasar por el login interactivo
 * antes de poder realizar cualquier petición autenticada.
 */
export function getTraccarToken(): string {
  return tokenStorage.getToken()?.trim() || '';
}

/**
 * Construye la URL para las peticiones REST a Traccar.
 * Utiliza ruta relativa al origen actual para aprovechar el proxy (tanto en Vite dev como en Nginx producción).
 * La autenticación va únicamente por cabecera (`getTraccarHeaders`) y cookie de sesión;
 * el token en query string queda reservado para el WebSocket, que no admite cabeceras personalizadas.
 */
export function buildTraccarUrl(endpoint: string): string {
  return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
}

/**
 * Encabezados HTTP estándar para comunicarse con la API de Traccar.
 */
export function getTraccarHeaders(additionalHeaders?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...additionalHeaders,
  };

  const token = getTraccarToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Realiza una petición HTTP a Traccar y valida que la respuesta sea JSON válido.
 * Si el servidor devuelve HTML o error, emite un mensaje descriptivo y claro.
 */
export async function fetchTraccarJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    ...init,
  });

  if (res.status === 401) {
    tokenStorage.clear();
    notifySessionExpired();
    throw new Error('Sesión de Traccar expirada o inválida. Inicia sesión nuevamente.');
  }

  if (!res.ok) {
    let bodySnippet = '';
    try {
      bodySnippet = await res.text();
    } catch {
      // Ignorar fallo de lectura del cuerpo
    }
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
