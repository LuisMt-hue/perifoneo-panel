import { useState, useEffect, useMemo, useCallback } from 'react';
import type { TraccarDevice, TraccarPosition, TraccarGeofence, LiveDevice } from '../types';
import {
  obtenerDispositivosTraccar,
  obtenerPosicionesTraccar,
  obtenerGeocercasTraccar,
  conectarSocketTraccar,
} from '../api';
import { obtenerMetadatos, enriquecerDispositivo } from '../metadata';

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
 * Constantes de rastreo en tiempo real y sondeo de respaldo
 */
export const MAX_LIVE_TRAIL_POINTS = 150;
export const POLLING_FALLBACK_INTERVAL_MS = 15000;

export function useLiveTracking(): UseLiveTrackingReturn {
  const [devicesMap, setDevicesMap] = useState<Record<number, TraccarDevice>>({});
  const [positionsMap, setPositionsMap] = useState<Record<number, TraccarPosition>>({});
  const [geofences, setGeofences] = useState<TraccarGeofence[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
  const [socketConectado, setSocketConectado] = useState<boolean>(false);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [liveTrails, setLiveTrails] = useState<Record<number, [number, number][]>>({});

  // Mapa de metadatos complementarios por DNI
  const metadataMap = useMemo(() => obtenerMetadatos(), []);

  // Carga inicial de datos desde Traccar
  const recargar = useCallback(async () => {
    try {
      setError(null);
      const [devs, poss, geos] = await Promise.all([
        obtenerDispositivosTraccar(),
        obtenerPosicionesTraccar(),
        obtenerGeocercasTraccar(),
      ]);

      const devObj: Record<number, TraccarDevice> = {};
      for (const d of devs) devObj[d.id] = d;

      const posObj: Record<number, TraccarPosition> = {};
      const trailsInit: Record<number, [number, number][]> = {};
      for (const p of poss) {
        posObj[p.deviceId] = p;
        if (p.latitude && p.longitude) {
          trailsInit[p.deviceId] = [[p.latitude, p.longitude]];
        }
      }

      setDevicesMap(devObj);
      setPositionsMap(posObj);
      setLiveTrails(trailsInit);
      setGeofences(geos);
    } catch (err: any) {
      console.error('[useLiveTracking] Error cargando datos iniciales:', err);
      setError(err.message || 'Error al conectar con Traccar');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  // Conexión WebSocket para actualizaciones en vivo
  useEffect(() => {
    const desconectar = conectarSocketTraccar({
      onOpen: () => setSocketConectado(true),
      onClose: () => setSocketConectado(false),
      onError: () => setSocketConectado(false),
      onDevices: (nuevosDispositivos) => {
        setDevicesMap((prev) => {
          const next = { ...prev };
          for (const d of nuevosDispositivos) {
            next[d.id] = { ...(prev[d.id] || {}), ...d };
          }
          return next;
        });
      },
      onPositions: (nuevasPosiciones) => {
        setPositionsMap((prev) => {
          const next = { ...prev };
          for (const p of nuevasPosiciones) {
            next[p.deviceId] = p;
          }
          return next;
        });

        // Registrar coordenadas en el rastro en tiempo real
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
    });

    return desconectar;
  }, []);

  // Polling de respaldo automático si el WebSocket no está conectado
  useEffect(() => {
    if (socketConectado) return;

    const interval = setInterval(async () => {
      try {
        const ultimasPos = await obtenerPosicionesTraccar();
        setPositionsMap((prev) => {
          const next = { ...prev };
          for (const p of ultimasPos) {
            next[p.deviceId] = p;
          }
          return next;
        });
      } catch {
        // Fallback silencioso en segundo plano
      }
    }, POLLING_FALLBACK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [socketConectado]);

  // Fusión y enriquecimiento de dispositivos
  const devices = useMemo(() => {
    return Object.values(devicesMap).map((d) => {
      const pos = positionsMap[d.id];
      return enriquecerDispositivo(d, pos, metadataMap);
    });
  }, [devicesMap, positionsMap, metadataMap]);

  // Dispositivo seleccionado actualmente
  const selectedDevice = useMemo(() => {
    if (!selectedDeviceId) return null;
    return devices.find((d) => d.id === selectedDeviceId) || null;
  }, [devices, selectedDeviceId]);

  return {
    devices,
    geofences,
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
