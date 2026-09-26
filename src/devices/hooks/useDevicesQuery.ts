import { useTraccarDevicesQuery } from '../../shared/hooks/useTraccarCatalogQueries';

/**
 * Catálogo de dispositivos para el módulo Devices. Reutiliza la queryKey compartida
 * ['traccarDevices'] para no duplicar peticiones con Live/Historial.
 */
export function useDevicesQuery() {
  return useTraccarDevicesQuery();
}
