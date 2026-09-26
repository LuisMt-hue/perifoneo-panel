import { useTraccarDevicesQuery } from '../../shared/hooks/useTraccarCatalogQueries';

/**
 * Catálogo de dispositivos para el módulo Live. Reutiliza la queryKey compartida
 * ['traccarDevices'] para no duplicar peticiones con Historial/Reportes.
 */
export function useLiveDevicesQuery() {
  return useTraccarDevicesQuery();
}
