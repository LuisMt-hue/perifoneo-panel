import type { Usuario } from '../../types/auth.types';
import { isTokenExpired } from './jwt';

/**
 * Servicio de Almacenamiento Seguro para Credenciales y Sesión (Token Storage).
 *
 * Encapsula la interacción con `sessionStorage`, garantizando:
 * 1. Acceso centralizado y consistente a las claves 'token' y 'usuario'.
 * 2. Validación proactiva de caducidad: Si un token almacenado expiró,
 *    se purga automáticamente antes de que sea enviado a la API.
 * 3. Patrón observador (listeners) para notificar la expiración de la sesión
 *    de forma desacoplada hacia el contexto de React o componentes interesados.
 */

const TOKEN_KEY = 'perifoneo_auth_token';
const USER_KEY = 'perifoneo_auth_user';

// Claves legadas para compatibilidad con sesiones preexistentes
const LEGACY_TOKEN_KEY = 'token';
const LEGACY_USER_KEY = 'usuario';

type SessionExpiredListener = () => void;
const sessionExpiredListeners = new Set<SessionExpiredListener>();

/**
 * Registra un suscriptor para recibir alertas cuando la sesión expire (ej. por respuesta 401).
 *
 * @param listener Función a ejecutar al expirar la sesión.
 * @returns Función de desuscripción para limpieza en useEffect.
 */
export function onSessionExpired(listener: SessionExpiredListener): () => void {
  sessionExpiredListeners.add(listener);
  return () => {
    sessionExpiredListeners.delete(listener);
  };
}

/**
 * Notifica a todos los suscriptores que la sesión ha vencido.
 */
export function notifySessionExpired(): void {
  sessionExpiredListeners.forEach((listener) => {
    try {
      listener();
    } catch (err) {
      console.error('Error al ejecutar listener de sesión expirada:', err);
    }
  });
}

export const tokenStorage = {
  /**
   * Obtiene el token JWT actual de sessionStorage.
   * Si el token no existe o ya caducó, limpia el almacenamiento y retorna null.
   */
  getToken(): string | null {
    try {
      const token = sessionStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(LEGACY_TOKEN_KEY);

      if (!token) {
        return null;
      }

      // Verificamos si el token almacenado ya expiró
      if (isTokenExpired(token)) {
        this.clear();
        return null;
      }

      return token;
    } catch {
      return null;
    }
  },

  /**
   * Obtiene el objeto del usuario en sesión.
   */
  getUser(): Usuario | null {
    try {
      const rawUser = sessionStorage.getItem(USER_KEY) || sessionStorage.getItem(LEGACY_USER_KEY);
      if (!rawUser) return null;
      return JSON.parse(rawUser) as Usuario;
    } catch {
      return null;
    }
  },

  /**
   * Guarda de forma atómica el token y los datos de perfil del usuario.
   */
  setSession(token: string, usuario: Usuario): void {
    try {
      sessionStorage.setItem(TOKEN_KEY, token);
      sessionStorage.setItem(USER_KEY, JSON.stringify(usuario));

      // Mantener claves de compatibilidad legada
      sessionStorage.setItem(LEGACY_TOKEN_KEY, token);
      sessionStorage.setItem(LEGACY_USER_KEY, JSON.stringify(usuario));
    } catch (err) {
      console.error('No se pudo persistir la sesión en sessionStorage:', err);
    }
  },

  /**
   * Actualiza únicamente los datos del usuario en sesión (sin alterar el token).
   */
  setUser(usuario: Usuario): void {
    try {
      sessionStorage.setItem(USER_KEY, JSON.stringify(usuario));
      sessionStorage.setItem(LEGACY_USER_KEY, JSON.stringify(usuario));
    } catch (err) {
      console.error('No se pudo actualizar el usuario en sessionStorage:', err);
    }
  },

  /**
   * Elimina todas las credenciales de sesión del almacenamiento del navegador.
   */
  clear(): void {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
      sessionStorage.removeItem(LEGACY_TOKEN_KEY);
      sessionStorage.removeItem(LEGACY_USER_KEY);
    } catch (err) {
      console.error('Error al limpiar sessionStorage:', err);
    }
  },

  /**
   * Determina si existe una sesión actualmente válida y no expirada.
   */
  hasValidSession(): boolean {
    const token = this.getToken();
    return Boolean(token && !isTokenExpired(token));
  },
};
