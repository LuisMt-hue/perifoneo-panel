import type { TraccarDevice, TraccarPosition, DeviceMetadata, LiveDevice } from './types';
import { calcularEstadoDispositivo } from '../shared/utils/deviceStatus';

const STORAGE_KEY = 'perifoneo_devices_metadata';

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

  const { estado, enLinea, enMovimiento, velocidadKmh, minutosDesdeReporte } = calcularEstadoDispositivo({
    traccarStatus: device.status,
    lastUpdate: device.lastUpdate,
    positionFixTime: position?.fixTime,
    speedKnots: position?.speed,
  });

  // Texto legible del tiempo transcurrido (específico de esta vista)
  let ultimaActualizacion = 'Sin reporte';
  if (position?.fixTime || device.lastUpdate) {
    if (minutosDesdeReporte < 1) {
      ultimaActualizacion = 'Hace un momento';
    } else if (minutosDesdeReporte < 60) {
      ultimaActualizacion = `Hace ${minutosDesdeReporte} min`;
    } else {
      const horas = Math.floor(minutosDesdeReporte / 60);
      ultimaActualizacion = `Hace ${horas} h`;
    }
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
