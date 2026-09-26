import { useMemo } from 'react';
import {
  useTraccarDevicesQuery,
  useTraccarGeofencesQuery,
  useTraccarGroupsQuery,
} from '../../shared/hooks/useTraccarCatalogQueries';

/**
 * Catálogos compartidos (dispositivos/geocercas/grupos) para el módulo Historial.
 * Reutiliza las mismas queryKeys que Live/Devices/Detalle de recorrido, sin duplicar peticiones.
 */
export function useHistorialCatalogos() {
  const devicesQuery = useTraccarDevicesQuery();
  const geofencesQuery = useTraccarGeofencesQuery();
  const groupsQuery = useTraccarGroupsQuery();

  const dispositivos = devicesQuery.data || [];
  const geocercas = geofencesQuery.data || [];
  const grupos = groupsQuery.data || [];

  const listaSectores = useMemo(() => {
    const set = new Set<string>();
    for (const g of geocercas) {
      const gName = String(g.name || '').trim();
      if (gName) set.add(gName);
    }
    for (const d of dispositivos) {
      const s = String(
        d.attributes?.sector ||
        d.attributes?.Sector ||
        d.attributes?.SECTOR ||
        d.attributes?.zona ||
        ''
      ).trim();
      if (s) set.add(s);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
  }, [geocercas, dispositivos]);

  const listaGrupos = useMemo(
    () => [...grupos].sort((a, b) => a.name.localeCompare(b.name, 'es', { numeric: true })),
    [grupos]
  );

  const listaBases = useMemo(() => {
    const set = new Set<string>();
    for (const d of dispositivos) {
      const b = String(d.attributes?.base || '').trim();
      if (b) set.add(b);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
  }, [dispositivos]);

  return {
    dispositivos,
    geocercas,
    grupos,
    listaSectores,
    listaGrupos,
    listaBases,
    cargando: devicesQuery.isLoading || geofencesQuery.isLoading || groupsQuery.isLoading,
  };
}
