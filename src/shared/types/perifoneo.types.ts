import type { Geometry, GeoJsonObject } from 'geojson';

/**
 * Tipos de dominio para el Sistema de Monitoreo de Perifoneo en Tacna.
 * Refleja las entidades de negocio: Sectores, Dispositivos, Sesiones (Recorridos) y Puntos GPS.
 */

/**
 * Entidad Geográfica del Sector de perifoneo.
 * Representa la geocerca asignada en la ciudad de Tacna con su polígono GeoJSON.
 */
export interface Sector {
  id: number;
  nombre: string;
  color?: string;
  /** Polígono en formato GeoJSON para representación en mapa */
  geojson?: GeoJsonObject | Geometry | string | null;
  sector_geojson?: GeoJsonObject | Geometry | string | null;
  geometry?: GeoJsonObject | Geometry | string | null;
  geom?: GeoJsonObject | Geometry | string | null;
  personas_asignadas?: number;
  recorridos_count?: number;
}

/**
 * Entidad del Dispositivo (Perifoneador).
 * Sincronizado desde Traccar con atributos personalizados de campaña.
 */
export interface Dispositivo {
  id: number;
  nombre: string;
  dni?: string;
  placa?: string;
  telefono?: string;
  modelo_celular?: string;
  sector_id?: number | null;
  sector?: string;
  sector_nombre?: string;
  color?: string;
  traccar_id?: number;
}

/**
 * Punto de telemetría GPS capturado durante un recorrido.
 */
export interface PuntoRecorrido {
  /** Timestamp ISO del reporte generado por el dispositivo */
  device_time: string;
  lat: number;
  lon: number;
  /** Velocidad instantánea en km/h */
  velocidad_kmh?: number;
  /**
   * Indicador booleano/numérico:
   * 1 (o true) si el punto se encuentra dentro del sector asignado (incluye tolerancia de 50 m)
   * 0 (o false) si se encuentra fuera del sector.
   */
  dentro_sector: number | boolean;
  /** Nivel porcentual de carga de batería (0-100) */
  bateria_pct?: number;
  /** Precisión del sensor GPS en metros */
  precision_m?: number;
}

/**
 * Estado en tiempo real del perifoneador para el mapa en vivo.
 * - ACTIVO: Último reporte hace menos de 5 minutos (Verde).
 * - DEMORADO: Último reporte entre 5 y 10 minutos (Ámbar).
 * - SIN_SENAL: Sin reportes por más de 10 minutos (Rojo).
 */
export type EstadoEnVivo = 'ACTIVO' | 'DEMORADO' | 'SIN_SENAL';

/**
 * Perifoneador reportando en la vista de monitoreo en vivo (`GET /api/vivo`).
 */
export interface PerifoneadorVivo {
  id: number;
  nombre: string;
  dni?: string;
  telefono?: string;
  placa?: string;
  sector_id?: number | null;
  sector?: string;
  sectorNombre?: string;
  sector_nombre?: string;
  color?: string;
  lat: number;
  latitud?: number;
  lon: number;
  longitud?: number;
  velocidad?: number;
  velocidad_kmh?: number;
  bateria?: number;
  bateria_pct?: number;
  hora?: string;
  ultimo_reporte?: string;
  minutos_sin_reportar?: number;
  estado: EstadoEnVivo | string;
}

/**
 * Registro del historial de auditoría de acciones administrativas.
 */
export interface RegistroAuditoria {
  id?: number;
  fecha: string;
  usuario: string;
  accion: string;
  detalles: string;
}
