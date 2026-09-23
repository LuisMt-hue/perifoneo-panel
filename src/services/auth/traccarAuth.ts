import type { Usuario } from '../../types/auth.types';
import { tokenStorage } from './tokenStorage';

/**
 * Servicio de Autenticación nativo contra el backend de Traccar.
 *
 * Utiliza directamente los endpoints oficiales de Traccar:
 * - `POST /api/session`: Iniciar sesión (valida credenciales y genera cookie JSESSIONID).
 * - `GET /api/session`: Comprueba si la sesión o token actual continúa vigente.
 * - `DELETE /api/session`: Cierra la sesión activa en el servidor.
 * - `POST /api/session/token`: Genera un token de sesión reutilizable para API y WebSockets.
 */

export interface TraccarUserResponse {
  id: number;
  name?: string;
  email: string;
  readonly?: boolean;
  administrator?: boolean;
  disabled?: boolean;
  attributes?: Record<string, any>;
  [key: string]: any;
}

export interface LoginCredenciales {
  email: string;
  password: string;
}

export interface LoginResultado {
  user: Usuario;
  token: string;
}

/**
 * Transforma un objeto User devuelto por Traccar a la interfaz Usuario del panel.
 */
export function mapearUsuarioTraccar(traccarUser: TraccarUserResponse): Usuario {
  return {
    id: traccarUser.id,
    email: traccarUser.email,
    nombre: traccarUser.name?.trim() || traccarUser.email.split('@')[0],
    rol: traccarUser.administrator ? 'ADMIN' : 'SUPERVISOR',
    activo: !traccarUser.disabled,
    dispositivos_asignados: [],
  };
}

/**
 * Autentica un usuario contra el backend de Traccar (`POST /api/session`).
 *
 * Envía credenciales usando el formato `application/x-www-form-urlencoded` requerido por Traccar.
 * Si la autenticación es exitosa, intenta obtener un token de sesión permanente vía `/api/session/token`.
 */
export async function loginTraccar(credenciales: LoginCredenciales): Promise<LoginResultado> {
  const params = new URLSearchParams();
  params.append('email', credenciales.email.trim());
  params.append('password', credenciales.password);

  let response: Response;
  try {
    response = await fetch('/api/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: params.toString(),
      credentials: 'include',
    });
  } catch (netErr) {
    throw new Error('No se pudo conectar con el servidor Traccar. Verifique la conexión.');
  }

  if (response.status === 401) {
    throw new Error('Correo o contraseña incorrectos en Traccar.');
  }

  if (!response.ok) {
    let detalle = '';
    try {
      detalle = await response.text();
    } catch {}
    throw new Error(`Error de autenticación Traccar (${response.status}): ${detalle || response.statusText}`);
  }

  const traccarUser = (await response.json()) as TraccarUserResponse;
  const usuario = mapearUsuarioTraccar(traccarUser);

  // Intentar obtener un token de sesión persistente para llamadas subsecuentes y WebSocket
  let sessionToken = '';
  try {
    const tokenRes = await fetch('/api/session/token', {
      method: 'POST',
      headers: {
        Accept: 'text/plain, application/json',
      },
      credentials: 'include',
    });

    if (tokenRes.ok) {
      const tokenText = await tokenRes.text();
      sessionToken = tokenText.trim();
    }
  } catch (tokenErr) {
    console.warn('[TraccarAuth] No se pudo generar token de sesión explícito, se usará cookie de sesión:', tokenErr);
  }

  return {
    user: usuario,
    token: sessionToken,
  };
}

/**
 * Verifica si existe una sesión activa y válida en Traccar (`GET /api/session`).
 *
 * Utiliza tanto las cookies de sesión del navegador (`credentials: 'include'`)
 * como el token almacenado si está disponible.
 */
export async function verificarSesionTraccar(): Promise<Usuario | null> {
  const token = tokenStorage.getToken();
  const url = token ? `/api/session?token=${encodeURIComponent(token)}` : '/api/session';

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    const traccarUser = (await response.json()) as TraccarUserResponse;
    return mapearUsuarioTraccar(traccarUser);
  } catch {
    return null;
  }
}

/**
 * Cierra la sesión activa en el servidor de Traccar (`DELETE /api/session`).
 */
export async function logoutTraccar(): Promise<void> {
  try {
    const token = tokenStorage.getToken();
    const url = token ? `/api/session?token=${encodeURIComponent(token)}` : '/api/session';

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    await fetch(url, {
      method: 'DELETE',
      headers,
      credentials: 'include',
    });
  } catch (err) {
    console.warn('[TraccarAuth] Error al cerrar sesión en Traccar:', err);
  } finally {
    tokenStorage.clear();
  }
}

/**
 * Actualiza la contraseña del usuario en Traccar (`PUT /api/users/{id}`).
 */
export async function cambiarPasswordTraccar(userId: number, nuevaClave: string): Promise<void> {
  const token = tokenStorage.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 1. Obtener los datos actuales del usuario
  const getUrl = token ? `/api/users/${userId}?token=${encodeURIComponent(token)}` : `/api/users/${userId}`;
  const getRes = await fetch(getUrl, {
    method: 'GET',
    headers,
    credentials: 'include',
  });

  if (!getRes.ok) {
    throw new Error('No se pudo verificar la información del usuario en Traccar.');
  }

  const currentUser = await getRes.json();

  // 2. Enviar actualización con la nueva contraseña
  const putRes = await fetch(getUrl, {
    method: 'PUT',
    headers,
    credentials: 'include',
    body: JSON.stringify({
      ...currentUser,
      password: nuevaClave,
    }),
  });

  if (!putRes.ok) {
    let errorDetail = '';
    try {
      errorDetail = await putRes.text();
    } catch {}
    throw new Error(`Error al actualizar contraseña (${putRes.status}): ${errorDetail || putRes.statusText}`);
  }
}
