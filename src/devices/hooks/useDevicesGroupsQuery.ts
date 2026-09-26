import { useTraccarGroupsQuery } from '../../shared/hooks/useTraccarCatalogQueries';

/**
 * Catálogo de grupos nativos de Traccar para el selector de GRUPO.
 */
export function useDevicesGroupsQuery() {
  return useTraccarGroupsQuery();
}
