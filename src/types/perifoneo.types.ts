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
 * Estados de ejecución de un recorrido detectado.
 * - EN_CURSO: El perifoneador está transmitiendo puntos activamente.
 * - FINALIZADA: Recorrido cerrado tras superar el tiempo de inactividad establecido.
 * - DESCARTADA: Recorrido de duración insuficiente (< 10 min) o anómalo.
 */
export type EstadoSesion = 'EN_CURSO' | 'FINALIZADA' | 'DESCARTADA';

/**
 * Estado en tiempo real del perifoneador para el mapa en vivo.
 * - ACTIVO: Último reporte hace menos de 5 minutos (Verde).
 * - DEMORADO: Último reporte entre 5 y 10 minutos (Ámbar).
 * - SIN_SENAL: Sin reportes por más de 10 minutos (Rojo).
 */
export type EstadoEnVivo = 'ACTIVO' | 'DEMORADO' | 'SIN_SENAL';

/**
 * Sesión o Recorrido realizado por un perifoneador.
 * Contiene todas las métricas calculadas por el motor de análisis.
 */
export interface SesionRecorrido {
  id: number;
  fecha: string;
  inicio_at?: string;
  hora_inicio?: string;
  inicio?: string;
  fin_at?: string | null;
  hora_fin?: string | null;
  fin?: string | null;
  estado: EstadoSesion | string;
  /** Tiempo total del recorrido en minutos */
  minutos_totales?: number;
  duracion_minutos?: number;
  /** Tiempo efectivo dentro del polígono asignado (minutos válidos) */
  minutos_dentro?: number;
  minutos_validos?: number;
  /** Tiempo fuera del polígono */
  minutos_fuera?: number;
  /** Tiempo acumulado en detención con velocidad < 3 km/h */
  minutos_detenido?: number;
  minutos_descartados?: number;
  /** Distancia total recorrida en kilómetros */
  km_totales?: number;
  distancia_km?: number;
  /** Kilómetros recorridos dentro del sector */
  km_dentro?: number;
  /** Porcentaje de permanencia dentro del sector (0-100) */
  pct_dentro?: number;
  porcentaje_dentro?: number;
  puntos_count?: number;
  dispositivo_id?: number;
  perifoneador?: string;
  perifoneador_nombre?: string;
  dni?: string;
  placa?: string;
  sector_id?: number;
  sector?: string;
  sector_nombre?: string;
  sector_color?: string;
  sector_geojson?: GeoJsonObject | Geometry | string | null;
}

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
 * Resumen consolidado acumulado por perifoneador para generación de reportes.
 */
export interface ResumenPerifoneador {
  id?: number;
  nombre: string;
  dni?: string;
  placa?: string;
  sector_nombre?: string;
  sector?: string;
  recorridos: number;
  dias_activos: number;
  horas_totales: number;
  horas_dentro: number;
  porcentaje_dentro?: number;
  pct_dentro?: number;
  horas_detenido: number;
  km_total?: number;
  km_totales?: number;
  primera_actividad?: string;
  ultima_actividad?: string;
}

/**
 * Resumen consolidado de cobertura por sector geográfico.
 */
export interface ResumenSector {
  id?: number;
  nombre: string;
  personas: number;
  recorridos: number;
  dias_cobertura: number;
  horas_dentro: number;
  ultima_cobertura?: string;
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
