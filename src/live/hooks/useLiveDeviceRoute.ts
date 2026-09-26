import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import L from 'leaflet';
import { obtenerRecorridoTraccar } from '../api';
import type { LiveDevice } from '../types';

const ROUTE_STALE_TIME_MS = 30_000;
const ROUTE_REFETCH_INTERVAL_MS = 20_000;

function inicioDeHoyIso(): string {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return hoy.toISOString();
}

export interface UseLiveDeviceRouteReturn {
  rutaDispositivo: [number, number][];
  cargandoRuta: boolean;
  distanciaTotalKm: number;
}

/**
 * Recorrido "de hoy" del dispositivo seleccionado, para la vista de "recorrido en tiempo real"
 * del mapa. Se refresca cada 20s mientras el panel esté activo (en vez de cargarse una sola vez
 * y luego solo apendizar la posición en vivo localmente), y se fusiona con la posición actual
 * del dispositivo para que el trazo llegue hasta el punto más reciente.
 */
export function useLiveDeviceRoute(
  selectedDevice: LiveDevice | null,
  activo: boolean
): UseLiveDeviceRouteReturn {
  const deviceId = selectedDevice?.id ?? null;
  const fechaHoy = useMemo(() => new Date().toDateString(), []);

  const query = useQuery({
    queryKey: ['liveDeviceRoute', deviceId, fechaHoy],
    queryFn: () => obtenerRecorridoTraccar(deviceId as number, inicioDeHoyIso(), new Date().toISOString()),
    enabled: activo && deviceId != null,
    staleTime: ROUTE_STALE_TIME_MS,
    refetchInterval: activo && deviceId != null ? ROUTE_REFETCH_INTERVAL_MS : false,
  });

  const rutaDispositivo = useMemo<[number, number][]>(() => {
    const base: [number, number][] = (query.data || [])
      .filter((p) => p.latitude !== null && p.longitude !== null)
      .map((p) => [p.latitude, p.longitude]);

    if (!selectedDevice || selectedDevice.lat === null || selectedDevice.lon === null) {
      return base;
    }

    const ultimo = base[base.length - 1];
    if (!ultimo || ultimo[0] !== selectedDevice.lat || ultimo[1] !== selectedDevice.lon) {
      return [...base, [selectedDevice.lat, selectedDevice.lon]];
    }
    return base;
  }, [query.data, selectedDevice?.lat, selectedDevice?.lon]);

  const distanciaTotalKm = useMemo(() => {
    if (rutaDispositivo.length < 2) return 0;
    let total = 0;
    for (let i = 1; i < rutaDispositivo.length; i++) {
      const [lat1, lon1] = rutaDispositivo[i - 1];
      const [lat2, lon2] = rutaDispositivo[i];
      total += L.latLng(lat1, lon1).distanceTo(L.latLng(lat2, lon2)) / 1000;
    }
    return total;
  }, [rutaDispositivo]);

  return {
    rutaDispositivo,
    cargandoRuta: activo && query.isLoading,
    distanciaTotalKm,
  };
}
