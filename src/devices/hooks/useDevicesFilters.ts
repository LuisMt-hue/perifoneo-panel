import { useCallback, useMemo, useState } from 'react';
import type { ManagedDevice, DeviceFilterState } from '../types';

export interface UseDevicesFiltersReturn {
  filters: DeviceFilterState;
  setFilters: (filters: DeviceFilterState) => void;
  filteredDevices: ManagedDevice[];
  counts: {
    total: number;
    activos: number;
    detenidos: number;
    desconectados: number;
    deshabilitados: number;
  };
}

const DEFAULT_FILTERS: DeviceFilterState = {
  search: '',
  estadoFiltro: 'TODOS',
  soloDeshabilitados: false,
};

/**
 * Filtrado en memoria de la tabla de dispositivos: búsqueda de texto, estado
 * (mismos 3 niveles que Live: ACTIVO/DETENIDO/DESCONECTADO) y deshabilitados.
 */
export function useDevicesFilters(devices: ManagedDevice[]): UseDevicesFiltersReturn {
  const [filters, setFiltersState] = useState<DeviceFilterState>(DEFAULT_FILTERS);

  const setFilters = useCallback((next: DeviceFilterState) => setFiltersState(next), []);

  const counts = useMemo(() => {
    let activos = 0;
    let detenidos = 0;
    let desconectados = 0;
    let deshabilitados = 0;

    for (const d of devices) {
      if (d.estado === 'ACTIVO') activos++;
      else if (d.estado === 'DETENIDO') detenidos++;
      else desconectados++;
      if (d.disabled) deshabilitados++;
    }

    return { total: devices.length, activos, detenidos, desconectados, deshabilitados };
  }, [devices]);

  const filteredDevices = useMemo(() => {
    const q = filters.search.trim().toLowerCase();

    return devices.filter((dev) => {
      if (filters.soloDeshabilitados && !dev.disabled) return false;

      if (filters.estadoFiltro !== 'TODOS' && dev.estado !== filters.estadoFiltro) {
        return false;
      }

      if (q) {
        const matchName = dev.name?.toLowerCase().includes(q);
        const matchUniqueId = dev.uniqueId?.toLowerCase().includes(q);
        const matchPhone = dev.phone?.toLowerCase().includes(q);
        const matchContact = dev.contact?.toLowerCase().includes(q);
        const matchGrupo = dev.grupoNombre?.toLowerCase().includes(q);
        const matchBase = String(dev.attributes?.base || '').toLowerCase().includes(q);
        const matchSector = String(dev.attributes?.sector || '').toLowerCase().includes(q);

        if (
          !matchName &&
          !matchUniqueId &&
          !matchPhone &&
          !matchContact &&
          !matchGrupo &&
          !matchBase &&
          !matchSector
        ) {
          return false;
        }
      }

      return true;
    });
  }, [devices, filters]);

  return { filters, setFilters, filteredDevices, counts };
}
