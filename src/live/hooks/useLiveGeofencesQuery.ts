import { useTraccarGeofencesQuery } from '../../shared/hooks/useTraccarCatalogQueries';

/**
 * Catálogo de geocercas para el módulo Live. Reutiliza la queryKey compartida
 * ['traccarGeofences'] para no duplicar peticiones con Historial/Reportes.
 */
export function useLiveGeofencesQuery() {
  return useTraccarGeofencesQuery();
}
