import { useState, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { TraccarGeofence, LiveDevice } from '../types';
import { obtenerMetadatos, enriquecerDispositivo } from '../metadata';
import { useLiveDevicesQuery } from './useLiveDevicesQuery';
import { useLiveGeofencesQuery } from './useLiveGeofencesQuery';
import { useLivePositionsQuery, LIVE_POSITIONS_QUERY_KEY } from './useLivePositionsQuery';
import { useLiveRealtimeSync } from './useLiveRealtimeSync';
import {
  TRACCAR_DEVICES_QUERY_KEY,
  TRACCAR_GEOFENCES_QUERY_KEY,
} from '../../shared/hooks/useTraccarCatalogQueries';

export interface UseLiveTrackingReturn {
  devices: LiveDevice[];
  geofences: TraccarGeofence[];
  selectedDeviceId: number | null;
  selectedDevice: LiveDevice | null;
  setSelectedDeviceId: (id: number | null) => void;
  socketConectado: boolean;
  cargando: boolean;
  error: string | null;
  recargar: () => Promise<void>;
  liveTrails: Record<number, [number, number][]>;
}

/**
 * Fachada del módulo Live: compone las queries de catálogo (dispositivos/geocercas,
 * compartidas con Historial/Reportes), la query de posiciones en vivo, y la sincronización
 * en tiempo real por WebSocket (que alimenta la cache de las queries anteriores en vez de
 * mantener su propio estado paralelo).
 */
export function useLiveTracking(): UseLiveTrackingReturn {
  const queryClient = useQueryClient();
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);

  const { socketConectado, liveTrails, pestanaVisible } = useLiveRealtimeSync();
  const devicesQuery = useLiveDevicesQuery();
  const geofencesQuery = useLiveGeofencesQuery();
  const positionsQuery = useLivePositionsQuery(socketConectado, pestanaVisible);

  const metadataMap = useMemo(() => obtenerMetadatos(), []);

  const devices = useMemo(() => {
    const posMap = positionsQuery.data || {};
    return (devicesQuery.data || []).map((d) => enriquecerDispositivo(d, posMap[d.id], metadataMap));
  }, [devicesQuery.data, positionsQuery.data, metadataMap]);

  const selectedDevice = useMemo(() => {
    if (!selectedDeviceId) return null;
    return devices.find((d) => d.id === selectedDeviceId) || null;
  }, [devices, selectedDeviceId]);

  const cargando = devicesQuery.isLoading || geofencesQuery.isLoading;

  const error = useMemo(() => {
    const err = devicesQuery.error || positionsQuery.error || geofencesQuery.error;
    if (!err) return null;
    return err instanceof Error ? err.message : 'Error al conectar con Traccar';
  }, [devicesQuery.error, positionsQuery.error, geofencesQuery.error]);

  const recargar = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: TRACCAR_DEVICES_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: TRACCAR_GEOFENCES_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: LIVE_POSITIONS_QUERY_KEY }),
    ]);
  }, [queryClient]);

  return {
    devices,
    geofences: geofencesQuery.data || [],
    selectedDeviceId,
    selectedDevice,
    setSelectedDeviceId,
    socketConectado,
    cargando,
    error,
    recargar,
    liveTrails,
  };
}
