import { useState, useMemo } from 'react';
import type { LiveDevice, LiveFilterState } from '../types';

export interface UseLiveFiltersReturn {
  filters: LiveFilterState;
  setBusqueda: (val: string) => void;
  setOcultarDesconectados: (val: boolean | ((prev: boolean) => boolean)) => void;
  setEstadoFiltro: (val: LiveFilterState['estadoFiltro']) => void;
  setGeofenceId: (val: number | 'TODOS') => void;
  setSectorFiltro: (val: string | 'TODOS') => void;
  limpiarFiltros: () => void;
  hayFiltrosActivos: boolean;
  filteredDevices: LiveDevice[];
  counts: {
    total: number;
    activos: number;
    detenidos: number;
    desconectados: number;
    visibles: number;
  };
}

export function useLiveFilters(
  devices: LiveDevice[],
  geofences: import('../types').TraccarGeofence[] = []
): UseLiveFiltersReturn {
  const [filters, setFilters] = useState<LiveFilterState>({
    busqueda: '',
    ocultarDesconectados: true, // Por defecto ocultar desconectados para reducir ruido
    estadoFiltro: 'TODOS',
    geofenceId: 'TODOS',
    sectorFiltro: 'TODOS',
  });

  // Métricas globales sobre todos los dispositivos
  const counts = useMemo(() => {
    let activos = 0;
    let detenidos = 0;
    let desconectados = 0;

    for (const d of devices) {
      if (d.estado === 'ACTIVO') activos++;
      else if (d.estado === 'DETENIDO') detenidos++;
      else desconectados++;
    }

    return {
      total: devices.length,
      activos,
      detenidos,
      desconectados,
      visibles: 0, // se completa abajo
    };
  }, [devices]);

  // Aplicación de filtros en memoria
  const filteredDevices = useMemo(() => {
    const query = filters.busqueda.trim().toLowerCase();

    return devices.filter((d) => {
      // 1. Filtro: Ocultar desconectados
      // Si el usuario escribe una búsqueda por texto o selecciona ver desconectados, NO los ocultamos
      const buscandoPorTexto = Boolean(query);
      const filtrandoDesconectados = filters.estadoFiltro === 'DESCONECTADOS';

      if (filters.ocultarDesconectados && !buscandoPorTexto && !filtrandoDesconectados) {
        if (d.estado === 'DESCONECTADO') {
          return false;
        }
      }

      // 2. Filtro: Por estado específico (ACTIVOS, DETENIDOS, DESCONECTADOS)
      if (filters.estadoFiltro !== 'TODOS') {
        if (filters.estadoFiltro === 'ACTIVOS' && d.estado !== 'ACTIVO') return false;
        if (filters.estadoFiltro === 'DETENIDOS' && d.estado !== 'DETENIDO') return false;
        if (filters.estadoFiltro === 'DESCONECTADOS' && d.estado !== 'DESCONECTADO') return false;
      }

      // 3. Filtro: Por Geocerca de Traccar (Zona)
      if (filters.geofenceId !== 'TODOS') {
        const gId = Number(filters.geofenceId);
        const posGeofenceIds = d.rawPosition?.geofenceIds || [];
        const geocercaObj = geofences.find((g) => g.id === gId);

        const estaEnGeocercaTraccar = posGeofenceIds.includes(gId);
        const coincidePorSector =
          geocercaObj &&
          d.sector &&
          (d.sector.toLowerCase() === geocercaObj.name.toLowerCase() ||
            d.sector.toLowerCase().includes(geocercaObj.name.toLowerCase()));

        if (!estaEnGeocercaTraccar && !coincidePorSector) {
          return false;
        }
      }

      // 4. Filtro: Por Sector o Atributo
      if (filters.sectorFiltro !== 'TODOS') {
        if (d.sector !== filters.sectorFiltro) return false;
      }

      // 4. Búsqueda por texto (DNI, nombre, placa, conductor, sector)
      if (query) {
        const matchNombre = d.name.toLowerCase().includes(query);
        const matchDni = d.uniqueId.toLowerCase().includes(query);
        const matchPlaca = d.placa.toLowerCase().includes(query);
        const matchConductor = d.conductor.toLowerCase().includes(query);
        const matchSector = d.sector.toLowerCase().includes(query);

        if (!matchNombre && !matchDni && !matchPlaca && !matchConductor && !matchSector) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      // Prioridad visual: primero en movimiento (ACTIVO), luego detenidos, luego desconectados
      const prioridad: Record<string, number> = { ACTIVO: 1, DETENIDO: 2, DESCONECTADO: 3 };
      return (prioridad[a.estado] || 4) - (prioridad[b.estado] || 4);
    });
  }, [devices, filters]);

  const hayFiltrosActivos = useMemo(() => {
    return (
      Boolean(filters.busqueda) ||
      filters.estadoFiltro !== 'TODOS' ||
      filters.geofenceId !== 'TODOS' ||
      filters.sectorFiltro !== 'TODOS' ||
      !filters.ocultarDesconectados // si no está en el default
    );
  }, [filters]);

  const limpiarFiltros = () => {
    setFilters({
      busqueda: '',
      ocultarDesconectados: true,
      estadoFiltro: 'TODOS',
      geofenceId: 'TODOS',
      sectorFiltro: 'TODOS',
    });
  };

  return {
    filters,
    setBusqueda: (val) => setFilters((prev) => ({ ...prev, busqueda: val })),
    setOcultarDesconectados: (val) =>
      setFilters((prev) => ({
        ...prev,
        ocultarDesconectados: typeof val === 'function' ? val(prev.ocultarDesconectados) : val,
      })),
    setEstadoFiltro: (val) => setFilters((prev) => ({ ...prev, estadoFiltro: val })),
    setGeofenceId: (val) => setFilters((prev) => ({ ...prev, geofenceId: val })),
    setSectorFiltro: (val) => setFilters((prev) => ({ ...prev, sectorFiltro: val })),
    limpiarFiltros,
    hayFiltrosActivos,
    filteredDevices,
    counts: {
      ...counts,
      visibles: filteredDevices.length,
    },
  };
}
