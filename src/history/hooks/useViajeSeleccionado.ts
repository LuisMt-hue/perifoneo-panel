import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { obtenerRutaDetalladaTraccar, type TraccarReportTrip } from '../api';
import type { PuntoRecorrido } from '../../shared/types/perifoneo.types';

export const KNOTS_TO_KMH = 1.852;
const RUTA_STALE_TIME_MS = 5 * 60 * 1000;

export function tripKey(trip: TraccarReportTrip): string {
  return `${trip.startTime}_${trip.endTime}`;
}

/**
 * Selección de un viaje del sidebar + carga diferida de su recorrido punto-a-punto.
 * NO se pide nada a /api/reports/route hasta que hay un viaje seleccionado (`enabled`),
 * y el rango pedido es el startTime/endTime exacto del viaje, no el día/rango completo.
 */
export function useViajeSeleccionado(deviceId: number, trips: TraccarReportTrip[], geofenceId: number | null) {
  const [selectedTripKey, setSelectedTripKey] = useState<string | null>(null);

  const selectedTrip = useMemo(
    () => trips.find((t) => tripKey(t) === selectedTripKey) ?? null,
    [trips, selectedTripKey]
  );

  const rutaQuery = useQuery({
    queryKey: ['traccarRutaViaje', deviceId, selectedTrip?.startTime, selectedTrip?.endTime],
    enabled: Boolean(deviceId && selectedTrip),
    queryFn: () => obtenerRutaDetalladaTraccar(deviceId, selectedTrip!.startTime, selectedTrip!.endTime),
    staleTime: RUTA_STALE_TIME_MS,
  });

  const puntos: PuntoRecorrido[] = useMemo(() => {
    return (rutaQuery.data || []).map((pt) => {
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
  }, [rutaQuery.data, geofenceId]);

  const selectTrip = (trip: TraccarReportTrip | null) => {
    setSelectedTripKey(trip ? tripKey(trip) : null);
  };

  return {
    selectedTrip,
    selectedTripKey,
    selectTrip,
    puntos,
    cargandoRuta: rutaQuery.isLoading,
  };
}
