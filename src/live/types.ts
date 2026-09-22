/**
 * Tipos de datos para el módulo Live conectado directamente a Traccar.
 */

export interface TraccarDevice {
  id: number;
  name: string;
  uniqueId: string; // En este proyecto corresponde al DNI
  status: 'online' | 'offline' | 'unknown' | string;
  disabled?: boolean;
  lastUpdate?: string;
  positionId?: number;
  groupId?: number;
  phone?: string;
  model?: string;
  contact?: string;
  category?: string;
  attributes?: Record<string, any>;
}

export interface TraccarPosition {
  id: number;
  deviceId: number;
  protocol?: string;
  serverTime?: string;
  deviceTime?: string;
  fixTime: string;
  outdated?: boolean;
  valid: boolean;
  latitude: number;
  longitude: number;
  altitude?: number;
  speed: number; // En nudos (Traccar) o km/h
  course: number; // Rumbo en grados (0 a 360)
  address?: string;
  accuracy?: number;
  network?: any;
  geofenceIds?: number[];
  attributes?: {
    batteryLevel?: number;
    battery?: number;
    charge?: boolean;
    motion?: boolean;
    ignition?: boolean;
    distance?: number;
    totalDistance?: number;
    [key: string]: any;
  };
}

export interface TraccarGeofence {
  id: number;
  name: string;
  description?: string;
  area: string; // Formato WKT: POLYGON(...) o CIRCLE(...)
  calendarId?: number;
  attributes?: {
    color?: string;
    speedLimit?: number;
    hide?: boolean;
    [key: string]: any;
  };
}

/**
 * Metadatos locales para enriquecer la información que Traccar no posee.
 * Se cruzan por DNI (uniqueId).
 */
export interface DeviceMetadata {
  dni: string;
  placa?: string;
  conductor?: string;
  telefono?: string;
  sector?: string;
  categoria?: string;
  notas?: string;
}

export type EstadoDispositivoLive = 'ACTIVO' | 'DETENIDO' | 'DESCONECTADO';

/**
 * Dispositivo completamente enriquecido para la interfaz de monitoreo en vivo.
 */
export interface LiveDevice {
  // Datos base Traccar
  id: number;
  name: string;
  uniqueId: string; // DNI
  traccarStatus: string;
  
  // Posición
  lat: number | null;
  lon: number | null;
  velocidadKmh: number;
  rumbo: number;
  ultimaActualizacion: string;
  minutosDesdeReporte: number;
  enLinea: boolean;
  
  // Estado calculado
  estado: EstadoDispositivoLive;
  
  // Telemetría
  bateria: number | null;
  enCarga: boolean;
  enMovimiento: boolean;
  
  // Metadatos cruzados (por DNI)
  placa: string;
  conductor: string;
  telefono: string;
  sector: string;
  categoria: string;
  
  // Referencias originales
  rawDevice: TraccarDevice;
  rawPosition?: TraccarPosition;
}

export interface LiveFilterState {
  busqueda: string;
  ocultarDesconectados: boolean;
  estadoFiltro: 'TODOS' | 'ACTIVOS' | 'DETENIDOS' | 'DESCONECTADOS';
  geofenceId: number | 'TODOS';
  sectorFiltro: string | 'TODOS';
}
