import { useState, useEffect, useMemo, useCallback } from 'react';
import type { TraccarDevice, ManagedDevice, DeviceFilterState, AttributeColumnConfig } from '../types';
import {
  listarDispositivosTraccar,
  actualizarCampoOAtributo,
  propagarAtributoEnLote,
  eliminarAtributoEnLote,
  guardarDispositivoTraccar,
  eliminarDispositivoTraccar,
} from '../api';

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

  // Columnas ocultas por el usuario
  const [columnasOcultas, setColumnasOcultas] = useState<Set<string>>(new Set(['positionId', 'groupId', 'calendarId', 'expirationTime']));

  // Selección de filas
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Estado de edición inline
  const [editingCell, setEditingCell] = useState<{ deviceId: number; key: string } | null>(null);
  const [savingCell, setSavingCell] = useState<{ deviceId: number; key: string } | null>(null);
  const [successCell, setSuccessCell] = useState<{ deviceId: number; key: string } | null>(null);

  // Modales
  const [modalAtributoAbierto, setModalAtributoAbierto] = useState<boolean>(false);
  const [modalEdicionMasivaAbierto, setModalEdicionMasivaAbierto] = useState<boolean>(false);
  const [dispositivoParaEditar, setDispositivoParaEditar] = useState<ManagedDevice | null>(null);

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
    for (const d of devices) {
      if (d.attributes && typeof d.attributes === 'object') {
        for (const k of Object.keys(d.attributes)) {
          set.add(k);
        }
      }
    }
    return Array.from(set).sort();
  }, [devices]);

  // Lista de columnas disponibles (estándar + atributos dinámicos)
  const columnasDisponibles = useMemo<AttributeColumnConfig[]>(() => {
    const estandar: AttributeColumnConfig[] = [
      { key: 'name', label: 'Nombre / Unidad', type: 'standard', visible: !columnasOcultas.has('name') },
      { key: 'uniqueId', label: 'DNI / Identificador', type: 'standard', visible: !columnasOcultas.has('uniqueId') },
      { key: 'status', label: 'Estado', type: 'standard', visible: !columnasOcultas.has('status') },
      { key: 'phone', label: 'Teléfono', type: 'standard', visible: !columnasOcultas.has('phone') },
      { key: 'contact', label: 'Contacto', type: 'standard', visible: !columnasOcultas.has('contact') },
      { key: 'category', label: 'Categoría', type: 'standard', visible: !columnasOcultas.has('category') },
      { key: 'disabled', label: 'Habilitado', type: 'standard', visible: !columnasOcultas.has('disabled') },
      { key: 'lastUpdate', label: 'Última Act.', type: 'standard', visible: !columnasOcultas.has('lastUpdate') },
    ];

    const atributosDinamicos: AttributeColumnConfig[] = todasLasClavesAtributos.map((k) => ({
      key: k,
      label: k,
      type: 'attribute',
      visible: !columnasOcultas.has(k),
      isCustom: true,
    }));

    return [...estandar, ...atributosDinamicos];
  }, [todasLasClavesAtributos, columnasOcultas]);

  // Alternar visibilidad de una columna
  const toggleVisibilidadColumna = useCallback((colKey: string) => {
    setColumnasOcultas((prev) => {
      const next = new Set(prev);
      if (next.has(colKey)) {
        next.delete(colKey);
      } else {
        next.add(colKey);
      }
      return next;
    });
  }, []);

  // Filtrado reactivo de dispositivos
  const dispositivosFiltrados = useMemo(() => {
    const q = filters.search.trim().toLowerCase();

    return devices.filter((dev) => {
      // Filtro de búsqueda omnibox
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

  // Ordenamiento
  const dispositivosOrdenados = useMemo(() => {
    const { key, direction } = sortConfig;
    const factor = direction === 'asc' ? 1 : -1;

    return [...dispositivosFiltrados].sort((a, b) => {
      let valA: any = (a as any)[key];
      let valB: any = (b as any)[key];

      if (valA === undefined && a.attributes) valA = a.attributes[key];
      if (valB === undefined && b.attributes) valB = b.attributes[key];

      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'string') {
        return valA.localeCompare(String(valB)) * factor;
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

  // Guardado de celda inline
  const guardarEdicionInline = useCallback(
    async (deviceId: number, key: string, valor: any, isAttribute: boolean) => {
      const dev = devices.find((d) => d.id === deviceId);
      if (!dev) return;

      setSavingCell({ deviceId, key });
      try {
        const actualizado = await actualizarCampoOAtributo(dev, key, valor, isAttribute);

        // Actualizar en el estado local de inmediato
        setDevices((prev) =>
          prev.map((d) => (d.id === deviceId ? { ...actualizado, isOnline: actualizado.status === 'online' } : d))
        );

        setEditingCell(null);
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

  // Agregar o modificar atributo global en masa
  const agregarAtributoMasivo = useCallback(
    async (clave: string, valorDefecto: any, alcance: 'all' | 'selected') => {
      const targetIds =
        alcance === 'selected'
          ? Array.from(selectedIds)
          : devices.map((d) => d.id);

      if (targetIds.length === 0) {
        alert('No hay dispositivos seleccionados');
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

        // Asegurarse de que la nueva columna quede visible
        setColumnasOcultas((prev) => {
          const next = new Set(prev);
          next.delete(clave);
          return next;
        });

        alert(`Atributo "${clave}" propagado con éxito en ${exitosos} dispositivos.`);
      } catch (err: any) {
        console.error('[useDevicesManager] Error en propagación masiva:', err);
        alert(`Error al propagar atributo: ${err.message}`);
      } finally {
        setProgresoLote(null);
        setModalAtributoAbierto(false);
      }
    },
    [devices, selectedIds]
  );

  // Eliminar atributo masivo
  const eliminarAtributoMasivo = useCallback(
    async (clave: string) => {
      const confirmacion = window.confirm(
        `¿Estás seguro de eliminar el atributo "${clave}" de TODOS los dispositivos? Esta acción no se puede deshacer.`
      );
      if (!confirmacion) return;

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
        alert(`Error: ${err.message}`);
      } finally {
        setProgresoLote(null);
      }
    },
    [devices]
  );

  // Guardar dispositivo completo (desde el modal clásico)
  const guardarDispositivoCompleto = useCallback(async (dev: TraccarDevice) => {
    try {
      const res = await guardarDispositivoTraccar(dev);
      setDevices((prev) =>
        prev.map((d) => (d.id === dev.id ? { ...res, isOnline: res.status === 'online' } : d))
      );
      setDispositivoParaEditar(null);
    } catch (err: any) {
      console.error('[useDevicesManager] Error guardando dispositivo completo:', err);
      alert(`Error al guardar dispositivo: ${err.message}`);
    }
  }, []);

  // Eliminar dispositivo
  const eliminarDispositivo = useCallback(async (id: number) => {
    const confirmacion = window.confirm('¿Seguro que deseas eliminar este dispositivo de Traccar?');
    if (!confirmacion) return;

    try {
      await eliminarDispositivoTraccar(id);
      setDevices((prev) => prev.filter((d) => d.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err: any) {
      alert(`Error al eliminar dispositivo: ${err.message}`);
    }
  }, []);

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
    toggleVisibilidadColumna,
    todasLasClavesAtributos,
    selectedIds,
    toggleSeleccion,
    seleccionarTodosVisibles,
    deseleccionarTodo,
    editingCell,
    setEditingCell,
    savingCell,
    successCell,
    guardarEdicionInline,
    modalAtributoAbierto,
    setModalAtributoAbierto,
    modalEdicionMasivaAbierto,
    setModalEdicionMasivaAbierto,
    dispositivoParaEditar,
    setDispositivoParaEditar,
    guardarDispositivoCompleto,
    agregarAtributoMasivo,
    eliminarAtributoMasivo,
    eliminarDispositivo,
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
