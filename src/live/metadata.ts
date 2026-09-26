import type { TraccarDevice, TraccarPosition, DeviceMetadata, LiveDevice, EstadoDispositivoLive } from './types';

const STORAGE_KEY = 'perifoneo_devices_metadata';

/**
 * Constantes de conversión y umbrales de estado en vivo
 */
export const KNOTS_TO_KMH = 1.852;
export const ONLINE_THRESHOLD_MINUTES = 10;
export const ACTIVE_STATUS_THRESHOLD_MINUTES = 15;
export const MOVEMENT_SPEED_THRESHOLD_KMH = 3;

/**
 * Catálogo inicial de metadatos locales (DNI -> datos complementarios).
 * Si no existen en Traccar, se leen de aquí o de localStorage.
 */
const DEFAULT_METADATA: Record<string, DeviceMetadata> = {
  // Ejemplos precargados o extensibles
};

/**
 * Obtiene el mapa actual de metadatos (combinando memoria y localStorage).
 */
export function obtenerMetadatos(): Record<string, DeviceMetadata> {
  try {
    const guardado = localStorage.getItem(STORAGE_KEY);
    if (guardado) {
      return { ...DEFAULT_METADATA, ...JSON.parse(guardado) };
    }
  } catch (e) {
    console.error('Error al leer metadatos de localStorage:', e);
  }
  return { ...DEFAULT_METADATA };
}

/**
 * Guarda o actualiza metadatos en localStorage para persistencia en el cliente.
 */
export function guardarMetadatos(nuevos: Record<string, DeviceMetadata>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevos));
  } catch (e) {
    console.error('Error al guardar metadatos en localStorage:', e);
  }
}

/**
 * Enriquecer un dispositivo de Traccar con su posición y metadatos cruzados por DNI.
 */
export function enriquecerDispositivo(
  device: TraccarDevice,
  position: TraccarPosition | undefined,
  metadataMap: Record<string, DeviceMetadata>
): LiveDevice {
  const dni = String(device.uniqueId || '').trim();
  const meta = metadataMap[dni] || {};
  const attrs = device.attributes || {};
  const posAttrs = position?.attributes || {};

  // Cálculo de velocidad (Traccar reporta la velocidad en nudos: 1 knot = 1.852 km/h)
  const knots = position?.speed ?? 0;
  const velocidadKmh = Math.round(knots * KNOTS_TO_KMH);

  // Cálculo de tiempo transcurrido
  const fechaHoraStr = position?.fixTime || device.lastUpdate;
  let minutosDesdeReporte = 9999;
  let ultimaActualizacion = 'Sin reporte';

  if (fechaHoraStr) {
    const fechaReporte = new Date(fechaHoraStr).getTime();
    const ahora = Date.now();
    const diffMs = Math.max(0, ahora - fechaReporte);
    minutosDesdeReporte = Math.floor(diffMs / (1000 * 60));

    if (minutosDesdeReporte < 1) {
      ultimaActualizacion = 'Hace un momento';
    } else if (minutosDesdeReporte < 60) {
      ultimaActualizacion = `Hace ${minutosDesdeReporte} min`;
    } else {
      const horas = Math.floor(minutosDesdeReporte / 60);
      ultimaActualizacion = `Hace ${horas} h`;
    }
  }

  // Estado en línea
  const enLinea = device.status === 'online' || minutosDesdeReporte <= ONLINE_THRESHOLD_MINUTES;
  const enMovimiento = velocidadKmh >= MOVEMENT_SPEED_THRESHOLD_KMH;

  // Estado unificado
  let estado: EstadoDispositivoLive = 'DESCONECTADO';
  if (enLinea && minutosDesdeReporte <= ACTIVE_STATUS_THRESHOLD_MINUTES) {
    estado = enMovimiento ? 'ACTIVO' : 'DETENIDO';
  }

  // Nivel de batería
  const bateriaRaw = posAttrs.batteryLevel ?? posAttrs.battery ?? attrs.battery ?? null;
  const bateria = bateriaRaw !== null && !Number.isNaN(Number(bateriaRaw)) ? Number(bateriaRaw) : null;
  const enCarga = Boolean(posAttrs.charge || posAttrs.charging);

  return {
    id: device.id,
    name: device.name,
    uniqueId: dni,
    traccarStatus: device.status,

    lat: position?.latitude ?? null,
    lon: position?.longitude ?? null,
    velocidadKmh,
    rumbo: position?.course ?? 0,
    ultimaActualizacion,
    minutosDesdeReporte,
    enLinea,

    estado,
    bateria,
    enCarga,
    enMovimiento,

    placa: meta.placa || attrs.placa || '',
    conductor: meta.conductor || attrs.conductor || device.contact || device.name,
    telefono: meta.telefono || device.phone || attrs.telefono || '',
    sector: meta.sector || attrs.sector || attrs.sector_asignado || '',
    categoria: meta.categoria || device.category || 'MOTO',

    rawDevice: device,
    rawPosition: position,
  };
}
