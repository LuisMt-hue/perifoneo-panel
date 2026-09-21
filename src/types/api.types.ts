import type { Rol } from './auth.types';
import type { SesionRecorrido, PuntoRecorrido } from './perifoneo.types';

/**
 * Parámetros y DTOs para comunicación con la API REST de Perifoneo.
 */

/**
 * Parámetros de consulta para el listado de recorridos (`GET /api/sesiones`).
 */
export interface FiltrosSesiones {
  /** Fecha inicial de consulta (formato YYYY-MM-DD) */
  desde?: string;
  /** Fecha final de consulta (formato YYYY-MM-DD) */
  hasta?: string;
  /** Identificador de dispositivo específico */
  dispositivo?: number | string;
  /** Identificador de sector geográfico */
  sector?: number | string;
  /** Filtro de estado: EN_CURSO, FINALIZADA o DESCARTADA */
  estado?: string;
  /** Incluir recorridos descartados (por defecto ocultos) */
  incluir_descartadas?: number | boolean;
}

/**
 * Parámetros de filtro para resúmenes estadísticos (`GET /api/resumen` y `GET /api/resumen/sectores`).
 */
export interface FiltrosResumen {
  desde?: string;
  hasta?: string;
}

/**
 * Parámetros para reprocesar el cálculo de métricas (`POST /api/admin/recalcular`).
 */
export interface ParametrosRecalcular {
  desde: string;
  hasta: string;
  dispositivo?: number | string;
}

/**
 * Datos requeridos para crear un nuevo usuario administrativo o supervisor (`POST /api/admin/usuarios`).
 */
export interface CrearUsuarioDTO {
  email: string;
  nombre: string;
  password: string;
  rol: Rol;
}

/**
 * Datos para actualizar un usuario existente (`PATCH /api/admin/usuarios/:id`).
 */
export interface ActualizarUsuarioDTO {
  nombre?: string;
  email?: string;
  password?: string;
  rol?: Rol;
  activo?: boolean;
}

/**
 * Estructura de respuesta del endpoint de detalle de recorrido (`GET /api/sesiones/:id/ruta`).
 */
export interface DetalleRecorridoRespuesta {
  sesion: SesionRecorrido;
  puntos: PuntoRecorrido[];
}

/**
 * Respuesta genérica de éxito o confirmación.
 */
export interface MensajeRespuesta {
  mensaje: string;
  error?: string;
  [key: string]: unknown;
}

/**
 * Información devuelta por el endpoint de salud del sistema (`GET /api/salud`).
 */
export interface EstadoSaludRespuesta {
  estado: string;
  traccar_version?: string;
  dispositivos_count?: number;
  sectores_count?: number;
  timestamp?: string;
}
