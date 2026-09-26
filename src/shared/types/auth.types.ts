/**
 * Tipos y definiciones del módulo de autenticación y autorización.
 * Cubre credenciales, roles, usuarios y la estructura decodificada de tokens JWT.
 */

/**
 * Roles autorizados en el sistema.
 * - ADMIN: Acceso total, gestión de usuarios, asignación de perifoneadores y recálculo.
 * - SUPERVISOR: Monitoreo en vivo, historial, reproducción y reportes de sus dispositivos asignados.
 */
export type Rol = 'ADMIN' | 'SUPERVISOR';

/**
 * Entidad de Usuario del panel de monitoreo.
 */
export interface Usuario {
  id: number;
  email: string;
  nombre: string;
  rol: Rol;
  activo: boolean;
  /** Identificadores de dispositivos asignados para supervisión (solo supervisores) */
  dispositivos_asignados?: number[];
  administrator?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Estructura de los Claims contenidos en el Payload del token JWT emitido por la API.
 * Cumple con RFC 7519 y los campos personalizados del backend.
 */
export interface JwtCustomPayload {
  /** Identificador único del usuario (claim 'sub' o 'id') */
  id?: number;
  sub?: string | number;
  /** Correo electrónico institucional */
  email?: string;
  /** Nombre completo para mostrar en la interfaz */
  nombre?: string;
  /** Rol asignado para control de acceso basado en roles (RBAC) */
  rol?: Rol;
  /** Timestamp UNIX de expiración (en segundos) */
  exp: number;
  /** Timestamp UNIX de emisión (en segundos) */
  iat?: number;
}

/**
 * Parámetros requeridos para iniciar sesión en la plataforma.
 */
export interface CredencialesLogin {
  email: string;
  password: string;
}

/**
 * Respuesta devuelta por el endpoint de inicio de sesión (`POST /api/auth/login`).
 */
export interface RespuestaLogin {
  /** Token JWT firmado por el servidor con vigencia de hasta 12 horas */
  token: string;
  /** Datos del perfil de usuario autenticado */
  usuario?: Usuario;
  user?: Usuario;
  mensaje?: string;
}

/**
 * Datos requeridos para solicitar cambio de contraseña propia (`POST /api/auth/cambiar-password`).
 */
export interface CambiarPasswordDTO {
  nueva: string;
}

/**
 * Estructura y acciones expuestas por el contexto global de autenticación (`AuthContext`).
 */
export interface AuthContextType {
  /** Usuario actualmente autenticado o null si no hay sesión activa */
  user: Usuario | null;
  /** Token JWT vigente o null */
  token: string | null;
  /** Bandera booleana rápida que indica si hay una sesión válida */
  isAuthenticated: boolean;
  /** Indica si el usuario actual posee el rol de Administrador */
  isAdmin: boolean;
  /** True cuando la sesión se cerró por expiración/invalidez detectada en caliente (401), no por logout manual */
  sessionExpiredFlag: boolean;
  /** Inicia sesión almacenando el token y registrando el usuario */
  login: (token: string, usuario: Usuario) => void;
  /** Cierra la sesión limpiando el almacenamiento y el estado global */
  logout: () => void;
}
