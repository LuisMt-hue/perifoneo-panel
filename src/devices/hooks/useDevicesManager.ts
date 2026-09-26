import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { TraccarDevice } from '../../live/types';
import type { CreateDevicePayload } from '../types';
import { useDevicesQuery } from './useDevicesQuery';
import { useDevicesGeofencesQuery } from './useDevicesGeofencesQuery';
import { useDevicesGroupsQuery } from './useDevicesGroupsQuery';
import { useDevicesPositionsQuery, DEVICES_POSITIONS_QUERY_KEY } from './useDevicesPositionsQuery';
import { useDevicesEnriched } from './useDevicesEnriched';
import { useDevicesFilters } from './useDevicesFilters';
import { useDevicesSortAndPagination } from './useDevicesSortAndPagination';
import { useDevicesSelection } from './useDevicesSelection';
import { useDeviceMutations } from './useDeviceMutations';
import {
  TRACCAR_DEVICES_QUERY_KEY,
  TRACCAR_GEOFENCES_QUERY_KEY,
  TRACCAR_GROUPS_QUERY_KEY,
} from '../../shared/hooks/useTraccarCatalogQueries';

/**
 * Fachada del módulo Devices: compone las queries de catálogo (dispositivos/geocercas/grupos,
 * compartidas con Live/Historial), la query de posiciones para calcular estado, filtros, orden,
 * paginación, selección y mutations. Análoga a `useLiveTracking.ts` del módulo Live.
 */
export function useDevicesManager() {
  const queryClient = useQueryClient();

  const devicesQuery = useDevicesQuery();
  const geofencesQuery = useDevicesGeofencesQuery();
  const groupsQuery = useDevicesGroupsQuery();
  const positionsQuery = useDevicesPositionsQuery();

  const enriched = useDevicesEnriched(devicesQuery.data, positionsQuery.data, groupsQuery.data);
  const { filters, setFilters, filteredDevices, counts } = useDevicesFilters(enriched);
  const {
    sortConfig,
    onSortChange,
    paginated,
    paginaActual,
    setPaginaActual,
    filasPorPagina,
    setFilasPorPagina,
    totalPaginas,
    totalRegistros,
  } = useDevicesSortAndPagination(filteredDevices);
  const selection = useDevicesSelection(paginated);
  const mutations = useDeviceMutations();

  const [savingCell, setSavingCell] = useState<{ deviceId: number; key: string } | null>(null);
  const [successCell, setSuccessCell] = useState<{ deviceId: number; key: string } | null>(null);
  const [errorInline, setErrorInline] = useState<string | null>(null);
  const [progresoLote, setProgresoLote] = useState<{ actual: number; total: number } | null>(null);

  const cargando = devicesQuery.isLoading || geofencesQuery.isLoading || groupsQuery.isLoading;
  const error = devicesQuery.error instanceof Error ? devicesQuery.error.message : null;

  const recargar = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: TRACCAR_DEVICES_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: TRACCAR_GEOFENCES_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: TRACCAR_GROUPS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: DEVICES_POSITIONS_QUERY_KEY }),
    ]);
  }, [queryClient]);

  const guardarEdicionInline = useCallback(
    async (deviceId: number, key: string, value: any, isAttribute: boolean) => {
      const dev = (devicesQuery.data || []).find((d) => d.id === deviceId);
      if (!dev) return;

      setSavingCell({ deviceId, key });
      setErrorInline(null);
      try {
        await mutations.updateField.mutateAsync({ device: dev, key, value, isAttribute });
        setSuccessCell({ deviceId, key });
        setTimeout(() => setSuccessCell(null), 1500);
      } catch (err: any) {
        console.error('[useDevicesManager] Error guardando celda inline:', err);
        setErrorInline(err.message || 'Error al guardar el cambio.');
      } finally {
        setSavingCell(null);
      }
    },
    [devicesQuery.data, mutations.updateField]
  );

  const crearNuevoDispositivo = useCallback(
    (payload: CreateDevicePayload) => mutations.create.mutateAsync(payload),
    [mutations.create]
  );

  const guardarDispositivoCompleto = useCallback(
    (device: TraccarDevice) => mutations.update.mutateAsync(device),
    [mutations.update]
  );

  const confirmarEliminarDispositivo = useCallback(
    (id: number) => mutations.remove.mutateAsync(id),
    [mutations.remove]
  );

  const bulkEditarCampo = useCallback(
    async (targetIds: number[], fieldOrKey: string, value: any, isAttribute: boolean) => {
      setProgresoLote({ actual: 0, total: targetIds.length });
      try {
        await mutations.bulkEditField.mutateAsync({
          targetIds,
          fieldOrKey,
          value,
          isAttribute,
          onProgress: (actual, total) => setProgresoLote({ actual, total }),
        });
      } finally {
        setProgresoLote(null);
      }
    },
    [mutations.bulkEditField]
  );

  return {
    devices: enriched,
    filteredDevices,
    paginated,
    cargando,
    error,
    recargar,
    filters,
    setFilters,
    counts,
    geofences: geofencesQuery.data || [],
    groups: groupsQuery.data || [],
    ...selection,
    savingCell,
    successCell,
    errorInline,
    setErrorInline,
    guardarEdicionInline,
    crearNuevoDispositivo,
    creandoDispositivo: mutations.create.isPending,
    guardarDispositivoCompleto,
    guardandoDispositivo: mutations.update.isPending,
    confirmarEliminarDispositivo,
    eliminandoDispositivo: mutations.remove.isPending,
    bulkEditarCampo,
    progresoLote,
    sortConfig,
    onSortChange,
    paginaActual,
    setPaginaActual,
    filasPorPagina,
    setFilasPorPagina,
    totalPaginas,
    totalRegistros,
  };
}
