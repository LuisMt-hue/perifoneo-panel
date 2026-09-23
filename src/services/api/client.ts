import { tokenStorage, notifySessionExpired } from '../auth/tokenStorage';

/**
 * Cliente HTTP para la API REST del Panel de Monitoreo de Perifoneo.
 *
 * Características:
 * - Inyección automática de token JWT (`Authorization: Bearer <token>`).
 * - Detección y manejo desacoplado de sesiones expiradas (HTTP 401 Unauthorized).
 * - Manejo seguro de errores con extracción de mensajes descriptivos.
 * - Tipado genérico completo `<T>` en todas las operaciones HTTP.
 */

const API_BASE_URL: string = '/api';

/**
 * Error personalizado para peticiones a la API que incluye código de estado HTTP.
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Ejecuta una petición fetch autenticada contra el backend.
 *
 * @template T Tipo esperado de respuesta devuelta por la API.
 * @param endpoint Ruta del endpoint relativa a la base (ej. '/vivo' o '/sesiones').
 * @param options Opciones estándar de RequestInit de fetch.
 * @returns Promesa con los datos JSON parseados.
 */
async function fetchConToken<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStorage.getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (networkError) {
    throw new ApiError(
      'Error de conexión con el servidor. Verifique su acceso a la red.',
      0,
      networkError
    );
  }

  // Manejo de caducidad o invalidez de credenciales (HTTP 401)
  if (response.status === 401) {
    tokenStorage.clear();
    notifySessionExpired();

    // Redirigir a login de forma no bloqueante si no nos encontramos ya en /login
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      window.location.href = '/login?expirada=1';
    }

    throw new ApiError('Tu sesión expiró. Por favor inicia sesión nuevamente.', 401);
  }

  // Manejo de otros estados de error HTTP
  if (!response.ok) {
    let mensajeError = `Error en la petición (código ${response.status})`;
    let cuerpoError: unknown = null;

    try {
      const errorJson = await response.json();
      cuerpoError = errorJson;
      if (typeof errorJson === 'object' && errorJson !== null) {
        mensajeError =
          (errorJson as Record<string, string>).error ||
          (errorJson as Record<string, string>).mensaje ||
          mensajeError;
      }
    } catch {
      mensajeError = response.statusText || mensajeError;
    }

    throw new ApiError(mensajeError, response.status, cuerpoError);
  }

  // Parseo seguro de respuesta JSON
  const text = await response.text();
  if (!text || text.trim() === '') {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch (parseError) {
    throw new ApiError('Respuesta con formato no válido del servidor', response.status, parseError);
  }
}

/**
 * Objeto cliente HTTP con métodos REST tipados.
 */
export const apiClient = {
  /** Petición GET */
  get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return fetchConToken<T>(endpoint, { ...options, method: 'GET' });
  },

  /** Petición POST con serialización JSON automática */
  post<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return fetchConToken<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  /** Petición PATCH para actualizaciones parciales */
  patch<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return fetchConToken<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  /** Petición PUT para reemplazos completos */
  put<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return fetchConToken<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  /** Petición DELETE */
  del<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return fetchConToken<T>(endpoint, { ...options, method: 'DELETE' });
  },
};
