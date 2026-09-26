import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { TraccarDevice, TraccarGroup } from '../../live/types';
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

  const [progresoLote, setProgresoLote] = useState<{ actual: number; total: number } | null>(null);
  const [progresoBase, setProgresoBase] = useState<{ actual: number; total: number } | null>(null);

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

  const crearGrupo = useCallback((name: string) => mutations.createGroup.mutateAsync(name), [mutations.createGroup]);

  const renombrarGrupo = useCallback(
    (grupo: TraccarGroup, nuevoNombre: string) => mutations.renameGroup.mutateAsync({ grupo, nuevoNombre }),
    [mutations.renameGroup]
  );

  const eliminarGrupo = useCallback((id: number) => mutations.deleteGroup.mutateAsync(id), [mutations.deleteGroup]);

  const renombrarBase = useCallback(
    async (valorActual: string, nuevoValor: string) => {
      const targetCount = enriched.filter(
        (d) => String(d.attributes?.base || '').trim() === valorActual
      ).length;
      setProgresoBase({ actual: 0, total: targetCount });
      try {
        await mutations.renameBase.mutateAsync({
          valorActual,
          nuevoValor,
          onProgress: (actual, total) => setProgresoBase({ actual, total }),
        });
      } finally {
        setProgresoBase(null);
      }
    },
    [enriched, mutations.renameBase]
  );

  const eliminarBase = useCallback((valorActual: string) => renombrarBase(valorActual, ''), [renombrarBase]);

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
    crearNuevoDispositivo,
    creandoDispositivo: mutations.create.isPending,
    guardarDispositivoCompleto,
    guardandoDispositivo: mutations.update.isPending,
    confirmarEliminarDispositivo,
    eliminandoDispositivo: mutations.remove.isPending,
    bulkEditarCampo,
    progresoLote,
    crearGrupo,
    renombrarGrupo,
    eliminarGrupo,
    renombrarBase,
    eliminarBase,
    progresoBase,
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
