import type { JwtCustomPayload } from '../types/auth.types';

/**
 * Servicio de Utilidades para Tokens JWT (JSON Web Tokens - RFC 7519).
 *
 * Un token JWT está compuesto por 3 partes separadas por puntos (.):
 * 1. Header (Encabezado): Algoritmo y tipo de token.
 * 2. Payload (Carga útil): Claims o declaraciones de identidad y expiración.
 * 3. Signature (Firma): Garantiza la integridad del token (validada por el servidor).
 *
 * En el cliente, no verificamos la firma criptográfica (esa tarea corresponde exclusivamente
 * a la API con su clave secreta), pero sí decodificamos el payload para:
 * - Conocer la identidad del usuario y su rol de forma reactiva.
 * - Comprobar si el token ya expiró (`exp`) ANTES de realizar una petición HTTP,
 *   evitando llamadas innecesarias a la red con credenciales vencidas.
 */

/**
 * Decodifica una cadena en formato Base64URL a texto estándar en formato UTF-8.
 * Reemplaza caracteres `-` y `_` por sus equivalentes Base64 `+` y `/` y completa el padding con `=`.
 *
 * @param base64Url Cadena Base64URL (típicamente el payload del JWT).
 * @returns Cadena de texto decodificada con soporte completo de tildes y caracteres especiales.
 */
function base64UrlDecode(base64Url: string): string {
  // Ajuste de caracteres seguros para URL
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

  // Relleno de padding a múltiplos de 4
  const padding = base64.length % 4;
  if (padding !== 0) {
    base64 += '='.repeat(4 - padding);
  }

  // Decodificación a bytes binarios y posterior conversión a UTF-8
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const decoder = new TextDecoder('utf-8');
  return decoder.decode(bytes);
}

/**
 * Decodifica el Payload de un token JWT de forma segura sin librerías externas.
 *
 * @template T Tipo esperado del objeto payload (por defecto JwtCustomPayload).
 * @param token Cadena JWT completa.
 * @returns El objeto payload parseado o null si el token es inválido o está corrupto.
 */
export function decodeJwt<T = JwtCustomPayload>(token: string | null | undefined): T | null {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const partes = token.trim().split('.');
  if (partes.length !== 3) {
    // Un JWT legítimo siempre consta exactamente de 3 partes
    return null;
  }

  try {
    const payloadJson = base64UrlDecode(partes[1]);
    return JSON.parse(payloadJson) as T;
  } catch (error) {
    console.warn('No se pudo decodificar el payload del token JWT:', error);
    return null;
  }
}

/**
 * Obtiene los claims personalizados del usuario contenidos en el token JWT.
 *
 * @param token Token JWT
 * @returns Datos del usuario o null si no es válido
 */
export function getJwtClaims(token: string | null | undefined): JwtCustomPayload | null {
  return decodeJwt<JwtCustomPayload>(token);
}

/**
 * Obtiene la fecha exacta de expiración del token JWT como objeto Date.
 *
 * @param token Cadena JWT
 * @returns Fecha de expiración o null si no contiene el claim 'exp'
 */
export function getTokenExpirationDate(token: string | null | undefined): Date | null {
  const payload = decodeJwt<JwtCustomPayload>(token);
  if (!payload || typeof payload.exp !== 'number') {
    return null;
  }

  // El claim 'exp' de JWT está expresado en segundos UNIX; Date requiere milisegundos
  return new Date(payload.exp * 1000);
}

/**
 * Determina si un token JWT ya ha caducado o está a punto de caducar.
 *
 * @param token Cadena JWT a evaluar.
 * @param bufferSegundos Margen de seguridad en segundos (por defecto 30 segundos).
 * Si faltan menos de `bufferSegundos` para que el token expire, se considerará expirado
 * para evitar que una petición expire en pleno tránsito de red.
 * @returns True si el token expiró o es inválido; False si sigue siendo válido.
 */
export function isTokenExpired(token: string | null | undefined, bufferSegundos = 30): boolean {
  if (!token) return true;

  // 1. Intentar decodificar como JWT RFC 7519 estándar
  const payload = decodeJwt<JwtCustomPayload>(token);
  if (payload && typeof payload.exp === 'number') {
    const ahoraEnSegundos = Math.floor(Date.now() / 1000);
    return payload.exp <= ahoraEnSegundos + bufferSegundos;
  }

  // 2. Intentar decodificar como token de Traccar con payload base64 embebido (contiene propiedad 'e' con fecha ISO)
  const eyIndex = token.lastIndexOf('ey');
  if (eyIndex !== -1) {
    try {
      const raw = token.slice(eyIndex);
      const decoded = JSON.parse(base64UrlDecode(raw));
      if (decoded && decoded.e) {
        const expDate = new Date(decoded.e);
        if (!isNaN(expDate.getTime())) {
          return expDate.getTime() <= Date.now() + bufferSegundos * 1000;
        }
      }
    } catch {
      // Ignorar error de parseo y continuar
    }
  }

  // Si es un token no vacío sin fecha de expiración explícita, no considerarlo expirado de antemano
  return false;
}

/**
 * Calcula los segundos restantes de vida útil del token.
 *
 * @param token Cadena JWT
 * @returns Segundos restantes (0 si ya expiró o es inválido)
 */
export function getTimeUntilExpiration(token: string | null | undefined): number {
  const payload = decodeJwt<JwtCustomPayload>(token);
  if (!payload || typeof payload.exp !== 'number') {
    return 0;
  }

  const ahoraEnSegundos = Math.floor(Date.now() / 1000);
  const restante = payload.exp - ahoraEnSegundos;
  return restante > 0 ? restante : 0;
}
