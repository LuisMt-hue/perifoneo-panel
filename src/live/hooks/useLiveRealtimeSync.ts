import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { TraccarDevice, TraccarPosition } from '../types';
import { conectarSocketTraccar } from '../api';
import { mergePositionsByFixTime } from '../utils/positionsMerge';
import { LIVE_POSITIONS_QUERY_KEY } from './useLivePositionsQuery';
import { TRACCAR_DEVICES_QUERY_KEY } from '../../shared/hooks/useTraccarCatalogQueries';
import { useDocumentVisibility } from '../../shared/hooks/useDocumentVisibility';
import { onSessionExpired } from '../../shared/services/tokenStorage';

/**
 * Ciclo de vida del WebSocket en tiempo real: en vez de mantener estado propio,
 * escribe directamente en la cache de TanStack Query (dispositivos y posiciones),
 * para que el resto del módulo consuma una única fuente de verdad.
 *
 * Se pausa por completo (sin conectar ni reconectar) cuando la pestaña no está
 * visible, y no reintenta si la sesión se invalidó a mitad de uso.
 */
export const MAX_LIVE_TRAIL_POINTS = 150;

export interface UseLiveRealtimeSyncReturn {
  socketConectado: boolean;
  liveTrails: Record<number, [number, number][]>;
  pestanaVisible: boolean;
}

export function useLiveRealtimeSync(): UseLiveRealtimeSyncReturn {
  const queryClient = useQueryClient();
  const [socketConectado, setSocketConectado] = useState(false);
  const [liveTrails, setLiveTrails] = useState<Record<number, [number, number][]>>({});
  const pestanaVisible = useDocumentVisibility();
  const esPrimerMontaje = useRef(true);

  useEffect(() => {
    if (!pestanaVisible) {
      setSocketConectado(false);
      return;
    }

    const desconectar = conectarSocketTraccar({
      onOpen: () => setSocketConectado(true),
      onClose: () => setSocketConectado(false),
      onError: () => setSocketConectado(false),
      onNoAuth: () => setSocketConectado(false),
      onDevices: (nuevosDispositivos) => {
        queryClient.setQueryData<TraccarDevice[]>(TRACCAR_DEVICES_QUERY_KEY, (old = []) => {
          const map = new Map(old.map((d) => [d.id, d]));
          for (const d of nuevosDispositivos) {
            map.set(d.id, { ...map.get(d.id), ...d });
          }
          return Array.from(map.values());
        });
      },
      onPositions: (nuevasPosiciones) => {
        queryClient.setQueryData<Record<number, TraccarPosition>>(
          LIVE_POSITIONS_QUERY_KEY,
          (old = {}) => mergePositionsByFixTime(old, nuevasPosiciones)
        );

        setLiveTrails((prev) => {
          let changed = false;
          const next = { ...prev };
          for (const p of nuevasPosiciones) {
            if (p.latitude && p.longitude) {
              const prevPoints = next[p.deviceId] || [];
              const last = prevPoints[prevPoints.length - 1];
              if (!last || last[0] !== p.latitude || last[1] !== p.longitude) {
                next[p.deviceId] = [...prevPoints.slice(-MAX_LIVE_TRAIL_POINTS), [p.latitude, p.longitude]];
                changed = true;
              }
            }
          }
          return changed ? next : prev;
        });
      },
      onParseError: (raw, err) => {
        console.warn('[LiveSocket] Mensaje no procesable:', raw, err);
      },
    });

    return desconectar;
  }, [queryClient, pestanaVisible]);

  // Al volver a estar visible (no en el montaje inicial), refrescar posiciones sin esperar el próximo tick
  useEffect(() => {
    if (pestanaVisible) {
      if (!esPrimerMontaje.current) {
        queryClient.invalidateQueries({ queryKey: LIVE_POSITIONS_QUERY_KEY });
      }
      esPrimerMontaje.current = false;
    }
  }, [pestanaVisible, queryClient]);

  // Si la sesión se invalida a mitad de uso (401 detectado en una petición REST), reflejar desconexión
  useEffect(() => onSessionExpired(() => setSocketConectado(false)), []);

  return { socketConectado, liveTrails, pestanaVisible };
}
