import { useMemo, useState } from 'react';
import type { ManagedDevice } from '../types';

export const DEFAULT_PAGE_SIZE = 25;

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

function getSortValue(device: ManagedDevice, key: string): any {
  if (key === 'name') return device.name || '';
  if (key === 'uniqueId') return device.uniqueId || '';
  if (key === 'phone') return device.phone || '';
  if (key === 'groupId') return device.grupoNombre || '';
  if (key === 'base') return device.attributes?.base || '';
  if (key === 'sector') return device.attributes?.sector || '';
  return (device as any)[key] ?? '';
}

export interface UseDevicesSortAndPaginationReturn {
  sortConfig: SortConfig;
  onSortChange: (key: string) => void;
  paginated: ManagedDevice[];
  paginaActual: number;
  setPaginaActual: (pag: number) => void;
  filasPorPagina: number;
  setFilasPorPagina: (num: number) => void;
  totalPaginas: number;
  totalRegistros: number;
}

/**
 * Orden + paginación sobre la lista ya filtrada. Extraído tal cual de la versión
 * anterior de useDevicesManager, sin cambios de comportamiento.
 */
export function useDevicesSortAndPagination(
  filteredDevices: ManagedDevice[]
): UseDevicesSortAndPaginationReturn {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });
  const [paginaActual, setPaginaActual] = useState(1);
  const [filasPorPagina, setFilasPorPaginaState] = useState(DEFAULT_PAGE_SIZE);

  const sorted = useMemo(() => {
    const { key, direction } = sortConfig;
    const factor = direction === 'asc' ? 1 : -1;

    return [...filteredDevices].sort((a, b) => {
      const valA = getSortValue(a, key);
      const valB = getSortValue(b, key);

      if (valA === null || valA === undefined || valA === '') return 1;
      if (valB === null || valB === undefined || valB === '') return -1;

      if (typeof valA === 'string' && typeof valB === 'string') {
        return valA.localeCompare(valB) * factor;
      }
      return (valA > valB ? 1 : -1) * factor;
    });
  }, [filteredDevices, sortConfig]);

  const totalPaginas = Math.ceil(sorted.length / filasPorPagina) || 1;
  const paginated = useMemo(() => {
    const inicio = (paginaActual - 1) * filasPorPagina;
    return sorted.slice(inicio, inicio + filasPorPagina);
  }, [sorted, paginaActual, filasPorPagina]);

  const onSortChange = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const setFilasPorPagina = (num: number) => {
    setFilasPorPaginaState(num);
    setPaginaActual(1);
  };

  return {
    sortConfig,
    onSortChange,
    paginated,
    paginaActual,
    setPaginaActual,
    filasPorPagina,
    setFilasPorPagina,
    totalPaginas,
    totalRegistros: filteredDevices.length,
  };
}
