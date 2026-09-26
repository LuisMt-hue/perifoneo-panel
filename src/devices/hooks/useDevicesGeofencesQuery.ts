import { useTraccarGeofencesQuery } from '../../shared/hooks/useTraccarCatalogQueries';

/**
 * Catálogo de geocercas para el selector de SECTOR. Reutiliza la queryKey compartida
 * ['traccarGeofences'] para no duplicar peticiones con Live/Historial.
 */
export function useDevicesGeofencesQuery() {
  return useTraccarGeofencesQuery();
}
