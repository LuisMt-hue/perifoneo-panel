/**
 * Tipos de reportes nativos y entidades procesadas de Traccar para el módulo de Historial.
 */

export interface TraccarReportTrip {
  deviceId: number;
  deviceName: string;
  distance: number; // metros
  averageSpeed: number; // nudos
  maxSpeed: number; // nudos
  spentFuel?: number;
  duration: number; // ms o segundos
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
  startAddress?: string;
  endAddress?: string;
  startLat?: number;
  startLon?: number;
  endLat?: number;
  endLon?: number;
  driverUniqueId?: string;
  driverName?: string;
}

export interface TraccarReportStop {
  deviceId: number;
  deviceName: string;
  duration: number; // ms o segundos
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface TraccarReportGeofence {
  deviceId: number;
  deviceName: string;
  geofenceId: number;
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
}

export interface TraccarReportSummary {
  deviceId: number;
  deviceName: string;
  distance: number; // metros
  maxSpeed: number;
  averageSpeed: number;
  engineHours?: number;
  spentFuel?: number;
  startTime?: string; // ISO 8601
  endTime?: string;   // ISO 8601
}

export interface TraccarPositionPoint {
  id: number;
  deviceId: number;
  fixTime: string;
  valid: boolean;
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  address?: string;
  geofenceIds?: number[];
  attributes?: Record<string, any>;
}

export interface ItemHistorial {
  id: string; // `${deviceId}_${fecha}`
  deviceId: number;
  fecha: string; // Formato YYYY-MM-DD
  dispositivoNombre: string; // Nombre del dispositivo
  dni?: string; // DNI o identificador único
  placa?: string; // Placa de la unidad
  conductor?: string; // Conductor asignado
  sectorAsignado: string | null; // "A1", "A2", etc. o null si no tiene
  geofenceId: number | null;
  distanciaKm: number;    // Kilómetros totales recorridos
  velocidadMediaKmh?: number; // Velocidad promedio en km/h
  velocidadMaximaKmh?: number; // Velocidad máxima en km/h
  duracionMinutos: number; // Tiempo activo total en minutos (motor/movimiento)
  horasMotorMinutos?: number; // Minutos acumulados de motor encendido
  inicio?: string | null; // ISO 8601 del primer viaje (opcional / detalle)
  fin?: string | null;    // ISO 8601 del último viaje (opcional / detalle)
  minutosDentro?: number | null; // Minutos dentro de la geocerca
  minutosFuera?: number | null;  // Minutos fuera de la geocerca
  minutosDetenido?: number; // Minutos totales detenido
  tieneActividad: boolean;
  cargandoGeocercas?: boolean; // True durante cálculo diferido
}

export interface FiltrosReporteTraccar {
  deviceIds: number[];
  geofenceId?: number;
  from: string; // ISO 8601
  to: string;   // ISO 8601
}
