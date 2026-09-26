import { tokenStorage } from './tokenStorage';

/**
 * Cliente HTTP unificado y seguro para el backend de Traccar.
 *
 * Centraliza la resolución de tokens de sesión (sin fallbacks a tokens hardcodeados),
 * construcción de endpoints, cabeceras seguras y validación de respuestas JSON.
 */

/**
 * Obtiene el token activo de Traccar.
 * Prioridad de resolución:
 * 1. Token de sesión del usuario autenticado en sessionStorage (`tokenStorage.getToken()`).
 * 2. Token configurado en variables de entorno (`import.meta.env.VITE_TRACCAR_TOKEN`).
 * 3. Cadena vacía si no existe token configurado (obliga a autenticación interactiva).
 */
export function getTraccarToken(): string {
  const tokenUsuario = tokenStorage.getToken();
  if (tokenUsuario?.trim()) {
    return tokenUsuario.trim();
  }

  const tokenEnv = import.meta.env.VITE_TRACCAR_TOKEN;
  if (tokenEnv?.trim()) {
    return tokenEnv.trim();
  }

  return '';
}

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
