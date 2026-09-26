import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import {
  History,
  Clock,
  MapPin,
  Users,
  ChevronRight,
  Activity,
  Filter,
  Milestone,
  RefreshCw,
  Eye,
} from 'lucide-react';
import type { ItemHistorial } from './api';
import { useHistorialCatalogos } from './hooks/useHistorialCatalogos';
import { useHistorialFiltros } from './hooks/useHistorialFiltros';
import { useHistorialResumenQuery } from './hooks/useHistorialResumenQuery';
import PerifoneadorCombobox from './components/PerifoneadorCombobox';
import FiltroFechas from '../shared/components/ui/FiltroFechas';
import TablaDatos from '../shared/components/ui/TablaDatos';
import { formatearDuracion } from '../shared/utils/formato';
import { exportarExcel } from '../shared/utils/excel';
import { exportarHistorialPDF } from '../shared/utils/pdf';
import BotonExportarHistorial from './components/BotonExportarHistorial';

/**
 * Página de Historial de Recorridos con diseño Apple UI System.
 *
 * Utiliza el endpoint nativo ultrarrápido `/api/reports/summary` de Traccar,
 * cruzando datos con catálogo de perifoneadores, geocercas y grupos.
 */
export const HistorialRecorridosPage: React.FC = () => {
  const navigate = useNavigate();

  const { dispositivos, geocercas, grupos, listaSectores, listaGrupos, listaBases, cargando: cargandoCatalogos } =
    useHistorialCatalogos();

  const { filtros, setFiltros, targetDeviceIds } = useHistorialFiltros(dispositivos, geocercas);

  const {
    data: itemsResumen = [],
    isLoading: cargandoResumen,
    refetch: refetchResumen,
    isFetching,
  } = useHistorialResumenQuery({
    dispositivos,
    geocercas,
    grupos,
    targetDeviceIds,
    filtros,
    cargandoCatalogos,
  });

  // Filtrado final en memoria (checkbox de actividad)
  const itemsFiltrados = useMemo(() => {
    if (!filtros.soloConActividad) return itemsResumen;
    return itemsResumen.filter((item) => item.tieneActividad);
  }, [itemsResumen, filtros.soloConActividad]);

  const irADetalle = (deviceId: number) => {
    navigate(`/recorrido/${deviceId}?desde=${filtros.fechaInicio}&hasta=${filtros.fechaFin}`);
  };

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
        header: 'Grupo',
        accessorKey: 'grupoNombre',
        cell: (info) => {
          const grupo = info.getValue() as string | null;
          if (!grupo) {
            return (
              <span className="inline-flex items-center px-2 py-0.5 rounded-[21px] text-2xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-700/80">
                Sin grupo
              </span>
            );
          }
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[21px] text-2xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
              <Users size={10} className="shrink-0 text-zinc-500 dark:text-zinc-400" />
              <span>{grupo}</span>
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
        header: 'Base',
        accessorKey: 'base',
        cell: (info) => {
          const val = info.getValue() as string | null;
          return (
            <span className="font-mono text-zinc-600 dark:text-zinc-400 text-xs">{val || '—'}</span>
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
                irADetalle(row.original.deviceId);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtros.fechaInicio, filtros.fechaFin]
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

  const handleExportExcel = () => {
    const exportData = itemsFiltrados.map((item) => ({
      Dispositivo: item.dispositivoNombre,
      'DNI / Documento': item.dni || '-',
      Distancia: Number(item.distanciaKm.toFixed(1)),
      Grupo: item.grupoNombre || 'Sin grupo',
      Sector: item.sectorAsignado || 'Sin sector',
      Base: item.base || '-',
    }));

    exportarExcel(exportData, `Historial_Traccar_${filtros.fechaInicio}_al_${filtros.fechaFin}`);
  };

  const handleExportPDF = () => {
    exportarHistorialPDF(itemsFiltrados, {
      fechaInicio: filtros.fechaInicio,
      fechaFin: filtros.fechaFin,
      sector: filtros.sectorFiltro || undefined,
    });
  };

  const estaCargando = cargandoCatalogos || cargandoResumen;

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
              Resumen consolidado de kilometraje y actividad conectado directamente a Traccar.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => refetchResumen()}
              disabled={isFetching}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-900 active:bg-black text-white text-xs font-semibold rounded-[21px] shadow-xs transition-all cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-zinc-500"
              title="Recargar datos de Traccar"
              aria-label="Actualizar datos de Traccar"
            >
              <RefreshCw size={13} className={isFetching ? 'animate-spin text-white' : ''} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>

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
            <p className="text-2xs text-zinc-400 dark:text-zinc-500 mt-1">Odómetro GPS consolidado</p>
          </div>
        </div>

        {/* Barra de Filtros Apple UI */}
        <div className="bg-white dark:bg-zinc-900 p-3.5 sm:p-4 rounded-[21px] shadow-xs border border-zinc-200/80 dark:border-zinc-800 flex flex-wrap gap-3 items-center">
          <FiltroFechas
            fechaInicio={filtros.fechaInicio}
            fechaFin={filtros.fechaFin}
            onCambio={(obj) => setFiltros({ fechaInicio: obj.desde, fechaFin: obj.hasta })}
          />

          <PerifoneadorCombobox
            dispositivos={dispositivos}
            value={filtros.dispositivoFiltro}
            onChange={(v) => setFiltros({ dispositivoFiltro: v })}
          />

          {/* Filtro por Sector / Geocerca */}
          <div className="flex items-center gap-1.5 bg-zinc-50/80 dark:bg-zinc-900/60 p-2 sm:p-2.5 rounded-[21px] border border-zinc-200/80 dark:border-zinc-800/80">
            <Filter size={13} className="text-[#155BD0] dark:text-blue-400" />
            <select
              value={filtros.sectorFiltro}
              onChange={(e) => setFiltros({ sectorFiltro: e.target.value })}
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

          {/* Filtro por Grupo */}
          <div className="flex items-center gap-1.5 bg-zinc-50/80 dark:bg-zinc-900/60 p-2 sm:p-2.5 rounded-[21px] border border-zinc-200/80 dark:border-zinc-800/80">
            <select
              value={filtros.grupoFiltro}
              onChange={(e) => setFiltros({ grupoFiltro: e.target.value })}
              className="bg-white dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700/80 rounded-xl px-2.5 py-1 text-xs font-medium text-zinc-900 dark:text-zinc-100 shadow-2xs focus:ring-2 focus:ring-[#155BD0]/20 focus:border-[#155BD0] cursor-pointer"
            >
              <option value="">Todos los grupos</option>
              {listaGrupos.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Base */}
          <div className="flex items-center gap-1.5 bg-zinc-50/80 dark:bg-zinc-900/60 p-2 sm:p-2.5 rounded-[21px] border border-zinc-200/80 dark:border-zinc-800/80">
            <select
              value={filtros.baseFiltro}
              onChange={(e) => setFiltros({ baseFiltro: e.target.value })}
              className="bg-white dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700/80 rounded-xl px-2.5 py-1 text-xs font-medium text-zinc-900 dark:text-zinc-100 shadow-2xs focus:ring-2 focus:ring-[#155BD0]/20 focus:border-[#155BD0] cursor-pointer"
            >
              <option value="">Todas las bases</option>
              {listaBases.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Checkbox para ocultar sin actividad */}
          <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 ml-auto cursor-pointer select-none bg-zinc-50/80 dark:bg-zinc-900/60 px-3 py-2 rounded-[21px] border border-zinc-200/80 dark:border-zinc-800/80">
            <input
              type="checkbox"
              checked={filtros.soloConActividad}
              onChange={(e) => setFiltros({ soloConActividad: e.target.checked })}
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
          onRowClick={(row) => irADetalle(row.deviceId)}
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
