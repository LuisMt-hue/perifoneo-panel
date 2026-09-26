import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import {
  History,
  Clock,
  MapPin,
  ChevronRight,
  Activity,
  Filter,
  Milestone,
  AlertTriangle,
  RefreshCw,
  Eye,
  CheckCircle2,
  MinusCircle,
} from 'lucide-react';
import {
  obtenerDispositivosTraccar,
  obtenerGeocercasTraccar,
  obtenerSummaryTraccar,
  procesarResumenHistorial,
  resolverSectorDispositivo,
  type ItemHistorial,
} from './api';
import FiltroFechas from '../shared/components/ui/FiltroFechas';
import TablaDatos from '../shared/components/ui/TablaDatos';
import { formatearHora, formatearDuracion, hoy } from '../shared/utils/formato';
import { exportarExcel } from '../shared/utils/excel';
import { exportarHistorialPDF } from '../shared/utils/pdf';
import BotonExportarHistorial from './components/BotonExportarHistorial';

/**
 * Constantes de umbrales y tiempos de caché para el Historial de Recorridos
 */
export const DURATION_EXCESSIVE_MINUTES = 300; // 5 horas
export const DURATION_WARNING_MINUTES = 240;   // 4 horas
export const DURATION_OPTIMAL_MINUTES = 60;    // 1 hora
export const CATALOG_STALE_TIME_MS = 10 * 60 * 1000; // 10 minutos
export const REPORTS_STALE_TIME_MS = 5 * 60 * 1000;  // 5 minutos

/**
 * Celda para la duración con semáforo de 3 colores según la jornada (escala 1h a 6h)
 * y tooltip flotante interactivo de advertencia estilo Apple macOS al superar las 5 horas.
 */
const CeldaDuracionActiva: React.FC<{ minutos: number }> = ({ minutos }) => {
  if (minutos <= 0) {
    return <span className="font-mono text-zinc-400 dark:text-zinc-600 tabular-nums text-xs">0 min</span>;
  }

  let colorClase =
    'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700';
  const esExcesivo = minutos >= DURATION_EXCESSIVE_MINUTES;

  if (minutos >= DURATION_EXCESSIVE_MINUTES) {
    colorClase =
      'bg-rose-500/15 dark:bg-rose-400/20 text-rose-700 dark:text-rose-300 border-rose-500/35 font-bold';
  } else if (minutos >= DURATION_WARNING_MINUTES) {
    colorClase =
      'bg-amber-500/10 dark:bg-amber-400/15 text-amber-700 dark:text-amber-300 border-amber-500/25';
  } else if (minutos >= DURATION_OPTIMAL_MINUTES) {
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

      {esExcesivo && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-50 pointer-events-none transition-all">
          <div className="bg-zinc-900/95 dark:bg-zinc-100/95 backdrop-blur-md text-white dark:text-zinc-900 text-2xs font-semibold px-3 py-1.5 rounded-xl shadow-xl whitespace-nowrap border border-zinc-700/60 dark:border-zinc-300 flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150">
            <AlertTriangle size={11} className="text-amber-400 dark:text-amber-600 shrink-0" />
            <span>Tiempo excesivo (≥5h) · Revisar jornada</span>
          </div>
          <div className="size-2 bg-zinc-900 dark:bg-zinc-100 rotate-45 -mt-1 border-r border-b border-zinc-700/60 dark:border-zinc-300" />
        </div>
      )}
    </div>
  );
};

/**
 * Página de Historial de Recorridos con diseño Apple UI System.
 *
 * Utiliza el endpoint nativo ultrarrápido `/api/reports/summary` de Traccar,
 * cruzando datos con catálogo de perifoneadores, sectores y metadatos.
 * Permite paginación fluida, filtrado ágil y exportación a Excel y PDF.
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
    staleTime: CATALOG_STALE_TIME_MS,
  });

  // 2. Catálogo de Geocercas de Traccar (Zonas tipo A1, A2, etc.)
  const { data: geocercas = [], isLoading: cargandoGeocercas } = useQuery({
    queryKey: ['traccarGeofences'],
    queryFn: obtenerGeocercasTraccar,
    staleTime: CATALOG_STALE_TIME_MS,
  });

  // Lista única de sectores detectados para el dropdown
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

  // Push-Down de filtros: determina los IDs de dispositivos a consultar
  const targetDeviceIds = useMemo(() => {
    if (dispositivoFiltro) {
      return [Number(dispositivoFiltro)];
    }

    if (sectorFiltro) {
      if (sectorFiltro === 'SIN_SECTOR') {
        return dispositivos
          .filter((d) => resolverSectorDispositivo(d, geocercas).sectorNombre === null)
          .map((d) => d.id);
      }

      return dispositivos
        .filter(
          (d) =>
            resolverSectorDispositivo(d, geocercas).sectorNombre?.toLowerCase() ===
            sectorFiltro.toLowerCase()
        )
        .map((d) => d.id);
    }

    return dispositivos.map((d) => d.id);
  }, [dispositivos, geocercas, dispositivoFiltro, sectorFiltro]);

  // Consulta Ultrarrápida con /api/reports/summary (~150 ms)
  const {
    data: itemsResumen = [],
    isLoading: cargandoResumen,
    refetch: refetchResumen,
    isFetching,
  } = useQuery<ItemHistorial[]>({
    queryKey: [
      'traccarHistorialResumen',
      fechaInicio,
      fechaFin,
      dispositivoFiltro,
      sectorFiltro,
      targetDeviceIds.join(','),
      dispositivos.length,
      geocercas.length,
    ],
    enabled: !cargandoDispositivos && dispositivos.length > 0,
    staleTime: REPORTS_STALE_TIME_MS,
    queryFn: async () => {
      const from = new Date(`${fechaInicio}T00:00:00-05:00`).toISOString();
      const to = new Date(`${fechaFin}T23:59:59.999-05:00`).toISOString();

      // Garantizar que targetDevices se resuelve desde la lista viva de dispositivos
      const targetDevices =
        targetDeviceIds.length > 0
          ? dispositivos.filter((d) => targetDeviceIds.includes(d.id))
          : dispositivos;

      const deviceIds = targetDevices.map((d) => d.id);
      if (deviceIds.length === 0) return [];

      const summaries = await obtenerSummaryTraccar({
        deviceIds,
        from,
        to,
      }).catch((err) => {
        console.warn('[Historial] Error en resumen Traccar:', err);
        return [];
      });

      const fechaEtiqueta =
        fechaInicio === fechaFin ? fechaInicio : `${fechaInicio} al ${fechaFin}`;

      return procesarResumenHistorial({
        devices: targetDevices,
        geofences: geocercas,
        summaries,
        fechaReferencia: fechaEtiqueta,
      });
    },
  });

  // Filtrado final en memoria (checkbox de actividad)
  const itemsFiltrados = useMemo(() => {
    if (!soloConActividad) return itemsResumen;
    return itemsResumen.filter((item) => item.tieneActividad);
  }, [itemsResumen, soloConActividad]);

  // Definición tipada de Columnas optimizada para el Reporte Resumen
  const columns = useMemo<ColumnDef<ItemHistorial, unknown>[]>(
    () => [
      {
        header: 'Dispositivo',
        accessorKey: 'dispositivoNombre',
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="flex flex-col">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">
                {row.dispositivoNombre}
              </span>
              {row.conductor && row.conductor !== row.dispositivoNombre && (
                <span className="text-3xs text-zinc-400 dark:text-zinc-500 font-medium">
                  {row.conductor}
                </span>
              )}
            </div>
          );
        },
      },
      {
        header: 'DNI / Doc',
        accessorKey: 'dni',
        cell: (info) => {
          const val = info.getValue() as string;
          return (
            <span className="font-mono text-zinc-600 dark:text-zinc-400 tabular-nums text-xs">
              {val || '—'}
            </span>
          );
        },
      },
      {
        header: 'Placa',
        accessorKey: 'placa',
        cell: (info) => {
          const val = info.getValue() as string;
          return (
            <span className="font-mono text-zinc-600 dark:text-zinc-400 tabular-nums text-xs">
              {val || '—'}
            </span>
          );
        },
      },
      {
        header: 'Sector',
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
        header: 'Vel. Promedio',
        accessorKey: 'velocidadMediaKmh',
        cell: (info) => {
          const val = Number((info.getValue() as number) || 0);
          return (
            <span className="font-mono text-zinc-700 dark:text-zinc-300 tabular-nums text-xs">
              {val > 0 ? `${val.toFixed(1)} km/h` : '0 km/h'}
            </span>
          );
        },
      },
      {
        header: 'Vel. Máxima',
        accessorKey: 'velocidadMaximaKmh',
        cell: (info) => {
          const val = Number((info.getValue() as number) || 0);
          return (
            <span className="font-mono text-zinc-700 dark:text-zinc-300 tabular-nums text-xs">
              {val > 0 ? `${val.toFixed(1)} km/h` : '0 km/h'}
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
        header: 'Tiempo Activo',
        accessorKey: 'duracionMinutos',
        cell: (info) => <CeldaDuracionActiva minutos={(info.getValue() as number) || 0} />,
      },
      {
        header: 'Estado',
        accessorKey: 'tieneActividad',
        cell: (info) => {
          const activo = Boolean(info.getValue());
          return activo ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[21px] text-2xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
              <CheckCircle2 size={11} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Activo</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[21px] text-2xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200/60 dark:border-zinc-700/60">
              <MinusCircle size={11} className="text-zinc-400 shrink-0" />
              <span>Sin mov.</span>
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
                navigate(`/recorrido/${row.original.deviceId}?fecha=${fechaInicio}`);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[21px] text-2xs font-semibold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
              title="Ver recorrido y geocerca en el mapa"
              aria-label={`Ver ruta de ${row.original.dispositivoNombre}`}
            >
              <Eye size={12} />
              <span>Ver ruta</span>
              <ChevronRight size={12} />
            </button>
          </div>
        ),
      },
    ],
    [navigate, fechaInicio]
  );

  // Totales acumulados
  const totales = useMemo(() => {
    return itemsFiltrados.reduce(
      (acc, item) => ({
        registros: acc.registros + 1,
        activos: acc.activos + (item.tieneActividad ? 1 : 0),
        minutosActivos: acc.minutosActivos + (item.duracionMinutos || 0),
        distanciaKm: acc.distanciaKm + item.distanciaKm,
      }),
      { registros: 0, activos: 0, minutosActivos: 0, distanciaKm: 0 }
    );
  }, [itemsFiltrados]);

  // Exportar a Excel
  const handleExportExcel = () => {
    const exportData = itemsFiltrados.map((item) => ({
      Dispositivo: item.dispositivoNombre,
      'DNI / Documento': item.dni || '-',
      Conductor: item.conductor || '-',
      Placa: item.placa || '-',
      Sector: item.sectorAsignado || 'Sin sector',
      Inicio: item.inicio ? formatearHora(item.inicio) : '-',
      Fin: item.fin ? formatearHora(item.fin) : '-',
      'Distancia (km)': Number(item.distanciaKm.toFixed(1)),
      'Vel. Promedio (km/h)': Number((item.velocidadMediaKmh || 0).toFixed(1)),
      'Vel. Máxima (km/h)': Number((item.velocidadMaximaKmh || 0).toFixed(1)),
      'Tiempo Activo': formatearDuracion(item.duracionMinutos || 0),
      Estado: item.tieneActividad ? 'Activo' : 'Sin movimiento',
    }));

    exportarExcel(exportData, `Historial_Traccar_${fechaInicio}_al_${fechaFin}`);
  };

  // Exportar a PDF
  const handleExportPDF = () => {
    exportarHistorialPDF(itemsFiltrados, {
      fechaInicio,
      fechaFin,
      sector: sectorFiltro || undefined,
    });
  };

  const handleActualizar = () => {
    refetchResumen();
  };

  const estaCargando = cargandoDispositivos || cargandoGeocercas || cargandoResumen;

  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-zinc-950 p-4 sm:p-6 lg:p-8 font-sans select-auto transition-colors">
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
              Resumen consolidado de kilometraje, velocidades y actividad conectado directamente a Traccar.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleActualizar}
              disabled={isFetching}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-900 active:bg-black text-white text-xs font-semibold rounded-[21px] shadow-xs transition-all cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-zinc-500"
              title="Recargar datos de Traccar"
              aria-label="Actualizar datos de Traccar"
            >
              <RefreshCw size={13} className={isFetching ? 'animate-spin text-white' : ''} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>

            {/* Menú Desplegable de Exportación (Excel y PDF) */}
            <BotonExportarHistorial
              onExportarExcel={handleExportExcel}
              onExportarPDF={handleExportPDF}
              deshabilitado={itemsFiltrados.length === 0}
            />
          </div>
        </div>

        {/* Widgets Métricos estilo Apple Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-[21px] border border-zinc-200/80 dark:border-zinc-800 shadow-xs hover:border-[#B5C7D8] transition-all">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium mb-1">
              <span>Unidades con Actividad</span>
              <div className="size-7 rounded-xl bg-blue-500/10 text-[#155BD0] dark:text-blue-400 flex items-center justify-center">
                <Activity size={15} />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
              {totales.activos}{' '}
              <span className="text-xs font-normal text-zinc-400">/ {totales.registros}</span>
            </div>
            <p className="text-2xs text-zinc-400 dark:text-zinc-500 mt-1">Con kilometraje registrado</p>
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
              Tiempo en movimiento auditado
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-[21px] border border-zinc-200/80 dark:border-zinc-800 shadow-xs hover:border-[#B5C7D8] transition-all">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium mb-1">
              <span>Distancia Total Recorrida</span>
              <div className="size-7 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Milestone size={15} />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
              {totales.distanciaKm.toFixed(1)} km
            </div>
            <p className="text-2xs text-zinc-400 dark:text-zinc-500 mt-1">
              Odómetro GPS consolidado
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

        {/* Tabla de Resultados con Paginación Integrada (10, 25, 50 registros) */}
        <TablaDatos
          data={itemsFiltrados}
          columns={columns}
          isLoading={estaCargando}
          onRowClick={(row) => navigate(`/recorrido/${row.deviceId}?fecha=${fechaInicio}`)}
          className="rounded-[21px]"
          paginacion={true}
          tamanoPaginaDefault={25}
          footer={
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50/80 dark:bg-zinc-950/60 border-t border-zinc-200/80 dark:border-zinc-800"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    {itemsFiltrados.length} unidades listadas
                  </span>
                  <span className="text-zinc-300 dark:text-zinc-700">·</span>
                  <span>
                    Activas:{' '}
                    <strong className="font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
                      {totales.activos}
                    </strong>
                  </span>
                  <span className="text-zinc-300 dark:text-zinc-700">·</span>
                  <span>
                    Distancia acumulada:{' '}
                    <strong className="font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
                      {totales.distanciaKm.toFixed(1)} km
                    </strong>
                  </span>
                  <span className="text-zinc-300 dark:text-zinc-700">·</span>
                  <span>
                    Tiempo activo:{' '}
                    <strong className="font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
                      {formatearDuracion(totales.minutosActivos)}
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
