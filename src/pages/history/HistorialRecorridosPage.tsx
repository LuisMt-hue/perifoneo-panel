import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Download,
  History,
  Clock,
  MapPin,
  Calendar,
  ChevronRight,
  Activity,
  Filter,
  Milestone,
  AlertTriangle,
  RefreshCw,
  Eye,
  Loader2,
} from 'lucide-react';
import {
  obtenerDispositivosTraccar,
  obtenerGeocercasTraccar,
  obtenerTripsTraccar,
  obtenerStopsTraccar,
  obtenerGeofenceReportsTraccar,
  procesarHistorialDispositivos,
  enriquecerHistorialConGeocercas,
  resolverSectorDispositivo,
  generarClaveCacheHistorial,
  obtenerHistorialCache,
  guardarHistorialCache,
  type ItemHistorial,
  type TraccarReportGeofence,
} from '../../services/api/traccarHistory';
import FiltroFechas from '../../components/ui/FiltroFechas';
import TablaDatos from '../../components/ui/TablaDatos';
import { formatearFecha, formatearHora, formatearDuracion, hoy } from '../../utils/formato';
import { exportarExcel } from '../../utils/excel';

/**
 * Componente de celda para la duración con semáforo de 3 colores según la jornada (escala 1h a 6h)
 * y tooltip flotante interactivo de advertencia estilo Apple macOS al superar las 5 horas.
 */
const CeldaDuracionActiva: React.FC<{ minutos: number }> = ({ minutos }) => {
  if (minutos <= 0) {
    return <span className="font-mono text-zinc-400 dark:text-zinc-600 tabular-nums">0 min</span>;
  }

  // Escala de jornada:
  // < 1h: Neutral / inicio
  // 1h a < 4h: Verde esmeralda (óptimo / normal)
  // 4h a < 5h: Ámbar (atención / moderado)
  // ≥ 5h: Rojo (excesivo, despliega tooltip flotante)
  let colorClase =
    'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700';
  const esExcesivo = minutos >= 300; // 5 horas

  if (minutos >= 300) {
    colorClase =
      'bg-rose-500/15 dark:bg-rose-400/20 text-rose-700 dark:text-rose-300 border-rose-500/35 font-bold';
  } else if (minutos >= 240) {
    colorClase =
      'bg-amber-500/10 dark:bg-amber-400/15 text-amber-700 dark:text-amber-300 border-amber-500/25';
  } else if (minutos >= 60) {
    colorClase =
      'bg-emerald-500/10 dark:bg-emerald-400/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25';
  }

  return (
    <div className="relative group inline-flex items-center">
      <span
        className={`px-2.5 py-0.5 rounded-[21px] text-xs font-mono font-medium border flex items-center gap-1.5 tabular-nums transition-colors ${colorClase}`}
      >
        {esExcesivo && (
          <AlertTriangle
            size={12}
            className="text-rose-600 dark:text-rose-400 animate-pulse shrink-0"
          />
        )}
        <span>{formatearDuracion(minutos)}</span>
      </span>

      {/* Popover / Tooltip estilo Apple macOS al pasar el cursor si es >= 5h */}
      {esExcesivo && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-50 pointer-events-none transition-all">
          <div className="bg-zinc-900/95 dark:bg-zinc-100/95 backdrop-blur-md text-white dark:text-zinc-900 text-2xs font-semibold px-3 py-1.5 rounded-xl shadow-xl whitespace-nowrap border border-zinc-700/60 dark:border-zinc-300 flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150">
            <AlertTriangle size={11} className="text-amber-400 dark:text-amber-600 shrink-0" />
            <span>Tiempo excesivo (≥5h) · Revisar avance</span>
          </div>
          <div className="size-2 bg-zinc-900 dark:bg-zinc-100 rotate-45 -mt-1 border-r border-b border-zinc-700/60 dark:border-zinc-300" />
        </div>
      )}
    </div>
  );
};

/**
 * Página de Historial de Recorridos y Jornadas con diseño Apple UI System (Inter, 4px grid, #155BD0).
 *
 * Muestra el campo Fecha explícito y las columnas operativas conectadas a Traccar:
 * 1. Fecha (dd/MM/yyyy)
 * 2. Dispositivo (solo el nombre)
 * 3. Geocerca (sector tipo A1, A2, etc. o 'Sin sector')
 * 4. Inicio (hora de inicio HH:mm)
 * 5. Fin (hora de fin HH:mm)
 * 6. Duración (tiempo activo con semáforo y tooltip)
 * 7. Min Dentro (en minutos enteros, cargado en Fase 2)
 * 8. Min Fuera (en minutos enteros, cargado en Fase 2)
 * 9. Detenido (tiempo en paradas)
 * 10. Distancia (km acumulados)
 * 11. Acciones (botón Ver Ruta)
 */
export const HistorialRecorridosPage: React.FC = () => {
  const [fechaInicio, setFechaInicio] = useState<string>(hoy());
  const [fechaFin, setFechaFin] = useState<string>(hoy());
  const [dispositivoFiltro, setDispositivoFiltro] = useState<string>('');
  const [sectorFiltro, setSectorFiltro] = useState<string>('');
  const [soloConActividad, setSoloConActividad] = useState<boolean>(false);

  const navigate = useNavigate();

  // 1. Catálogo de Dispositivos de Traccar (con caché de 10 min)
  const { data: dispositivos = [], isLoading: cargandoDispositivos } = useQuery({
    queryKey: ['traccarDevices'],
    queryFn: obtenerDispositivosTraccar,
    staleTime: 10 * 60 * 1000,
  });

  // 2. Catálogo de Geocercas de Traccar (Zonas tipo A1, A2, etc.)
  const { data: geocercas = [], isLoading: cargandoGeocercas } = useQuery({
    queryKey: ['traccarGeofences'],
    queryFn: obtenerGeocercasTraccar,
    staleTime: 10 * 60 * 1000,
  });

  // Lista única de sectores detectados para el dropdown
  const listaSectores = useMemo(() => {
    const set = new Set<string>();
    for (const g of geocercas) {
      if (g.name?.trim()) set.add(g.name.trim());
    }
    for (const d of dispositivos) {
      const s = (d.attributes?.sector || '').trim();
      if (s) set.add(s);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
  }, [geocercas, dispositivos]);

  // ULTRA OPTIMIZACIÓN 1: Push-Down de filtros directamente a la consulta de Traccar
  const { targetDeviceIds, targetGeofenceId, tieneFiltroSinSector } = useMemo(() => {
    if (dispositivoFiltro) {
      const dev = dispositivos.find((d) => String(d.id) === dispositivoFiltro);
      const sectorInfo = dev ? resolverSectorDispositivo(dev, geocercas) : { geofenceId: null };
      return {
        targetDeviceIds: [Number(dispositivoFiltro)],
        targetGeofenceId: sectorInfo.geofenceId || undefined,
        tieneFiltroSinSector: false,
      };
    }

    if (sectorFiltro) {
      if (sectorFiltro === 'SIN_SECTOR') {
        const devsSinSector = dispositivos.filter((d) => {
          const { sectorNombre } = resolverSectorDispositivo(d, geocercas);
          return sectorNombre === null;
        });
        return {
          targetDeviceIds: devsSinSector.map((d) => d.id),
          targetGeofenceId: undefined,
          tieneFiltroSinSector: true,
        };
      }

      const matchGeofence = geocercas.find(
        (g) => g.name.trim().toLowerCase() === sectorFiltro.toLowerCase()
      );
      const devsSector = dispositivos.filter((d) => {
        const { sectorNombre } = resolverSectorDispositivo(d, geocercas);
        return sectorNombre?.toLowerCase() === sectorFiltro.toLowerCase();
      });

      return {
        targetDeviceIds: devsSector.map((d) => d.id),
        targetGeofenceId: matchGeofence?.id,
        tieneFiltroSinSector: false,
      };
    }

    return {
      targetDeviceIds: dispositivos.map((d) => d.id),
      targetGeofenceId: undefined,
      tieneFiltroSinSector: false,
    };
  }, [dispositivos, geocercas, dispositivoFiltro, sectorFiltro]);

  // ULTRA OPTIMIZACIÓN 2: FASE 1 Rápida (Trips + Stops en ~300-600ms)
  const queryFase1Key = useMemo(
    () => [
      'traccarHistorialFase1',
      fechaInicio,
      fechaFin,
      dispositivoFiltro,
      sectorFiltro,
      targetDeviceIds.join(','),
    ],
    [fechaInicio, fechaFin, dispositivoFiltro, sectorFiltro, targetDeviceIds]
  );

  const {
    data: itemsFase1 = [],
    isLoading: cargandoReportesFase1,
    refetch: refetchFase1,
    isFetching: isFetchingFase1,
  } = useQuery<ItemHistorial[]>({
    queryKey: queryFase1Key,
    enabled: targetDeviceIds.length > 0,
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
    queryFn: async () => {
      // 1. Verificar si ya está en caché de memoria (0 ms)
      const cacheKey = generarClaveCacheHistorial(fechaInicio, fechaFin, targetDeviceIds, targetGeofenceId);
      const enCache = obtenerHistorialCache(cacheKey);
      if (enCache) {
        return enCache;
      }

      const from = new Date(`${fechaInicio}T00:00:00-05:00`).toISOString();
      const to = new Date(`${fechaFin}T23:59:59.999-05:00`).toISOString();

      // Consultar únicamente trips y stops (elimina summary innecesario)
      const [trips, stops] = await Promise.all([
        obtenerTripsTraccar({ deviceIds: targetDeviceIds, from, to }).catch((err) => {
          console.warn('[Historial] Error en viajes:', err);
          return [];
        }),
        obtenerStopsTraccar({ deviceIds: targetDeviceIds, from, to }).catch((err) => {
          console.warn('[Historial] Error en paradas:', err);
          return [];
        }),
      ]);

      const targetDevices = dispositivos.filter((d) => targetDeviceIds.includes(d.id));

      return procesarHistorialDispositivos({
        devices: targetDevices,
        geofences: geocercas,
        trips,
        stops,
        fechaReferencia: fechaFin,
      });
    },
  });

  // Dispositivos que requieren consulta de geocercas
  const deviceIdsConSector = useMemo(() => {
    if (tieneFiltroSinSector) return [];
    return targetDeviceIds.filter((id) => {
      const dev = dispositivos.find((d) => d.id === id);
      if (!dev) return false;
      const { sectorNombre } = resolverSectorDispositivo(dev, geocercas);
      return sectorNombre !== null;
    });
  }, [targetDeviceIds, dispositivos, geocercas, tieneFiltroSinSector]);

  // ULTRA OPTIMIZACIÓN 3: FASE 2 Asíncrona (Geocercas solo para quienes tienen sector)
  const queryFase2Key = useMemo(
    () => [
      'traccarHistorialFase2Geocercas',
      fechaInicio,
      fechaFin,
      targetGeofenceId,
      deviceIdsConSector.join(','),
    ],
    [fechaInicio, fechaFin, targetGeofenceId, deviceIdsConSector]
  );

  const {
    data: geofenceIntervals = [],
    isFetching: cargandoFase2,
    refetch: refetchFase2,
  } = useQuery<TraccarReportGeofence[]>({
    queryKey: queryFase2Key,
    enabled: deviceIdsConSector.length > 0 && itemsFase1.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const from = new Date(`${fechaInicio}T00:00:00-05:00`).toISOString();
      const to = new Date(`${fechaFin}T23:59:59.999-05:00`).toISOString();

      return obtenerGeofenceReportsTraccar({
        deviceIds: deviceIdsConSector,
        geofenceId: targetGeofenceId,
        from,
        to,
      }).catch((err) => {
        console.warn('[Historial] Error en geocercas Fase 2:', err);
        return [];
      });
    },
  });

  // ULTRA OPTIMIZACIÓN 4: Fusión reactiva y caché persistente
  const itemsHistorial = useMemo(() => {
    if (!itemsFase1.length) return [];

    // Si ningún dispositivo tiene sector asignado, no hay nada que esperar
    if (!deviceIdsConSector.length) {
      const finalItems = itemsFase1.map((it) => ({ ...it, cargandoGeocercas: false }));
      const cacheKey = generarClaveCacheHistorial(fechaInicio, fechaFin, targetDeviceIds, targetGeofenceId);
      guardarHistorialCache(cacheKey, finalItems);
      return finalItems;
    }

    // Si ya llegaron las geocercas o terminó la consulta
    if (geofenceIntervals.length > 0 || !cargandoFase2) {
      const enriquecidos = enriquecerHistorialConGeocercas({
        items: itemsFase1,
        geofences: geocercas,
        geofenceIntervals,
      });
      const cacheKey = generarClaveCacheHistorial(fechaInicio, fechaFin, targetDeviceIds, targetGeofenceId);
      guardarHistorialCache(cacheKey, enriquecidos);
      return enriquecidos;
    }

    return itemsFase1;
  }, [
    itemsFase1,
    geofenceIntervals,
    deviceIdsConSector,
    cargandoFase2,
    geocercas,
    fechaInicio,
    fechaFin,
    targetDeviceIds,
    targetGeofenceId,
  ]);

  // Filtrado final en memoria (solo para checkbox de actividad)
  const itemsFiltrados = useMemo(() => {
    if (!soloConActividad) return itemsHistorial;
    return itemsHistorial.filter((item) => item.tieneActividad);
  }, [itemsHistorial, soloConActividad]);

  // Definición tipada de Columnas con el campo Fecha agregado al inicio
  const columns = useMemo<ColumnDef<ItemHistorial, unknown>[]>(
    () => [
      {
        header: 'Fecha',
        accessorKey: 'fecha',
        cell: (info) => (
          <div className="flex items-center gap-1.5 font-mono text-zinc-700 dark:text-zinc-300">
            <Calendar size={13} className="text-[#155BD0] dark:text-blue-400 shrink-0" />
            <span className="tabular-nums font-medium text-xs">
              {formatearFecha(info.getValue() as string)}
            </span>
          </div>
        ),
      },
      {
        header: 'Dispositivo',
        accessorKey: 'dispositivoNombre',
        cell: (info) => (
          <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        header: 'Geocerca',
        accessorKey: 'sectorAsignado',
        cell: (info) => {
          const sector = info.getValue() as string | null;
          if (!sector) {
            return (
              <span className="inline-flex items-center px-2 py-0.5 rounded-[21px] text-2xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-700/80">
                Sin sector
              </span>
            );
          }
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[21px] text-2xs font-bold bg-[#155BD0]/10 dark:bg-blue-400/15 text-[#155BD0] dark:text-blue-300 border border-[#155BD0]/20">
              <MapPin size={10} className="shrink-0 text-[#155BD0] dark:text-blue-400" />
              <span>{sector}</span>
            </span>
          );
        },
      },
      {
        header: 'Inicio',
        accessorKey: 'inicio',
        cell: (info) => {
          const val = info.getValue() as string | null;
          return (
            <span className="font-mono text-zinc-600 dark:text-zinc-400 tabular-nums text-xs">
              {val ? formatearHora(val) : '—'}
            </span>
          );
        },
      },
      {
        header: 'Fin',
        accessorKey: 'fin',
        cell: (info) => {
          const val = info.getValue() as string | null;
          return (
            <span className="font-mono text-zinc-600 dark:text-zinc-400 tabular-nums text-xs">
              {val ? formatearHora(val) : '—'}
            </span>
          );
        },
      },
      {
        header: 'Duración',
        accessorKey: 'duracionMinutos',
        cell: (info) => <CeldaDuracionActiva minutos={(info.getValue() as number) || 0} />,
      },
      {
        header: 'Min Dentro',
        accessorKey: 'minutosDentro',
        cell: (info) => {
          const row = info.row.original;
          if (row.sectorAsignado === null) {
            return (
              <span
                className="text-zinc-400 dark:text-zinc-600 cursor-help"
                title="Sin sector asignado (no aplica penalización)"
              >
                —
              </span>
            );
          }
          if (row.cargandoGeocercas) {
            return (
              <div className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500 text-2xs animate-pulse">
                <Loader2 size={10} className="animate-spin text-[#155BD0] dark:text-blue-400" />
                <span>Calculando...</span>
              </div>
            );
          }
          const val = (info.getValue() as number) ?? 0;
          return (
            <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400 tabular-nums text-xs">
              {val} min
            </span>
          );
        },
      },
      {
        header: 'Min Fuera',
        accessorKey: 'minutosFuera',
        cell: (info) => {
          const row = info.row.original;
          if (row.sectorAsignado === null) {
            return (
              <span
                className="text-zinc-400 dark:text-zinc-600 cursor-help"
                title="Sin sector asignado (no aplica penalización)"
              >
                —
              </span>
            );
          }
          if (row.cargandoGeocercas) {
            return (
              <div className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500 text-2xs animate-pulse">
                <Loader2 size={10} className="animate-spin text-[#155BD0] dark:text-blue-400" />
                <span>Calculando...</span>
              </div>
            );
          }
          const val = (info.getValue() as number) ?? 0;
          return (
            <span
              className={`font-mono font-medium tabular-nums text-xs ${
                val > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-400 dark:text-zinc-500'
              }`}
            >
              {val} min
            </span>
          );
        },
      },
      {
        header: 'Detenido',
        accessorKey: 'minutosDetenido',
        cell: (info) => {
          const val = (info.getValue() as number) || 0;
          return (
            <span className="font-mono text-zinc-600 dark:text-zinc-400 tabular-nums text-xs">
              {val > 0 ? `${val} min` : '0 min'}
            </span>
          );
        },
      },
      {
        header: 'Distancia',
        accessorKey: 'distanciaKm',
        cell: (info) => {
          const val = Number((info.getValue() as number) || 0);
          return (
            <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 tabular-nums text-xs">
              {val.toFixed(1)} km
            </span>
          );
        },
      },
      {
        header: '',
        id: 'acciones',
        cell: ({ row }) => (
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/recorrido/${row.original.deviceId}?fecha=${row.original.fecha}`);
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[21px] text-2xs font-semibold text-[#155BD0] dark:text-blue-400 hover:bg-[#155BD0]/10 focus:outline-none focus:ring-2 focus:ring-[#155BD0] active:scale-95 transition-all cursor-pointer"
              title="Ver recorrido y geocerca en el mapa"
              aria-label={`Ver ruta de ${row.original.dispositivoNombre} para el día ${row.original.fecha}`}
            >
              <Eye size={12} />
              <span>Ver ruta</span>
              <ChevronRight size={12} />
            </button>
          </div>
        ),
      },
    ],
    [navigate]
  );

  // Totales acumulados
  const totales = useMemo(() => {
    return itemsFiltrados.reduce(
      (acc, item) => ({
        registros: acc.registros + 1,
        activos: acc.activos + (item.tieneActividad ? 1 : 0),
        minutosActivos: acc.minutosActivos + item.duracionMinutos,
        minutosDetenido: acc.minutosDetenido + item.minutosDetenido,
        distanciaKm: acc.distanciaKm + item.distanciaKm,
      }),
      { registros: 0, activos: 0, minutosActivos: 0, minutosDetenido: 0, distanciaKm: 0 }
    );
  }, [itemsFiltrados]);

  // Exportar a Excel con formato Apple estructurado
  const handleExport = () => {
    const exportData = itemsFiltrados.map((item) => ({
      Fecha: item.fecha ? formatearFecha(item.fecha) : '-',
      Dispositivo: item.dispositivoNombre,
      Geocerca: item.sectorAsignado || 'Sin sector',
      Inicio: item.inicio ? formatearHora(item.inicio) : '-',
      Fin: item.fin ? formatearHora(item.fin) : '-',
      'Duración Activa': `${item.duracionMinutos} min`,
      'Min Dentro': item.minutosDentro !== null ? `${item.minutosDentro} min` : 'N/A',
      'Min Fuera': item.minutosFuera !== null ? `${item.minutosFuera} min` : 'N/A',
      Detenido: `${item.minutosDetenido} min`,
      'Distancia (km)': Number(item.distanciaKm.toFixed(1)),
    }));

    exportarExcel(exportData, `Historial_Traccar_${fechaInicio}_al_${fechaFin}`);
  };

  const handleActualizar = () => {
    refetchFase1();
    if (deviceIdsConSector.length > 0) {
      refetchFase2();
    }
  };

  const estaCargando = cargandoDispositivos || cargandoGeocercas || cargandoReportesFase1;
  const isFetching = isFetchingFase1 || cargandoFase2;

  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-zinc-950 p-4 sm:p-6 lg:p-8 font-sans select-auto transition-colors">
      {/* Contenedor Centrado Apple UI con 4px Grid */}
      <div className="max-w-7xl mx-auto w-full flex flex-col gap-5 sm:gap-6">
        {/* Encabezado de Página estilo Apple */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="size-9 rounded-[21px] bg-blue-600/10 dark:bg-blue-400/20 text-[#155BD0] dark:text-blue-400 flex items-center justify-center shadow-xs">
                <History size={19} />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 text-balance">
                Historial de Recorridos
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 pl-11.5 text-pretty">
              Auditoría de jornadas diarias, kilometraje y cumplimiento de sectores conectado directamente a Traccar.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleActualizar}
              disabled={isFetching}
              className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 text-xs font-semibold rounded-[21px] shadow-2xs transition-all cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#155BD0]"
              title="Recargar datos de Traccar"
              aria-label="Actualizar datos de Traccar"
            >
              <RefreshCw size={13} className={isFetching ? 'animate-spin text-[#155BD0]' : ''} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>

            <button
              type="button"
              onClick={handleExport}
              disabled={itemsFiltrados.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-[#155BD0] hover:bg-[#0858DC] text-white text-xs font-semibold rounded-[21px] shadow-xs transition-all cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#155BD0] focus:ring-offset-2"
              aria-label="Exportar datos a Excel"
            >
              <Download size={14} />
              <span>Exportar Excel</span>
            </button>
          </div>
        </div>

        {/* Widgets Métricos estilo Apple Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-[21px] border border-zinc-200/80 dark:border-zinc-800 shadow-xs hover:border-[#B5C7D8] transition-all">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium mb-1">
              <span>Jornadas con Actividad</span>
              <div className="size-7 rounded-xl bg-blue-500/10 text-[#155BD0] dark:text-blue-400 flex items-center justify-center">
                <Activity size={15} />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
              {totales.activos}{' '}
              <span className="text-xs font-normal text-zinc-400">/ {totales.registros}</span>
            </div>
            <p className="text-2xs text-zinc-400 dark:text-zinc-500 mt-1">Con viajes registrados</p>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-[21px] border border-zinc-200/80 dark:border-zinc-800 shadow-xs hover:border-[#B5C7D8] transition-all">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium mb-1">
              <span>Tiempo Activo Acumulado</span>
              <div className="size-7 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Clock size={15} />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
              {formatearDuracion(totales.minutosActivos)}
            </div>
            <p className="text-2xs text-zinc-400 dark:text-zinc-500 mt-1">
              Detenido total: {formatearDuracion(totales.minutosDetenido)}
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-[21px] border border-zinc-200/80 dark:border-zinc-800 shadow-xs hover:border-[#B5C7D8] transition-all">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium mb-1">
              <span>Distancia Recorrida</span>
              <div className="size-7 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Milestone size={15} />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
              {totales.distanciaKm.toFixed(1)} km
            </div>
            <p className="text-2xs text-zinc-400 dark:text-zinc-500 mt-1">
              Odómetro GPS auditado
            </p>
          </div>
        </div>

        {/* Barra de Filtros Apple UI */}
        <div className="bg-white dark:bg-zinc-900 p-3.5 sm:p-4 rounded-[21px] shadow-xs border border-zinc-200/80 dark:border-zinc-800 flex flex-wrap gap-3 items-center">
          <FiltroFechas
            fechaInicio={fechaInicio}
            fechaFin={fechaFin}
            onInicioChange={setFechaInicio}
            onFinChange={setFechaFin}
          />

          {/* Filtro por Dispositivo */}
          <div className="flex items-center gap-1.5 bg-zinc-50/80 dark:bg-zinc-900/60 p-2 sm:p-2.5 rounded-[21px] border border-zinc-200/80 dark:border-zinc-800/80">
            <select
              value={dispositivoFiltro}
              onChange={(e) => setDispositivoFiltro(e.target.value)}
              className="bg-white dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700/80 rounded-xl px-2.5 py-1 text-xs font-medium text-zinc-900 dark:text-zinc-100 shadow-2xs focus:ring-2 focus:ring-[#155BD0]/20 focus:border-[#155BD0] cursor-pointer"
            >
              <option value="">Todos los perifoneadores</option>
              {dispositivos.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Sector / Geocerca */}
          <div className="flex items-center gap-1.5 bg-zinc-50/80 dark:bg-zinc-900/60 p-2 sm:p-2.5 rounded-[21px] border border-zinc-200/80 dark:border-zinc-800/80">
            <Filter size={13} className="text-[#155BD0] dark:text-blue-400" />
            <select
              value={sectorFiltro}
              onChange={(e) => setSectorFiltro(e.target.value)}
              className="bg-white dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700/80 rounded-xl px-2.5 py-1 text-xs font-medium text-zinc-900 dark:text-zinc-100 shadow-2xs focus:ring-2 focus:ring-[#155BD0]/20 focus:border-[#155BD0] cursor-pointer"
            >
              <option value="">Todos los sectores</option>
              <option value="SIN_SECTOR">Sin sector asignado</option>
              {listaSectores.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

          {/* Checkbox para ocultar sin actividad */}
          <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 ml-auto cursor-pointer select-none bg-zinc-50/80 dark:bg-zinc-900/60 px-3 py-2 rounded-[21px] border border-zinc-200/80 dark:border-zinc-800/80">
            <input
              type="checkbox"
              checked={soloConActividad}
              onChange={(e) => setSoloConActividad(e.target.checked)}
              className="rounded text-[#155BD0] focus:ring-[#155BD0] size-3.5"
            />
            <span>Solo con actividad</span>
          </label>
        </div>

        {/* Tabla de Resultados estilo Apple Numbers */}
        <TablaDatos
          data={itemsFiltrados}
          columns={columns}
          isLoading={estaCargando}
          onRowClick={(row) => navigate(`/recorrido/${row.deviceId}?fecha=${row.fecha}`)}
          className="rounded-[21px]"
          footer={
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50/80 dark:bg-zinc-950/60 border-t border-zinc-200/80 dark:border-zinc-800"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    {itemsFiltrados.length} registros listados
                  </span>
                  <span className="text-zinc-300 dark:text-zinc-700">·</span>
                  <span>
                    Tiempo activo total:{' '}
                    <strong className="font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
                      {formatearDuracion(totales.minutosActivos)}
                    </strong>
                  </span>
                  <span className="text-zinc-300 dark:text-zinc-700">·</span>
                  <span>
                    Distancia total:{' '}
                    <strong className="font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
                      {totales.distanciaKm.toFixed(1)} km
                    </strong>
                  </span>
                </div>
              </td>
            </tr>
          }
        />
      </div>
    </div>
  );
};

export default HistorialRecorridosPage;
