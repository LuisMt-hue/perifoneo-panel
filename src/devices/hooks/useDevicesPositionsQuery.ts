import { useQuery } from '@tanstack/react-query';
import type { TraccarPosition } from '../../live/types';
import { obtenerPosicionesTraccar } from '../../live/api';

/**
 * Posiciones actuales de los dispositivos, solo para calcular el estado
 * (ACTIVO/DETENIDO/DESCONECTADO) en la tabla de administración. A diferencia de Live,
 * esta vista no necesita WebSocket ni alta frecuencia — es un snapshot que se refresca
 * cada 45s como respaldo simple.
 */
export const DEVICES_POSITIONS_QUERY_KEY = ['devicesPositions'] as const;
const POSITIONS_STALE_TIME_MS = 30_000;
const POSITIONS_REFETCH_INTERVAL_MS = 45_000;

export function useDevicesPositionsQuery() {
  return useQuery({
    queryKey: DEVICES_POSITIONS_QUERY_KEY,
    queryFn: async () => {
      const posiciones = await obtenerPosicionesTraccar();
      const porDispositivo: Record<number, TraccarPosition> = {};
      for (const p of posiciones) porDispositivo[p.deviceId] = p;
      return porDispositivo;
    },
    staleTime: POSITIONS_STALE_TIME_MS,
    refetchInterval: POSITIONS_REFETCH_INTERVAL_MS,
    refetchIntervalInBackground: false,
  });
}
