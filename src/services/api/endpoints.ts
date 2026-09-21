import { apiClient } from './client';
import type {
  CredencialesLogin,
  RespuestaLogin,
  Usuario,
  CambiarPasswordDTO,
} from '../../types/auth.types';
import type {
  Sector,
  Dispositivo,
  PerifoneadorVivo,
  SesionRecorrido,
  ResumenPerifoneador,
  ResumenSector,
  RegistroAuditoria,
} from '../../types/perifoneo.types';
import type {
  FiltrosSesiones,
  FiltrosResumen,
  ParametrosRecalcular,
  CrearUsuarioDTO,
  ActualizarUsuarioDTO,
  DetalleRecorridoRespuesta,
  MensajeRespuesta,
  EstadoSaludRespuesta,
} from '../../types/api.types';

/**
 * Módulo de Endpoints del Sistema de Monitoreo de Perifoneo.
 *
 * Expone funciones fuertemente tipadas para interactuar con la API REST del backend.
 * Todos los métodos retornan promesas tipadas y manejan parámetros de búsqueda URL.
 */

/**
 * Construye una cadena de query string a partir de un objeto de parámetros.
 * Omite valores nulos, indefinidos o cadenas vacías.
 */
function buildQuery(params: Record<string, unknown> = {}): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== '') {
      query.append(key, String(value));
    }
  }
  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}

/* ==========================================================================
   1. AUTENTICACIÓN Y PERFIL DE USUARIO
   ========================================================================== */

/**
 * Autentica un usuario con su correo y contraseña.
 * Admite pasar el objeto `CredencialesLogin` o `email` y `password` por separado.
 */
export function login(
  credencialesOrEmail: CredencialesLogin | string,
  password?: string
): Promise<RespuestaLogin> {
  const cuerpo: CredencialesLogin =
    typeof credencialesOrEmail === 'object'
      ? credencialesOrEmail
      : { email: credencialesOrEmail, password: password || '' };

  return apiClient.post<RespuestaLogin>('/auth/login', cuerpo);
}

/**
 * Obtiene los datos del usuario autenticado actual (`GET /api/auth/yo`).
 */
export function obtenerYo(): Promise<Usuario> {
  return apiClient.get<Usuario>('/auth/yo');
}

/**
 * Permite al usuario en sesión actualizar su propia contraseña (`POST /api/auth/cambiar-password`).
 */
export function cambiarPassword(nueva: string): Promise<MensajeRespuesta> {
  const dto: CambiarPasswordDTO = { nueva };
  return apiClient.post<MensajeRespuesta>('/auth/cambiar-password', dto);
}

/* ==========================================================================
   2. CONSULTAS OPERATIVAS Y MONITOREO
   ========================================================================== */

/**
 * Comprueba el estado de salud de la API y conteos de base de datos (`GET /api/salud`).
 */
export function obtenerSalud(): Promise<EstadoSaludRespuesta> {
  return apiClient.get<EstadoSaludRespuesta>('/salud');
}

/**
 * Obtiene el listado de sectores geográficos con sus geometrías GeoJSON (`GET /api/sectores`).
 */
export function obtenerSectores(): Promise<Sector[]> {
  return apiClient.get<Sector[]>('/sectores');
}

/**
 * Obtiene la lista de perifoneadores/dispositivos registrados con su sector (`GET /api/dispositivos`).
 */
export function obtenerDispositivos(): Promise<Dispositivo[]> {
  return apiClient.get<Dispositivo[]>('/dispositivos');
}

/**
 * Obtiene las posiciones más recientes y estados de los perifoneadores (`GET /api/vivo`).
 */
export function obtenerVivo(): Promise<PerifoneadorVivo[]> {
  return apiClient.get<PerifoneadorVivo[]>('/vivo');
}

/** Alias para compatibilidad */
export const obtenerEnVivo = obtenerVivo;

/**
 * Consulta el listado de recorridos detectados aplicando filtros de fecha y persona (`GET /api/sesiones`).
 */
export function obtenerSesiones(params: FiltrosSesiones = {}): Promise<SesionRecorrido[]> {
  return apiClient.get<SesionRecorrido[]>(`/sesiones${buildQuery(params as Record<string, unknown>)}`);
}

/**
 * Obtiene la ruta completa punto por punto de un recorrido específico (`GET /api/sesiones/:id/ruta`).
 */
export function obtenerRuta(id: number | string): Promise<DetalleRecorridoRespuesta> {
  return apiClient.get<DetalleRecorridoRespuesta>(`/sesiones/${id}/ruta`);
}

/**
 * Obtiene el resumen estadístico acumulado por perifoneador (`GET /api/resumen`).
 */
export function obtenerResumen(params: FiltrosResumen = {}): Promise<ResumenPerifoneador[]> {
  return apiClient.get<ResumenPerifoneador[]>(`/resumen${buildQuery(params as Record<string, unknown>)}`);
}

/** Alias para compatibilidad con las vistas de reportes */
export const obtenerResumenPerifoneadores = obtenerResumen;

/**
 * Obtiene el resumen consolidado de cobertura por sector geográfico (`GET /api/resumen/sectores`).
 */
export function obtenerResumenSectores(params: FiltrosResumen = {}): Promise<ResumenSector[]> {
  return apiClient.get<ResumenSector[]>(`/resumen/sectores${buildQuery(params as Record<string, unknown>)}`);
}

/* ==========================================================================
   3. ADMINISTRACIÓN (Solo Rol ADMIN)
   ========================================================================== */

/**
 * Reimporta los perifoneadores y geocercas desde el servidor Traccar (`POST /api/admin/importar`).
 */
export function importarDesdeTraccar(): Promise<MensajeRespuesta> {
  return apiClient.post<MensajeRespuesta>('/admin/importar');
}

/**
 * Cierra sesiones inactivas y fuerza el procesamiento de posiciones inmediatas (`POST /api/admin/sincronizar`).
 */
export function forzarSincronizacion(): Promise<MensajeRespuesta> {
  return apiClient.post<MensajeRespuesta>('/admin/sincronizar');
}

/**
 * Reprocesa el cálculo de métricas de recorridos para un rango de fechas (`POST /api/admin/recalcular`).
 */
export function recalcular(body: ParametrosRecalcular): Promise<MensajeRespuesta> {
  return apiClient.post<MensajeRespuesta>('/admin/recalcular', body);
}

/** Alias para compatibilidad */
export const recalcularDatos = recalcular;

/**
 * Lista todos los usuarios registrados en el panel de control (`GET /api/admin/usuarios`).
 */
export function obtenerUsuarios(): Promise<Usuario[]> {
  return apiClient.get<Usuario[]>('/admin/usuarios');
}

/**
 * Crea un nuevo usuario en la base de datos (`POST /api/admin/usuarios`).
 */
export function crearUsuario(body: CrearUsuarioDTO): Promise<Usuario> {
  return apiClient.post<Usuario>('/admin/usuarios', body);
}

/**
 * Actualiza los datos de un usuario existente (`PATCH /api/admin/usuarios/:id`).
 */
export function editarUsuario(id: number | string, body: ActualizarUsuarioDTO): Promise<Usuario> {
  return apiClient.patch<Usuario>(`/admin/usuarios/${id}`, body);
}

/** Alias para compatibilidad */
export const actualizarUsuario = editarUsuario;

/**
 * Asigna la lista de dispositivos que un supervisor tiene autorización de auditar (`PUT /api/admin/usuarios/:id/dispositivos`).
 */
export function asignarDispositivos(
  id: number | string,
  dispositivos: number[]
): Promise<MensajeRespuesta> {
  return apiClient.put<MensajeRespuesta>(`/admin/usuarios/${id}/dispositivos`, { dispositivos });
}

/**
 * Consulta el registro de auditoría de acciones administrativas (`GET /api/admin/auditoria`).
 */
export function obtenerAuditoria(): Promise<RegistroAuditoria[]> {
  return apiClient.get<RegistroAuditoria[]>('/admin/auditoria');
}
