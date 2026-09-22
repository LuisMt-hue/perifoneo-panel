import { useState, useEffect, useMemo, useCallback } from 'react';
import type {
  TraccarDevice,
  ManagedDevice,
  DeviceFilterState,
  CreateDevicePayload,
} from '../types';
import {
  listarDispositivosTraccar,
  crearDispositivoTraccar,
  actualizarCampoOAtributo,
  propagarAtributoEnLote,
  renombrarAtributoEnLote,
  eliminarAtributoEnLote,
  guardarDispositivoTraccar,
  eliminarDispositivoTraccar,
} from '../api';
import { useColumnVisibility } from './useColumnVisibility';

export function useDevicesManager() {
  const [devices, setDevices] = useState<ManagedDevice[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros reactivos
  const [filters, setFilters] = useState<DeviceFilterState>({
    search: '',
    status: 'all',
    category: null,
    missingAttribute: null,
  });

  // Selección de filas
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Estado de edición inline
  const [savingCell, setSavingCell] = useState<{ deviceId: number; key: string } | null>(null);
  const [successCell, setSuccessCell] = useState<{ deviceId: number; key: string } | null>(null);

  // Estados de Modales
  const [modalCrearAbierto, setModalCrearAbierto] = useState<boolean>(false);
  const [modalColumnasAbierto, setModalColumnasAbierto] = useState<boolean>(false);
  const [modalAtributosAbierto, setModalAtributosAbierto] = useState<boolean>(false);
  const [modalEdicionMasivaAbierto, setModalEdicionMasivaAbierto] = useState<boolean>(false);
  const [dispositivoParaEditar, setDispositivoParaEditar] = useState<ManagedDevice | null>(null);
  const [dispositivoParaEliminar, setDispositivoParaEliminar] = useState<ManagedDevice | null>(null);
  const [eliminandoDispositivo, setEliminandoDispositivo] = useState<boolean>(false);

  // Progreso de operaciones masivas
  const [progresoLote, setProgresoLote] = useState<{ actual: number; total: number } | null>(null);

  // Ordenamiento
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'name',
    direction: 'asc',
  });

  // Paginación
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const [filasPorPagina, setFilasPorPagina] = useState<number>(25);

  // Cargar dispositivos desde Traccar
  const cargarDispositivos = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      const data = await listarDispositivosTraccar();
      setDevices(
        data.map((d) => ({
          ...d,
          isOnline: d.status === 'online',
        }))
      );
    } catch (err: any) {
      console.error('[useDevicesManager] Error al cargar dispositivos:', err);
      setError(err.message || 'Error al conectar con Traccar');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDispositivos();
  }, [cargarDispositivos]);

  // Descubrir todas las claves de atributos presentes en los dispositivos
  const todasLasClavesAtributos = useMemo(() => {
    const set = new Set<string>();
    // Siempre asegurar que las claves prioritarias estén disponibles
    set.add('base');
    set.add('distrito');
    set.add('placa');
    set.add('sector');

    for (const d of devices) {
      if (d.attributes && typeof d.attributes === 'object') {
        for (const k of Object.keys(d.attributes)) {
          set.add(k);
        }
      }
    }
    return Array.from(set).sort();
  }, [devices]);

  // Hook modular de visibilidad de columnas
  const {
    columnasDisponibles,
    columnasVisibles,
    toggleVisibilidadColumna,
    marcarTodas,
    desmarcarTodas,
    restablecerPrioritarias,
  } = useColumnVisibility(todasLasClavesAtributos);

  // Filtrado reactivo de dispositivos
  const dispositivosFiltrados = useMemo(() => {
    const q = filters.search.trim().toLowerCase();

    return devices.filter((dev) => {
      // Filtro de búsqueda omnibox (nombre, DNI, teléfono, contacto, base, distrito, placa, sector, attrs)
      if (q) {
        const matchName = dev.name?.toLowerCase().includes(q);
        const matchUniqueId = dev.uniqueId?.toLowerCase().includes(q);
        const matchPhone = dev.phone?.toLowerCase().includes(q);
        const matchContact = dev.contact?.toLowerCase().includes(q);
        const matchAttrs = Object.entries(dev.attributes || {}).some(([k, v]) =>
          String(k).toLowerCase().includes(q) || String(v).toLowerCase().includes(q)
        );

        if (!matchName && !matchUniqueId && !matchPhone && !matchContact && !matchAttrs) {
          return false;
        }
      }

      // Filtro por estado
      if (filters.status === 'online' && dev.status !== 'online') return false;
      if (filters.status === 'offline' && dev.status === 'online') return false;
      if (filters.status === 'disabled' && !dev.disabled) return false;

      // Filtro por categoría
      if (filters.category && dev.category !== filters.category) return false;

      // Filtro por atributo faltante
      if (filters.missingAttribute) {
        const val = dev.attributes?.[filters.missingAttribute];
        if (val !== undefined && val !== null && val !== '') return false;
      }

      return true;
    });
  }, [devices, filters]);

  // Helper para obtener valor para ordenar
  const getSortValue = (device: ManagedDevice, key: string): any => {
    if (key === 'name') return device.name || '';
    if (key === 'uniqueId') return device.uniqueId || '';
    if (key === 'phone') return device.phone || device.attributes?.celular || '';
    if (key === 'base') return device.attributes?.base || '';
    if (key === 'distrito') return device.attributes?.distrito || '';
    if (key === 'placa') return device.attributes?.placa || '';
    if (key === 'sector') return device.attributes?.sector || '';

    if (device.attributes && key in device.attributes) {
      return device.attributes[key];
    }
    return (device as any)[key] ?? '';
  };

  // Ordenamiento
  const dispositivosOrdenados = useMemo(() => {
    const { key, direction } = sortConfig;
    const factor = direction === 'asc' ? 1 : -1;

    return [...dispositivosFiltrados].sort((a, b) => {
      const valA = getSortValue(a, key);
      const valB = getSortValue(b, key);

      if (valA === null || valA === undefined || valA === '') return 1;
      if (valB === null || valB === undefined || valB === '') return -1;

      if (typeof valA === 'string' && typeof valB === 'string') {
        return valA.localeCompare(valB) * factor;
      }
      return (valA > valB ? 1 : -1) * factor;
    });
  }, [dispositivosFiltrados, sortConfig]);

  // Paginación
  const totalPaginas = Math.ceil(dispositivosOrdenados.length / filasPorPagina) || 1;
  const dispositivosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * filasPorPagina;
    return dispositivosOrdenados.slice(inicio, inicio + filasPorPagina);
  }, [dispositivosOrdenados, paginaActual, filasPorPagina]);

  // Selección de filas
  const toggleSeleccion = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const seleccionarTodosVisibles = useCallback(() => {
    setSelectedIds((prev) => {
      const todosEstan = dispositivosPaginados.every((d) => prev.has(d.id));
      const next = new Set(prev);
      if (todosEstan) {
        for (const d of dispositivosPaginados) next.delete(d.id);
      } else {
        for (const d of dispositivosPaginados) next.add(d.id);
      }
      return next;
    });
  }, [dispositivosPaginados]);

  const deseleccionarTodo = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // CRUD Dispositivos: Crear nuevo
  const crearNuevoDispositivo = useCallback(async (payload: CreateDevicePayload) => {
    const nuevo = await crearDispositivoTraccar(payload);
    setDevices((prev) => [
      {
        ...nuevo,
        isOnline: nuevo.status === 'online',
      },
      ...prev,
    ]);
  }, []);

  // Guardado de celda inline (con sanitización estricta para evitar error 400 isOnline)
  const guardarEdicionInline = useCallback(
    async (deviceId: number, key: string, valor: any, isAttribute: boolean) => {
      const dev = devices.find((d) => d.id === deviceId);
      if (!dev) return;

      setSavingCell({ deviceId, key });
      try {
        const actualizado = await actualizarCampoOAtributo(dev, key, valor, isAttribute);

        // Actualizar en el estado local de inmediato
        setDevices((prev) =>
          prev.map((d) =>
            d.id === deviceId ? { ...actualizado, isOnline: actualizado.status === 'online' } : d
          )
        );

        setSuccessCell({ deviceId, key });
        setTimeout(() => setSuccessCell(null), 1500);
      } catch (err: any) {
        console.error('[useDevicesManager] Error guardando celda inline:', err);
        alert(`Error al guardar: ${err.message}`);
      } finally {
        setSavingCell(null);
      }
    },
    [devices]
  );

  // Guardar dispositivo completo (desde el modal de edición)
  const guardarDispositivoCompleto = useCallback(async (dev: TraccarDevice) => {
    const res = await guardarDispositivoTraccar(dev);
    setDevices((prev) =>
      prev.map((d) => (d.id === dev.id ? { ...res, isOnline: res.status === 'online' } : d))
    );
  }, []);

  // Eliminar dispositivo
  const confirmarEliminarDispositivo = useCallback(async (id: number) => {
    setEliminandoDispositivo(true);
    try {
      await eliminarDispositivoTraccar(id);
      setDevices((prev) => prev.filter((d) => d.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setDispositivoParaEliminar(null);
    } catch (err: any) {
      console.error('Error al eliminar dispositivo:', err);
      alert(`Error al eliminar dispositivo: ${err.message}`);
    } finally {
      setEliminandoDispositivo(false);
    }
  }, []);

  // CRUD Atributos: Crear / Propagar masivo
  const crearAtributoMasivo = useCallback(
    async (clave: string, valorDefecto: any, alcance: 'all' | 'selected') => {
      const targetIds =
        alcance === 'selected'
          ? Array.from(selectedIds)
          : devices.map((d) => d.id);

      if (targetIds.length === 0) {
        alert('No hay dispositivos seleccionados para propagar el atributo.');
        return;
      }

      setProgresoLote({ actual: 0, total: targetIds.length });
      try {
        const { exitosos, actualizados } = await propagarAtributoEnLote(
          devices,
          targetIds,
          clave,
          valorDefecto,
          (actual, total) => setProgresoLote({ actual, total })
        );

        // Merge en estado local
        const actMap = new Map(actualizados.map((a) => [a.id, a]));
        setDevices((prev) =>
          prev.map((d) => (actMap.has(d.id) ? { ...actMap.get(d.id)!, isOnline: d.isOnline } : d))
        );

        alert(`Atributo "${clave}" propagado con éxito en ${exitosos} dispositivos.`);
      } catch (err: any) {
        console.error('[useDevicesManager] Error en propagación masiva:', err);
        alert(`Error al propagar atributo: ${err.message}`);
      } finally {
        setProgresoLote(null);
      }
    },
    [devices, selectedIds]
  );

  // CRUD Atributos: Renombrar masivo
  const renombrarAtributoMasivo = useCallback(
    async (claveActual: string, nuevaClave: string) => {
      setProgresoLote({ actual: 0, total: devices.length });
      try {
        const { exitosos, actualizados } = await renombrarAtributoEnLote(
          devices,
          claveActual,
          nuevaClave,
          (actual, total) => setProgresoLote({ actual, total })
        );

        const actMap = new Map(actualizados.map((a) => [a.id, a]));
        setDevices((prev) =>
          prev.map((d) => (actMap.has(d.id) ? { ...actMap.get(d.id)!, isOnline: d.isOnline } : d))
        );

        alert(`Atributo renombrado de "${claveActual}" a "${nuevaClave}" en ${exitosos} dispositivos.`);
      } catch (err: any) {
        console.error('[useDevicesManager] Error al renombrar atributo:', err);
        alert(`Error al renombrar atributo: ${err.message}`);
      } finally {
        setProgresoLote(null);
      }
    },
    [devices]
  );

  // CRUD Atributos: Eliminar masivo
  const eliminarAtributoMasivo = useCallback(
    async (clave: string) => {
      const targetIds = devices.map((d) => d.id);
      setProgresoLote({ actual: 0, total: targetIds.length });
      try {
        const { exitosos, actualizados } = await eliminarAtributoEnLote(
          devices,
          targetIds,
          clave,
          (actual, total) => setProgresoLote({ actual, total })
        );

        const actMap = new Map(actualizados.map((a) => [a.id, a]));
        setDevices((prev) =>
          prev.map((d) => (actMap.has(d.id) ? { ...actMap.get(d.id)!, isOnline: d.isOnline } : d))
        );

        alert(`Atributo "${clave}" eliminado de ${exitosos} dispositivos.`);
      } catch (err: any) {
        console.error('[useDevicesManager] Error al eliminar atributo masivo:', err);
        alert(`Error al eliminar atributo: ${err.message}`);
      } finally {
        setProgresoLote(null);
      }
    },
    [devices]
  );

  return {
    devices,
    dispositivosFiltrados,
    dispositivosPaginados,
    cargando,
    error,
    recargar: cargarDispositivos,
    filters,
    setFilters,
    columnasDisponibles,
    columnasVisibles,
    toggleVisibilidadColumna,
    marcarTodasColumnas: marcarTodas,
    desmarcarTodasColumnas: desmarcarTodas,
    restablecerColumnasPrioritarias: restablecerPrioritarias,
    todasLasClavesAtributos,
    selectedIds,
    toggleSeleccion,
    seleccionarTodosVisibles,
    deseleccionarTodo,
    savingCell,
    successCell,
    guardarEdicionInline,
    modalCrearAbierto,
    setModalCrearAbierto,
    modalColumnasAbierto,
    setModalColumnasAbierto,
    modalAtributosAbierto,
    setModalAtributosAbierto,
    modalEdicionMasivaAbierto,
    setModalEdicionMasivaAbierto,
    dispositivoParaEditar,
    setDispositivoParaEditar,
    dispositivoParaEliminar,
    setDispositivoParaEliminar,
    eliminandoDispositivo,
    crearNuevoDispositivo,
    guardarDispositivoCompleto,
    confirmarEliminarDispositivo,
    crearAtributoMasivo,
    renombrarAtributoMasivo,
    eliminarAtributoMasivo,
    progresoLote,
    sortConfig,
    setSortConfig,
    paginaActual,
    setPaginaActual,
    filasPorPagina,
    setFilasPorPagina,
    totalPaginas,
    totalRegistros: dispositivosFiltrados.length,
  };
}
