import type { TraccarDevice, TraccarGeofence, TraccarGroup } from '../live/types';
import {
  getTraccarToken,
  buildTraccarUrl,
  getTraccarHeaders,
  fetchTraccarJson,
} from '../shared/services/traccarClient';
import { obtenerDispositivosTraccar, obtenerGeocercasTraccar } from '../shared/services/traccarCatalog';

export * from './types';

/**
 * Constantes operativas y de conversión para reportes e historial
 */
export const SECONDS_IN_DAY = 86400;
export const SECONDS_PER_MINUTE = 60;
export const MS_PER_SECOND = 1000;
export const METERS_PER_KM = 1000;

export { getTraccarToken, buildTraccarUrl, getTraccarHeaders };
export { obtenerDispositivosTraccar, obtenerGeocercasTraccar };

/* ==========================================================================
   ENTIDAD PROCESADA PARA LA TABLA DE HISTORIAL
   ========================================================================== */

import { obtenerMetadatos } from '../live/metadata';
import type {
  ItemHistorial,
  TraccarReportTrip,
  TraccarReportStop,
  TraccarReportGeofence,
  TraccarReportSummary,
  TraccarPositionPoint,
} from './types';
export type { ItemHistorial };

/* ==========================================================================
   HELPERS DE CONVERSIÓN Y TIEMPO (CORRECCIÓN DE ERROR DE 4000 HORAS)
   ========================================================================== */

/**
 * Calcula con precisión matemática la duración en segundos de un viaje o parada.
 *
 * CRÍTICO: Corrige el fallo donde Traccar serializa duration en milisegundos (ms),
 * lo que provocaba que 4 horas (14,400,000 ms) se dividieran entre 60 resultando en 4,000 horas.
 *
 * Siempre prioriza la diferencia directa entre endTime y startTime.
 */
export function obtenerDuracionSegundos(item: {
  startTime?: string;
  endTime?: string;
  duration?: number;
}): number {
  if (item.startTime && item.endTime) {
    const startMs = new Date(item.startTime).getTime();
    const endMs = new Date(item.endTime).getTime();
    if (!Number.isNaN(startMs) && !Number.isNaN(endMs) && endMs > startMs) {
      return Math.round((endMs - startMs) / MS_PER_SECOND);
    }
  }

  if (item.duration != null && item.duration > 0) {
    // Si supera los segundos de 1 día, indudablemente viene en milisegundos
    return item.duration > SECONDS_IN_DAY
      ? Math.round(item.duration / MS_PER_SECOND)
      : Math.round(item.duration);
  }

  return 0;
}

/* ==========================================================================
   CONSULTAS A LA API DE TRACCAR
   ========================================================================== */

export interface FiltrosReporteTraccar {
  deviceIds: number[];
  from: string; // ISO 8601
  to: string;   // ISO 8601
  geofenceId?: number; // Optimización Push-down: filtra directamente por geocerca en Traccar
}

function armarParamsReporte({ deviceIds, from, to, geofenceId }: FiltrosReporteTraccar): URLSearchParams {
  const params = new URLSearchParams();
  for (const id of deviceIds) {
    params.append('deviceId', String(id));
  }
  if (geofenceId != null) {
    params.set('geofenceId', String(geofenceId));
  }
  params.set('from', from);
  params.set('to', to);
  return params;
}

/**
 * Consulta los viajes detectados por Traccar en el rango de tiempo.
 */
export async function obtenerTripsTraccar(filtros: FiltrosReporteTraccar): Promise<TraccarReportTrip[]> {
  if (!filtros.deviceIds.length) return [];
  const params = armarParamsReporte(filtros);
  const url = buildTraccarUrl(`/api/reports/trips?${params.toString()}`);
  return fetchTraccarJson<TraccarReportTrip[]>(url, { headers: getTraccarHeaders() });
}

/**
 * Consulta las paradas detectadas por Traccar en el rango de tiempo.
 */
export async function obtenerStopsTraccar(filtros: FiltrosReporteTraccar): Promise<TraccarReportStop[]> {
  if (!filtros.deviceIds.length) return [];
  const params = armarParamsReporte(filtros);
  const url = buildTraccarUrl(`/api/reports/stops?${params.toString()}`);
  return fetchTraccarJson<TraccarReportStop[]>(url, { headers: getTraccarHeaders() });
}

/**
 * Consulta los intervalos de permanencia en geocercas en el rango de tiempo.
 */
export async function obtenerGeofenceReportsTraccar(
  filtros: FiltrosReporteTraccar
): Promise<TraccarReportGeofence[]> {
  if (!filtros.deviceIds.length) return [];
  const params = armarParamsReporte(filtros);
  const url = buildTraccarUrl(`/api/reports/geofences?${params.toString()}`);
  return fetchTraccarJson<TraccarReportGeofence[]>(url, { headers: getTraccarHeaders() });
}

/**
 * Consulta el resumen consolidado de Traccar (odómetro y velocidades).
 */
export async function obtenerSummaryTraccar(
  filtros: FiltrosReporteTraccar
): Promise<TraccarReportSummary[]> {
  if (!filtros.deviceIds.length) return [];
  const params = armarParamsReporte(filtros);
  const url = buildTraccarUrl(`/api/reports/summary?${params.toString()}`);
  return fetchTraccarJson<TraccarReportSummary[]>(url, { headers: getTraccarHeaders() });
}

/**
 * Obtiene la ruta histórica detallada de un dispositivo (para visualizar el trazado en el mapa).
 */
export async function obtenerRutaDetalladaTraccar(
  deviceId: number,
  from: string,
  to: string
): Promise<TraccarPositionPoint[]> {
  const params = new URLSearchParams({
    deviceId: String(deviceId),
    from,
    to,
  });
  const url = buildTraccarUrl(`/api/reports/route?${params.toString()}`);
  return fetchTraccarJson<TraccarPositionPoint[]>(url, { headers: getTraccarHeaders() });
}

/* ==========================================================================
   LÓGICA DE PROCESAMIENTO Y CRUCE DE DATOS
   ========================================================================== */

/**
 * Identifica si un dispositivo tiene asignado un sector/geocerca (ej. A1, A2, B1...)
 * a partir de sus atributos o buscando coincidencia de nombre con las geocercas de Traccar.
 */
export function resolverSectorDispositivo(
  device: TraccarDevice,
  geofences: TraccarGeofence[]
): { sectorNombre: string | null; geofenceId: number | null } {
  const rawSector = String(
    device.attributes?.sector ||
    device.attributes?.Sector ||
    device.attributes?.SECTOR ||
    device.attributes?.zona ||
    ''
  ).trim();

  if (!rawSector) {
    return { sectorNombre: null, geofenceId: null };
  }

  // Buscar coincidencia exacta o por subcadena con las geocercas registradas
  const matchGeofence = geofences.find((g) => {
    const gName = String(g.name || '').trim().toLowerCase();
    const sName = rawSector.toLowerCase();
    return gName === sName || gName === `sector ${sName}` || sName === `sector ${gName}`;
  });

  if (matchGeofence) {
    return {
      sectorNombre: matchGeofence.name,
      geofenceId: matchGeofence.id,
    };
  }

  // Si no coincide con un ID de geocerca pero tiene un texto asignado (ej. "A1")
  return {
    sectorNombre: rawSector,
    geofenceId: null,
  };
}

/**
 * Procesa la respuesta rápida de /api/reports/summary cruzándola con la información
 * de dispositivos, geocercas y metadatos (DNI, placa, conductor) para la tabla de Historial.
 * Esto responde en ~150ms eliminando la lentitud extrema de trips/stops/geofences.
 */
export function procesarResumenHistorial({
  devices,
  geofences,
  groups,
  summaries,
  fechaReferencia,
}: {
  devices: TraccarDevice[];
  geofences: TraccarGeofence[];
  groups: TraccarGroup[];
  summaries: TraccarReportSummary[];
  fechaReferencia: string;
}): ItemHistorial[] {
  const metadataMap = obtenerMetadatos();
  const summaryPorDevice = new Map<number, TraccarReportSummary>();
  for (const s of summaries) {
    summaryPorDevice.set(s.deviceId, s);
  }

  const nombrePorGrupoId = new Map(groups.map((g) => [g.id, g.name]));

  const items: ItemHistorial[] = [];
  const KNOTS_TO_KMH = 1.852;

  for (const device of devices) {
    const { sectorNombre, geofenceId } = resolverSectorDispositivo(device, geofences);
    const summary = summaryPorDevice.get(device.id);

    const deviceUniqueIdStr = String(device.uniqueId ?? '');
    const dni = String(
      device.attributes?.dni ??
      device.attributes?.DNI ??
      device.uniqueId ??
      metadataMap[deviceUniqueIdStr]?.dni ??
      ''
    ).trim();

    const placa = String(
      device.attributes?.placa ??
      device.attributes?.Placa ??
      metadataMap[deviceUniqueIdStr]?.placa ??
      ''
    ).trim();

    const conductor = String(
      device.attributes?.conductor ??
      device.attributes?.Conductor ??
      metadataMap[deviceUniqueIdStr]?.conductor ??
      device.name ??
      ''
    ).trim();

    const distanciaM = summary?.distance || 0;
    const distanciaKm = Math.round((distanciaM / METERS_PER_KM) * 10) / 10;

    const inicio = summary?.startTime || null;
    const fin = summary?.endTime || null;

    // Calcular duración activa a partir de startTime y endTime si están disponibles
    let duracionMinutos = 0;
    if (inicio && fin) {
      const startMs = new Date(inicio).getTime();
      const endMs = new Date(fin).getTime();
      if (!Number.isNaN(startMs) && !Number.isNaN(endMs) && endMs > startMs) {
        duracionMinutos = Math.round((endMs - startMs) / (MS_PER_SECOND * SECONDS_PER_MINUTE));
      }
    } else if (summary?.engineHours) {
      duracionMinutos = Math.round(summary.engineHours / (MS_PER_SECOND * SECONDS_PER_MINUTE));
    }

    let velocidadMediaKmh = summary?.averageSpeed
      ? Math.round(summary.averageSpeed * KNOTS_TO_KMH * 10) / 10
      : 0;

    // Si Traccar entregó 0 en velocidad media pero hay distancia y duración conocida
    if (velocidadMediaKmh === 0 && distanciaKm > 0 && duracionMinutos > 0) {
      velocidadMediaKmh = Math.round((distanciaKm / (duracionMinutos / 60)) * 10) / 10;
    }

    const velocidadMaximaKmh = summary?.maxSpeed
      ? Math.round(summary.maxSpeed * KNOTS_TO_KMH * 10) / 10
      : 0;

    const tieneActividad =
      distanciaKm > 0.05 || velocidadMaximaKmh > 0 || duracionMinutos > 0 || Boolean(inicio);

    const grupoNombre = device.groupId != null ? nombrePorGrupoId.get(device.groupId) ?? null : null;
    const base = String(device.attributes?.base || '').trim() || null;

    items.push({
      id: `${device.id}_${fechaReferencia}`,
      deviceId: device.id,
      fecha: fechaReferencia,
      dispositivoNombre: device.name,
      dni,
      placa,
      conductor,
      sectorAsignado: sectorNombre,
      geofenceId,
      grupoNombre,
      base,
      inicio,
      fin,
      distanciaKm,
      velocidadMediaKmh,
      velocidadMaximaKmh,
      duracionMinutos,
      horasMotorMinutos: Math.round((summary?.engineHours || 0) / (MS_PER_SECOND * SECONDS_PER_MINUTE)),
      tieneActividad,
      cargandoGeocercas: false,
    });
  }

  // Ordenar: primero los que tienen actividad, luego por mayor kilometraje y nombre
  return items.sort((a, b) => {
    if (a.tieneActividad && !b.tieneActividad) return -1;
    if (!a.tieneActividad && b.tieneActividad) return 1;
    if (b.distanciaKm !== a.distanciaKm) return b.distanciaKm - a.distanciaKm;
    return a.dispositivoNombre.localeCompare(b.dispositivoNombre, 'es', { numeric: true });
  });
}
