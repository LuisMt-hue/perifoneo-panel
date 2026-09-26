import { useEffect, useMemo, useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
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
 * Selección múltiple de viajes del sidebar + carga del recorrido punto-a-punto.
 *
 * Por defecto (al cargar o al cambiar de rango/dispositivo) TODOS los viajes quedan
 * marcados como seleccionados, para que quede claro en la interfaz que se está
 * viendo el rango completo. Deseleccionar viajes reduce el mapa, el resumen
 * (tiempo/km) y el reproductor a la combinación de los que queden marcados —
 * incluyendo la posibilidad de deseleccionar todos, lo que muestra un recorrido
 * vacío (reacciona de verdad a la deselección, en vez de "adivinar" un fallback).
 *
 * Si el rango no tiene viajes registrados (dispositivo detenido todo el día, por
 * ejemplo), no hay nada que seleccionar — se usa el recorrido crudo del rango
 * completo como única fuente, igual que antes.
 *
 * Importante: `useQueries` devuelve un array NUEVO en cada render aunque los datos
 * no hayan cambiado. Sin el `combine` de abajo, `puntos` se recalcularía en cada
 * render, el reproductor recibiría una lista "nueva" constantemente y su efecto de
 * sincronización de posición entraría en un loop infinito de setState (exactamente
 * el error "Maximum update depth exceeded" — y por eso el mapa tampoco dejaba hacer
 * zoom: el fitBounds de la cámara se disparaba en cada render y reseteaba la vista).
 */
export function useViajeSeleccionado(
  deviceId: number,
  trips: TraccarReportTrip[],
  geofenceId: number | null,
  fromISO: string,
  toISO: string
) {
  const [selectedTripKeys, setSelectedTripKeys] = useState<Set<string>>(new Set());

  // Re-sincroniza la selección a "todos" cada vez que cambia el conjunto de viajes
  // (nuevo dispositivo o rango de fechas).
  useEffect(() => {
    setSelectedTripKeys(new Set(trips.map(tripKey)));
  }, [trips]);

  const selectedTrips = useMemo(
    () => trips.filter((t) => selectedTripKeys.has(tripKey(t))),
    [trips, selectedTripKeys]
  );

  const sinViajes = trips.length === 0;

  // Recorrido crudo del rango completo — solo se usa cuando no hay viajes que marcar.
  const rutaRangoQuery = useQuery({
    queryKey: ['traccarRutaRango', deviceId, fromISO, toISO],
    enabled: Boolean(deviceId) && sinViajes,
    queryFn: () => obtenerRutaDetalladaTraccar(deviceId, fromISO, toISO),
    staleTime: RUTA_STALE_TIME_MS,
  });

  // Un recorrido por cada viaje seleccionado, combinados en una única referencia
  // estable vía `combine` (React Query solo la reemplaza si algo realmente cambió).
  const rutasViajes = useQueries({
    queries: selectedTrips.map((trip) => ({
      queryKey: ['traccarRutaViaje', deviceId, trip.startTime, trip.endTime],
      enabled: Boolean(deviceId),
      queryFn: () => obtenerRutaDetalladaTraccar(deviceId, trip.startTime, trip.endTime),
      staleTime: RUTA_STALE_TIME_MS,
    })),
    combine: (results) => ({
      data: results.flatMap((r) => r.data || []),
      isLoading: results.some((r) => r.isLoading),
    }),
  });

  const puntos: PuntoRecorrido[] = useMemo(() => {
    if (sinViajes) {
      return mapearPuntos(rutaRangoQuery.data || [], geofenceId);
    }
    const combinados = mapearPuntos(rutasViajes.data, geofenceId);
    return [...combinados].sort(
      (a, b) => new Date(a.device_time).getTime() - new Date(b.device_time).getTime()
    );
  }, [sinViajes, rutaRangoQuery.data, rutasViajes.data, geofenceId]);

  const toggleTrip = (trip: TraccarReportTrip) => {
    const key = tripKey(trip);
    setSelectedTripKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectAll = () => setSelectedTripKeys(new Set(trips.map(tripKey)));
  const clearSelection = () => setSelectedTripKeys(new Set());

  // Key estable para remontar el reproductor cuando cambia la selección
  const reproductorKey = sinViajes ? 'RANGO' : Array.from(selectedTripKeys).sort().join('|') || 'NINGUNO';

  return {
    selectedTripKeys,
    selectedTrips,
    toggleTrip,
    selectAll,
    clearSelection,
    puntos,
    reproductorKey,
    cargandoRuta: sinViajes ? rutaRangoQuery.isLoading : rutasViajes.isLoading,
  };
}
