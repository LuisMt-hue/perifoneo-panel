import { formatInTimeZone } from 'date-fns-tz';
import type { TraccarDevice, TraccarGeofence } from '../live/types';
import type { ResumenPerifoneador, ResumenSector } from '../shared/types/perifoneo.types';
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
export const ZONA_LIMA = 'America/Lima';
export const SECONDS_IN_DAY = 86400;
export const SECONDS_PER_MINUTE = 60;
export const MS_PER_SECOND = 1000;
export const METERS_PER_KM = 1000;

export { getTraccarToken, buildTraccarUrl, getTraccarHeaders };
export { obtenerDispositivosTraccar, obtenerGeocercasTraccar };

/* ==========================================================================
   TIPOS DE REPORTES NATIVOS DE TRACCAR
   ========================================================================== */

export interface TraccarReportTrip {
  deviceId: number;
  deviceName: string;
  distance: number; // en metros
  averageSpeed: number; // nudos
  maxSpeed: number; // nudos
  spentFuel?: number;
  duration: number; // duración (en ms o segundos según versión)
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
  duration: number; // duración (en ms o segundos según versión)
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

/* ==========================================================================
   ENTIDAD PROCESADA PARA LA TABLA DE HISTORIAL
   ========================================================================== */

import { obtenerMetadatos } from '../live/metadata';
import type { ItemHistorial } from './types';
export type { ItemHistorial };

/* ==========================================================================
   HELPERS DE CONVERSIÓN Y TIEMPO (CORRECCIÓN DE ERROR DE 4000 HORAS)
   ========================================================================== */

/**
 * Extrae la fecha en formato 'YYYY-MM-DD' en la zona horaria de Tacna/Lima.
 */
export function obtenerFechaLocal(isoString?: string | null): string {
  if (!isoString) return '';
  try {
    return formatInTimeZone(new Date(isoString), ZONA_LIMA, 'yyyy-MM-dd');
  } catch {
    return '';
  }
}

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
  summaries,
  fechaReferencia,
}: {
  devices: TraccarDevice[];
  geofences: TraccarGeofence[];
  summaries: TraccarReportSummary[];
  fechaReferencia: string;
}): ItemHistorial[] {
  const metadataMap = obtenerMetadatos();
  const summaryPorDevice = new Map<number, TraccarReportSummary>();
  for (const s of summaries) {
    summaryPorDevice.set(s.deviceId, s);
  }

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

/**
 * Transforma y consolida las respuestas nativas de Traccar en filas auditadas para la tabla.
 *
 * Ahora agrupa por (Dispositivo, Fecha) de modo que el campo `fecha` esté presente y exacto,
 * permitiendo auditar jornadas diarias aun cuando se selecciona un rango de fechas.
 */
export function procesarHistorialDispositivos({
  devices,
  geofences,
  trips,
  stops,
  geofenceIntervals,
  fechaReferencia,
}: {
  devices: TraccarDevice[];
  geofences: TraccarGeofence[];
  trips: TraccarReportTrip[];
  stops: TraccarReportStop[];
  geofenceIntervals?: TraccarReportGeofence[];
  summaries?: TraccarReportSummary[];
  fechaReferencia?: string; // Fecha por defecto si no hay actividad
}): ItemHistorial[] {
  const tieneGeocercasCargadas = geofenceIntervals !== undefined;

  // 1. Indexar viajes por clave: `${deviceId}__${fecha}`
  const tripsPorDeviceYFecha = new Map<string, TraccarReportTrip[]>();
  // Conjunto de fechas con actividad por dispositivo
  const fechasPorDevice = new Map<number, Set<string>>();

  for (const trip of trips) {
    const f = obtenerFechaLocal(trip.startTime);
    if (!f) continue;
    const key = `${trip.deviceId}__${f}`;
    const list = tripsPorDeviceYFecha.get(key) || [];
    list.push(trip);
    tripsPorDeviceYFecha.set(key, list);

    const s = fechasPorDevice.get(trip.deviceId) || new Set<string>();
    s.add(f);
    fechasPorDevice.set(trip.deviceId, s);
  }

  // 2. Indexar paradas por clave: `${deviceId}__${fecha}`
  const stopsPorDeviceYFecha = new Map<string, TraccarReportStop[]>();
  for (const stop of stops) {
    const f = obtenerFechaLocal(stop.startTime);
    if (!f) continue;
    const key = `${stop.deviceId}__${f}`;
    const list = stopsPorDeviceYFecha.get(key) || [];
    list.push(stop);
    stopsPorDeviceYFecha.set(key, list);

    const s = fechasPorDevice.get(stop.deviceId) || new Set<string>();
    s.add(f);
    fechasPorDevice.set(stop.deviceId, s);
  }

  // 3. Indexar intervalos de geocerca por clave: `${deviceId}__${fecha}`
  const geofencesPorDeviceYFecha = new Map<string, TraccarReportGeofence[]>();
  if (geofenceIntervals) {
    for (const interval of geofenceIntervals) {
      const f = obtenerFechaLocal(interval.startTime);
      if (!f) continue;
      const key = `${interval.deviceId}__${f}`;
      const list = geofencesPorDeviceYFecha.get(key) || [];
      list.push(interval);
      geofencesPorDeviceYFecha.set(key, list);
    }
  }

  const items: ItemHistorial[] = [];
  const fechaFallback = fechaReferencia || obtenerFechaLocal(new Date().toISOString());

  for (const device of devices) {
    const { sectorNombre, geofenceId } = resolverSectorDispositivo(device, geofences);
    const fechasActivas = fechasPorDevice.get(device.id);
    const requiereGeocercas = sectorNombre !== null;

    // Si el dispositivo tuvo actividad en una o más fechas del rango
    if (fechasActivas && fechasActivas.size > 0) {
      // Ordenar fechas cronológicamente descendente (más reciente primero)
      const listaFechas = Array.from(fechasActivas).sort((a, b) => b.localeCompare(a));

      for (const fecha of listaFechas) {
        const key = `${device.id}__${fecha}`;
        const deviceTrips = tripsPorDeviceYFecha.get(key) || [];
        const deviceStops = stopsPorDeviceYFecha.get(key) || [];
        const deviceGeoIntervals = geofencesPorDeviceYFecha.get(key) || [];

        // Calcular inicio y fin del día
        let inicio: string | null = null;
        let fin: string | null = null;

        if (deviceTrips.length > 0) {
          deviceTrips.sort(
            (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          );
          inicio = deviceTrips[0].startTime;
          fin = deviceTrips[deviceTrips.length - 1].endTime;
        } else if (deviceStops.length > 0) {
          deviceStops.sort(
            (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          );
          inicio = deviceStops[0].startTime;
          fin = deviceStops[deviceStops.length - 1].endTime;
        }

        // Duración activa en segundos (utilizando el cálculo preciso en segundos)
        const duracionSegundosTrips = deviceTrips.reduce(
          (acc, t) => acc + obtenerDuracionSegundos(t),
          0
        );
        const duracionMinutos = Math.round(duracionSegundosTrips / SECONDS_PER_MINUTE);

        // Tiempo detenido en segundos
        const duracionSegundosStops = deviceStops.reduce(
          (acc, s) => acc + obtenerDuracionSegundos(s),
          0
        );
        const minutosDetenido = Math.round(duracionSegundosStops / SECONDS_PER_MINUTE);

        // Distancia total en km
        const distanciaMetrosTrips = deviceTrips.reduce((acc, t) => acc + (t.distance || 0), 0);
        const distanciaKm = distanciaMetrosTrips / METERS_PER_KM;

        // Cálculo de Minutos Dentro y Minutos Fuera (o diferido si es Fase 1)
        let minutosDentro: number | null = null;
        let minutosFuera: number | null = null;
        const cargandoGeocercas = requiereGeocercas && !tieneGeocercasCargadas;

        if (requiereGeocercas && tieneGeocercasCargadas) {
          let totalSegundosDentro = 0;

          for (const interval of deviceGeoIntervals) {
            const intervalGeofence = geofences.find((g) => g.id === interval.geofenceId);
            const coincideId = geofenceId !== null && interval.geofenceId === geofenceId;
            const coincideNombre =
              intervalGeofence &&
              String(intervalGeofence.name || '').trim().toLowerCase() === sectorNombre.toLowerCase();

            if (coincideId || coincideNombre) {
              const segs = obtenerDuracionSegundos(interval);
              totalSegundosDentro += segs;
            }
          }

          minutosDentro = Math.round(totalSegundosDentro / SECONDS_PER_MINUTE);
          minutosFuera = Math.max(0, duracionMinutos - minutosDentro);
        }

        items.push({
          id: `${device.id}_${fecha}`,
          deviceId: device.id,
          fecha,
          dispositivoNombre: device.name,
          sectorAsignado: sectorNombre,
          geofenceId,
          inicio,
          fin,
          duracionMinutos,
          minutosDentro,
          minutosFuera,
          minutosDetenido,
          distanciaKm,
          tieneActividad: true,
          cargandoGeocercas,
        });
      }
    } else {
      // Dispositivo sin actividad en el rango
      items.push({
        id: `${device.id}_${fechaFallback}`,
        deviceId: device.id,
        fecha: fechaFallback,
        dispositivoNombre: device.name,
        sectorAsignado: sectorNombre,
        geofenceId,
        inicio: null,
        fin: null,
        duracionMinutos: 0,
        minutosDentro: sectorNombre !== null ? 0 : null,
        minutosFuera: sectorNombre !== null ? 0 : null,
        minutosDetenido: 0,
        distanciaKm: 0,
        tieneActividad: false,
        cargandoGeocercas: false,
      });
    }
  }

  // Ordenar: primero los que tienen actividad, luego por fecha descendente y luego por nombre
  return items.sort((a, b) => {
    if (a.tieneActividad && !b.tieneActividad) return -1;
    if (!a.tieneActividad && b.tieneActividad) return 1;
    if (a.fecha !== b.fecha) return b.fecha.localeCompare(a.fecha);
    return a.dispositivoNombre.localeCompare(b.dispositivoNombre, 'es', { numeric: true });
  });
}

/**
 * Inyecta los cálculos de geocercas (Fase 2) sobre los items previamente procesados en Fase 1.
 * Esto permite un renderizado ultra-rápido sin recrear los objetos de viajes y paradas.
 */
export function enriquecerHistorialConGeocercas({
  items,
  geofences,
  geofenceIntervals,
}: {
  items: ItemHistorial[];
  geofences: TraccarGeofence[];
  geofenceIntervals: TraccarReportGeofence[];
}): ItemHistorial[] {
  // Indexar intervalos por key: `${deviceId}__${fecha}`
  const geofencesPorDeviceYFecha = new Map<string, TraccarReportGeofence[]>();
  for (const interval of geofenceIntervals) {
    const f = obtenerFechaLocal(interval.startTime);
    if (!f) continue;
    const key = `${interval.deviceId}__${f}`;
    const list = geofencesPorDeviceYFecha.get(key) || [];
    list.push(interval);
    geofencesPorDeviceYFecha.set(key, list);
  }

  return items.map((item) => {
    if (!item.sectorAsignado) {
      return { ...item, cargandoGeocercas: false };
    }

    const key = `${item.deviceId}__${item.fecha}`;
    const deviceGeoIntervals = geofencesPorDeviceYFecha.get(key) || [];
    let totalSegundosDentro = 0;

    for (const interval of deviceGeoIntervals) {
      const intervalGeofence = geofences.find((g) => g.id === interval.geofenceId);
      const coincideId = item.geofenceId !== null && interval.geofenceId === item.geofenceId;
      const coincideNombre =
        intervalGeofence &&
        String(intervalGeofence.name || '').trim().toLowerCase() === item.sectorAsignado.toLowerCase();

      if (coincideId || coincideNombre) {
        const segs = obtenerDuracionSegundos(interval);
        totalSegundosDentro += segs;
      }
    }

    const minutosDentro = Math.round(totalSegundosDentro / SECONDS_PER_MINUTE);
    const minutosFuera = Math.max(0, item.duracionMinutos - minutosDentro);

    return {
      ...item,
      minutosDentro,
      minutosFuera,
      cargandoGeocercas: false,
    };
  });
}

/* ==========================================================================
   CACHÉ EN MEMORIA PARA JORNADAS PASADAS (0 ms de respuesta)
   ========================================================================== */

const cacheHistorialFechas = new Map<string, ItemHistorial[]>();

export function generarClaveCacheHistorial(
  fechaInicio: string,
  fechaFin: string,
  deviceIds: number[],
  geofenceId?: number
): string {
  return `${fechaInicio}_${fechaFin}_${deviceIds.slice().sort().join(',')}_${geofenceId ?? 'all'}`;
}

export function obtenerHistorialCache(key: string): ItemHistorial[] | null {
  return cacheHistorialFechas.get(key) || null;
}

export function guardarHistorialCache(key: string, data: ItemHistorial[]): void {
  // Solo se cachean resultados si no están cargando geocercas
  const terminado = data.every((it) => !it.cargandoGeocercas);
  if (terminado) {
    cacheHistorialFechas.set(key, data);
  }
}

/* ==========================================================================
   CONSULTAS DE RESUMEN CONSOLIDADO (REPORTES DIRECTOS DE TRACCAR)
   ========================================================================== */

/**
 * Genera el resumen consolidado acumulado por perifoneador consultando directamente Traccar.
 */
export async function obtenerResumenPerifoneadoresTraccar(
  fechaInicio: string,
  fechaFin: string
): Promise<ResumenPerifoneador[]> {
  const devices = await obtenerDispositivosTraccar();
  if (!devices.length) return [];
  const geofences = await obtenerGeocercasTraccar();
  const deviceIds = devices.map((d) => d.id);

  const from = formatInTimeZone(new Date(`${fechaInicio}T00:00:00`), ZONA_LIMA, "yyyy-MM-dd'T'00:00:00XXX");
  const to = formatInTimeZone(new Date(`${fechaFin}T23:59:59.999`), ZONA_LIMA, "yyyy-MM-dd'T'23:59:59XXX");

  const [trips, stops, geofenceIntervals] = await Promise.all([
    obtenerTripsTraccar({ deviceIds, from, to }),
    obtenerStopsTraccar({ deviceIds, from, to }),
    obtenerGeofenceReportsTraccar({ deviceIds, from, to }),
  ]);

  const items = procesarHistorialDispositivos({
    devices,
    geofences,
    trips,
    stops,
    geofenceIntervals,
  });

  return devices.map((device) => {
    const { sectorNombre } = resolverSectorDispositivo(device, geofences);
    const deviceItems = items.filter((i) => i.deviceId === device.id && i.tieneActividad);

    const recorridos = deviceItems.length;
    const diasActivos = new Set(deviceItems.map((i) => i.fecha)).size;
    const minutosTotales = deviceItems.reduce((acc, i) => acc + i.duracionMinutos, 0);
    const minutosDentro = deviceItems.reduce((acc, i) => acc + (i.minutosDentro || 0), 0);
    const minutosDetenido = deviceItems.reduce((acc, i) => acc + (i.minutosDetenido || 0), 0);
    const kmTotales = deviceItems.reduce((acc, i) => acc + i.distanciaKm, 0);

    const horasTotales = Math.round((minutosTotales / 60) * 100) / 100;
    const horasDentro = Math.round((minutosDentro / 60) * 100) / 100;
    const horasDetenido = Math.round((minutosDetenido / 60) * 100) / 100;
    const pctDentro = minutosTotales > 0 ? Math.round((minutosDentro / minutosTotales) * 100) : 0;

    let ultimaActividad: string | undefined = undefined;
    for (const it of deviceItems) {
      if (it.fin && (!ultimaActividad || it.fin > ultimaActividad)) {
        ultimaActividad = it.fin;
      }
    }

    return {
      id: device.id,
      nombre: device.name,
      dni: (device.attributes?.dni || device.attributes?.DNI || '') as string,
      placa: (device.attributes?.placa || '') as string,
      sector_nombre: sectorNombre || 'Sin sector',
      sector: sectorNombre || 'Sin sector',
      recorridos,
      dias_activos: diasActivos,
      horas_totales: horasTotales,
      horas_dentro: horasDentro,
      horas_detenido: horasDetenido,
      km_total: Math.round(kmTotales * 100) / 100,
      km_totales: Math.round(kmTotales * 100) / 100,
      porcentaje_dentro: pctDentro,
      pct_dentro: pctDentro,
      ultima_actividad: ultimaActividad,
    };
  });
}

/**
 * Genera el resumen consolidado por sector geográfico consultando directamente Traccar.
 */
export async function obtenerResumenSectoresTraccar(
  fechaInicio: string,
  fechaFin: string
): Promise<ResumenSector[]> {
  const devices = await obtenerDispositivosTraccar();
  const geofences = await obtenerGeocercasTraccar();
  if (!geofences.length) return [];
  const deviceIds = devices.map((d) => d.id);

  const from = formatInTimeZone(new Date(`${fechaInicio}T00:00:00`), ZONA_LIMA, "yyyy-MM-dd'T'00:00:00XXX");
  const to = formatInTimeZone(new Date(`${fechaFin}T23:59:59.999`), ZONA_LIMA, "yyyy-MM-dd'T'23:59:59XXX");

  const [trips, stops, geofenceIntervals] = await Promise.all([
    obtenerTripsTraccar({ deviceIds, from, to }),
    obtenerStopsTraccar({ deviceIds, from, to }),
    obtenerGeofenceReportsTraccar({ deviceIds, from, to }),
  ]);

  const items = procesarHistorialDispositivos({
    devices,
    geofences,
    trips,
    stops,
    geofenceIntervals,
  });

  return geofences.map((g) => {
    const gName = String(g.name || '').trim().toLowerCase();
    const itemsEnSector = items.filter((it) => {
      const matchId = it.geofenceId === g.id;
      const matchName = it.sectorAsignado && it.sectorAsignado.toLowerCase() === gName;
      return (matchId || matchName) && it.tieneActividad;
    });

    const personasSet = new Set(itemsEnSector.map((i) => i.deviceId));
    for (const d of devices) {
      const { geofenceId: dGid, sectorNombre: dSname } = resolverSectorDispositivo(d, geofences);
      if (dGid === g.id || (dSname && dSname.toLowerCase() === gName)) {
        personasSet.add(d.id);
      }
    }

    const diasCobertura = new Set(itemsEnSector.map((i) => i.fecha)).size;
    const totalMinutosDentro = itemsEnSector.reduce((acc, i) => acc + (i.minutosDentro || 0), 0);
    const horasDentro = Math.round((totalMinutosDentro / 60) * 100) / 100;

    let ultimaCobertura: string | undefined = undefined;
    for (const it of itemsEnSector) {
      if (it.fin && (!ultimaCobertura || it.fin > ultimaCobertura)) {
        ultimaCobertura = it.fin;
      }
    }

    return {
      id: g.id,
      nombre: g.name,
      personas: personasSet.size,
      recorridos: itemsEnSector.length,
      dias_cobertura: diasCobertura,
      horas_dentro: horasDentro,
      ultima_cobertura: ultimaCobertura,
    };
  });
}

