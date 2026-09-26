import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { TraccarPosition } from '../types';
import { obtenerPosicionesTraccar } from '../api';
import { mergePositionsByFixTime } from '../utils/positionsMerge';

/**
 * Posiciones en vivo por dispositivo. Es el único dato de alta frecuencia del módulo:
 * el WebSocket (ver useLiveRealtimeSync) es la vía principal de actualización y escribe
 * directamente en esta cache; el polling aquí configurado es solo el respaldo cuando
 * el socket está caído, y se apaga por completo si la pestaña no está visible.
 */
export const LIVE_POSITIONS_QUERY_KEY = ['livePositions'] as const;
export const POLLING_FALLBACK_INTERVAL_MS = 15000;
const POSITIONS_STALE_TIME_MS = 5000;

export function useLivePositionsQuery(socketConectado: boolean, pestanaVisible: boolean) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: LIVE_POSITIONS_QUERY_KEY,
    queryFn: async () => {
      const arr = await obtenerPosicionesTraccar();
      const prev =
        queryClient.getQueryData<Record<number, TraccarPosition>>(LIVE_POSITIONS_QUERY_KEY) || {};
      return mergePositionsByFixTime(prev, arr);
    },
    staleTime: POSITIONS_STALE_TIME_MS,
    // Solo se activa el sondeo de respaldo si el socket está caído Y la pestaña está visible
    refetchInterval: !socketConectado && pestanaVisible ? POLLING_FALLBACK_INTERVAL_MS : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}
