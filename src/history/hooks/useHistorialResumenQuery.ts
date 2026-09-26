import { useQuery } from '@tanstack/react-query';
import type { TraccarDevice, TraccarGeofence, TraccarGroup } from '../../live/types';
import { obtenerSummaryTraccar, procesarResumenHistorial, type ItemHistorial } from '../api';
import type { HistorialFiltrosState } from './useHistorialFiltros';

export const REPORTS_STALE_TIME_MS = 5 * 60 * 1000; // 5 minutos

interface UseHistorialResumenQueryParams {
  dispositivos: TraccarDevice[];
  geocercas: TraccarGeofence[];
  grupos: TraccarGroup[];
  targetDeviceIds: number[];
  filtros: HistorialFiltrosState;
  cargandoCatalogos: boolean;
}

/**
 * Consulta ultrarrápida de /api/reports/summary cruzada con dispositivos/geocercas/grupos.
 * Extraído tal cual de HistorialRecorridosPage, solo agregando `grupos` al cruce.
 */
export function useHistorialResumenQuery({
  dispositivos,
  geocercas,
  grupos,
  targetDeviceIds,
  filtros,
  cargandoCatalogos,
}: UseHistorialResumenQueryParams) {
  const { fechaInicio, fechaFin } = filtros;

  return useQuery<ItemHistorial[]>({
    queryKey: [
      'traccarHistorialResumen',
      fechaInicio,
      fechaFin,
      targetDeviceIds.join(','),
      dispositivos.length,
      geocercas.length,
      grupos.length,
    ],
    enabled: !cargandoCatalogos && dispositivos.length > 0,
    staleTime: REPORTS_STALE_TIME_MS,
    queryFn: async () => {
      const from = new Date(`${fechaInicio}T00:00:00-05:00`).toISOString();
      const to = new Date(`${fechaFin}T23:59:59.999-05:00`).toISOString();

      const targetDevices =
        targetDeviceIds.length > 0
          ? dispositivos.filter((d) => targetDeviceIds.includes(d.id))
          : dispositivos;

      const deviceIds = targetDevices.map((d) => d.id);
      if (deviceIds.length === 0) return [];

      const summaries = await obtenerSummaryTraccar({ deviceIds, from, to }).catch((err) => {
        console.warn('[Historial] Error en resumen Traccar:', err);
        return [];
      });

      const fechaEtiqueta = fechaInicio === fechaFin ? fechaInicio : `${fechaInicio} al ${fechaFin}`;

      return procesarResumenHistorial({
        devices: targetDevices,
        geofences: geocercas,
        groups: grupos,
        summaries,
        fechaReferencia: fechaEtiqueta,
      });
    },
  });
}
