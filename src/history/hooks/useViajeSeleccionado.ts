import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { obtenerRutaDetalladaTraccar, type TraccarPositionPoint, type TraccarReportTrip } from '../api';
import type { PuntoRecorrido } from '../../shared/types/perifoneo.types';

export const KNOTS_TO_KMH = 1.852;
const RUTA_STALE_TIME_MS = 5 * 60 * 1000;

export function tripKey(trip: TraccarReportTrip): string {
  return `${trip.startTime}_${trip.endTime}`;
}

function mapearPuntos(raw: TraccarPositionPoint[], geofenceId: number | null): PuntoRecorrido[] {
  return raw.map((pt) => {
    let dentro = true;
    if (geofenceId) {
      dentro = (pt.geofenceIds || []).includes(geofenceId);
    }

    return {
      device_time: pt.fixTime,
      lat: pt.latitude,
      lon: pt.longitude,
      velocidad_kmh: Math.round((pt.speed || 0) * KNOTS_TO_KMH),
      dentro_sector: dentro ? 1 : 0,
      bateria_pct: pt.attributes?.batteryLevel ?? pt.attributes?.battery,
      precision_m: pt.attributes?.accuracy,
    };
  });
}

/**
 * Selección de un viaje del sidebar + carga del recorrido punto-a-punto.
 *
 * Sin ningún viaje marcado, muestra el recorrido completo del rango (`fromISO`–`toISO`).
 * Al marcar un viaje, cambia a cargar solo el tramo exacto de ese viaje
 * (`startTime`/`endTime`) — nunca las dos cosas a la vez.
 */
export function useViajeSeleccionado(
  deviceId: number,
  trips: TraccarReportTrip[],
  geofenceId: number | null,
  fromISO: string,
  toISO: string
) {
  const [selectedTripKey, setSelectedTripKey] = useState<string | null>(null);

  const selectedTrip = useMemo(
    () => trips.find((t) => tripKey(t) === selectedTripKey) ?? null,
    [trips, selectedTripKey]
  );

  // Recorrido completo del rango — solo activo mientras no hay viaje marcado
  const rutaRangoQuery = useQuery({
    queryKey: ['traccarRutaRango', deviceId, fromISO, toISO],
    enabled: Boolean(deviceId) && !selectedTrip,
    queryFn: () => obtenerRutaDetalladaTraccar(deviceId, fromISO, toISO),
    staleTime: RUTA_STALE_TIME_MS,
  });

  // Recorrido de un viaje puntual — solo activo cuando hay uno marcado
  const rutaViajeQuery = useQuery({
    queryKey: ['traccarRutaViaje', deviceId, selectedTrip?.startTime, selectedTrip?.endTime],
    enabled: Boolean(deviceId && selectedTrip),
    queryFn: () => obtenerRutaDetalladaTraccar(deviceId, selectedTrip!.startTime, selectedTrip!.endTime),
    staleTime: RUTA_STALE_TIME_MS,
  });

  const puntos: PuntoRecorrido[] = useMemo(() => {
    const raw = selectedTrip ? rutaViajeQuery.data : rutaRangoQuery.data;
    return mapearPuntos(raw || [], geofenceId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTrip, rutaViajeQuery.data, rutaRangoQuery.data, geofenceId]);

  const selectTrip = (trip: TraccarReportTrip | null) => {
    setSelectedTripKey(trip ? tripKey(trip) : null);
  };

  return {
    selectedTrip,
    selectedTripKey,
    selectTrip,
    puntos,
    cargandoRuta: selectedTrip ? rutaViajeQuery.isLoading : rutaRangoQuery.isLoading,
  };
}
