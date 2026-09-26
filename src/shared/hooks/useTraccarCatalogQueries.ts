import { useQuery } from '@tanstack/react-query';
import { obtenerDispositivosTraccar, obtenerGeocercasTraccar, obtenerGruposTraccar } from '../services/traccarCatalog';

/**
 * Catálogo de dispositivos/geocercas: cambia poco, se comparte entre Live, Historial y Reportes
 * bajo las mismas queryKeys para que TanStack Query deduplique las peticiones al servidor
 * de Traccar sin importar qué módulo las disparó primero.
 */
export const CATALOG_STALE_TIME_MS = 10 * 60 * 1000;

export const TRACCAR_DEVICES_QUERY_KEY = ['traccarDevices'] as const;
export const TRACCAR_GEOFENCES_QUERY_KEY = ['traccarGeofences'] as const;
export const TRACCAR_GROUPS_QUERY_KEY = ['traccarGroups'] as const;

export function useTraccarDevicesQuery() {
  return useQuery({
    queryKey: TRACCAR_DEVICES_QUERY_KEY,
    queryFn: obtenerDispositivosTraccar,
    staleTime: CATALOG_STALE_TIME_MS,
  });
}

export function useTraccarGeofencesQuery() {
  return useQuery({
    queryKey: TRACCAR_GEOFENCES_QUERY_KEY,
    queryFn: obtenerGeocercasTraccar,
    staleTime: CATALOG_STALE_TIME_MS,
  });
}

export function useTraccarGroupsQuery() {
  return useQuery({
    queryKey: TRACCAR_GROUPS_QUERY_KEY,
    queryFn: obtenerGruposTraccar,
    staleTime: CATALOG_STALE_TIME_MS,
  });
}
