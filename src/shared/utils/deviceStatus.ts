/**
 * Cálculo puro de estado de un dispositivo (ACTIVO/DETENIDO/DESCONECTADO), compartido
 * entre `live` (mapa en vivo) y `devices` (tabla de administración) para no duplicar
 * los umbrales de negocio en dos archivos.
 */

export const KNOTS_TO_KMH = 1.852;
export const ONLINE_THRESHOLD_MINUTES = 10;
export const ACTIVE_STATUS_THRESHOLD_MINUTES = 15;
export const MOVEMENT_SPEED_THRESHOLD_KMH = 3;

export type EstadoDispositivo = 'ACTIVO' | 'DETENIDO' | 'DESCONECTADO';

export interface DeviceStatusInput {
  traccarStatus?: string;
  /** `device.lastUpdate` — usado solo si no hay posición disponible */
  lastUpdate?: string;
  /** `position?.fixTime` */
  positionFixTime?: string;
  /** `position?.speed` en nudos, como lo entrega Traccar */
  speedKnots?: number;
}

export interface DeviceStatusResult {
  estado: EstadoDispositivo;
  enLinea: boolean;
  enMovimiento: boolean;
  velocidadKmh: number;
  minutosDesdeReporte: number;
}

export function calcularEstadoDispositivo(input: DeviceStatusInput): DeviceStatusResult {
  const velocidadKmh = Math.round((input.speedKnots ?? 0) * KNOTS_TO_KMH);

  const fechaHoraStr = input.positionFixTime || input.lastUpdate;
  let minutosDesdeReporte = 9999;

  if (fechaHoraStr) {
    const fechaReporte = new Date(fechaHoraStr).getTime();
    const ahora = Date.now();
    const diffMs = Math.max(0, ahora - fechaReporte);
    minutosDesdeReporte = Math.floor(diffMs / (1000 * 60));
  }

  const enLinea = input.traccarStatus === 'online' || minutosDesdeReporte <= ONLINE_THRESHOLD_MINUTES;
  const enMovimiento = velocidadKmh >= MOVEMENT_SPEED_THRESHOLD_KMH;

  let estado: EstadoDispositivo = 'DESCONECTADO';
  if (enLinea && minutosDesdeReporte <= ACTIVE_STATUS_THRESHOLD_MINUTES) {
    estado = enMovimiento ? 'ACTIVO' : 'DETENIDO';
  }

  return { estado, enLinea, enMovimiento, velocidadKmh, minutosDesdeReporte };
}
