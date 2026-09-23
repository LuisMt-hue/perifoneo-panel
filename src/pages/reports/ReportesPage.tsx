import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import {
  BarChart3,
  Download,
  FileText,
  UserCheck,
  Map,
} from 'lucide-react';
import {
  obtenerResumenPerifoneadoresTraccar,
  obtenerResumenSectoresTraccar,
} from '../../services/api/traccarHistory';
import FiltroFechas from '../../components/ui/FiltroFechas';
import TablaDatos from '../../components/ui/TablaDatos';
import {
  formatearFecha,
  formatearDuracion,
  formatearPorcentaje,
  hoy,
} from '../../utils/formato';
import { exportarExcel } from '../../utils/excel';
import { generarInformePDF } from '../../utils/pdf';
import type {
  ResumenPerifoneador,
  ResumenSector,
} from '../../types/perifoneo.types';

type TabTipo = 'perifoneadores' | 'sectores';

/**
 * Página de Informes y Estadísticas Consolidadas estilo macOS (`ReportesPage`).
 *
 * Controles segmentados tipo Finder, métricas tabulares precisas,
 * exportación a Excel y emisión individual de PDF oficial para supervisión.
 */
export const ReportesPage: React.FC = () => {
  const [fechaInicio, setFechaInicio] = useState<string>(hoy());
  const [fechaFin, setFechaFin] = useState<string>(hoy());
  const [tab, setTab] = useState<TabTipo>('perifoneadores');

  // Consulta por Perifoneadores directa a Traccar
  const { data: resumenP = [], isLoading: cargandoP } = useQuery<ResumenPerifoneador[]>({
    queryKey: ['resumenP', fechaInicio, fechaFin],
    queryFn: () => obtenerResumenPerifoneadoresTraccar(fechaInicio, fechaFin),
  });

  // Consulta por Sectores directa a Traccar
  const { data: resumenS = [], isLoading: cargandoS } = useQuery<ResumenSector[]>({
    queryKey: ['resumenS', fechaInicio, fechaFin],
    queryFn: () => obtenerResumenSectoresTraccar(fechaInicio, fechaFin),
  });

  // Columnas para la pestaña de Perifoneadores
  const columnsP: ColumnDef<ResumenPerifoneador, unknown>[] = [
    {
      header: 'Perifoneador',
      accessorKey: 'nombre',
      cell: (info) => (
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
          {info.getValue() as string}
        </span>
      ),
    },
    {
      header: 'DNI',
      accessorKey: 'dni',
      cell: (info) => (
        <span className="font-mono text-zinc-600 dark:text-zinc-400">
          {(info.getValue() as string) || '-'}
        </span>
      ),
    },
    {
      header: 'Sector Asignado',
      accessorKey: 'sector_nombre',
      cell: (info) => (
        <span className="text-zinc-600 dark:text-zinc-400">
          {(info.getValue() as string) || info.row.original.sector || '-'}
        </span>
      ),
    },
    {
      header: 'Recorridos',
      accessorKey: 'recorridos',
      cell: (info) => (
        <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200 tabular-nums">
          {info.getValue() as number}
        </span>
      ),
    },
    {
      header: 'Días Activos',
      accessorKey: 'dias_activos',
      cell: (info) => (
        <span className="font-mono text-zinc-700 dark:text-zinc-300 tabular-nums">
          {(info.getValue() as number) || 0} días
        </span>
      ),
    },
    {
      header: 'Hrs Totales',
      accessorKey: 'horas_totales',
      cell: (info) => (
        <span className="font-mono text-zinc-800 dark:text-zinc-200 tabular-nums">
          {formatearDuracion(((info.getValue() as number) || 0) * 60)}
        </span>
      ),
    },
    {
      header: 'Hrs Dentro',
      accessorKey: 'horas_dentro',
      cell: (info) => (
        <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
          {formatearDuracion(((info.getValue() as number) || 0) * 60)}
        </span>
      ),
    },
    {
      header: '% Dentro',
      accessorKey: 'porcentaje_dentro',
      cell: (info) => {
        const val =
          (info.getValue() as number) ?? (info.row.original.pct_dentro as number) ?? 0;
        const colorClass =
          val >= 80
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
            : val >= 50
            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';

        return (
          <span
            className={`px-2 py-0.5 rounded-md text-2xs font-bold border tabular-nums font-mono ${colorClass}`}
          >
            {formatearPorcentaje(val)}
          </span>
        );
      },
    },
    {
      header: 'Hrs Detenido',
      accessorKey: 'horas_detenido',
      cell: (info) => (
        <span className="font-mono text-zinc-500 dark:text-zinc-400 tabular-nums">
          {formatearDuracion(((info.getValue() as number) || 0) * 60)}
        </span>
      ),
    },
    {
      header: 'KM Total',
      accessorKey: 'km_total',
      cell: (info) => {
        const km = (info.getValue() as number) ?? info.row.original.km_totales ?? 0;
        return (
          <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200 tabular-nums">
            {Number(km).toFixed(2)} km
          </span>
        );
      },
    },
    {
      header: 'Última Actividad',
      accessorKey: 'ultima_actividad',
      cell: (info) => (
        <span className="font-mono text-zinc-500 dark:text-zinc-400">
          {formatearFecha(info.getValue() as string)}
        </span>
      ),
    },
    {
      header: 'Informe PDF',
      id: 'acciones',
      cell: (info) => (
        <button
          type="button"
          onClick={() => generarInformePDF(info.row.original, fechaInicio, fechaFin)}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg border border-blue-200/60 dark:border-blue-800/60 transition-colors cursor-pointer"
          title="Descargar informe oficial para evaluación"
        >
          <FileText size={13} />
          <span>PDF</span>
        </button>
      ),
    },
  ];

  // Columnas para la pestaña de Sectores
  const columnsS: ColumnDef<ResumenSector, unknown>[] = [
    {
      header: 'Sector',
      accessorKey: 'nombre',
      cell: (info) => (
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
          {info.getValue() as string}
        </span>
      ),
    },
    {
      header: 'Personas',
      accessorKey: 'personas',
      cell: (info) => (
        <span className="font-mono font-medium text-zinc-800 dark:text-zinc-200 tabular-nums">
          {info.getValue() as number}
        </span>
      ),
    },
    {
      header: 'Recorridos',
      accessorKey: 'recorridos',
      cell: (info) => (
        <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200 tabular-nums">
          {info.getValue() as number}
        </span>
      ),
    },
    {
      header: 'Días con Cobertura',
      accessorKey: 'dias_cobertura',
      cell: (info) => {
        const val = info.getValue() as number;
        return val === 0 ? (
          <span className="px-2 py-0.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-2xs font-bold rounded-full">
            Sin cobertura
          </span>
        ) : (
          <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {val} días
          </span>
        );
      },
    },
    {
      header: 'Hrs en Sector',
      accessorKey: 'horas_dentro',
      cell: (info) => (
        <span className="font-mono font-medium text-zinc-800 dark:text-zinc-200 tabular-nums">
          {formatearDuracion(((info.getValue() as number) || 0) * 60)}
        </span>
      ),
    },
    {
      header: 'Última Cobertura',
      accessorKey: 'ultima_cobertura',
      cell: (info) => (
        <span className="font-mono text-zinc-500 dark:text-zinc-400">
          {formatearFecha(info.getValue() as string)}
        </span>
      ),
    },
  ];

  const handleExport = () => {
    if (tab === 'perifoneadores') {
      exportarExcel(resumenP, `Reporte_Perifoneadores_${fechaInicio}_al_${fechaFin}`);
    } else {
      exportarExcel(resumenS, `Reporte_Sectores_${fechaInicio}_al_${fechaFin}`);
    }
  };

  return (
    <div className="p-4 sm:p-6 h-full overflow-y-auto bg-zinc-100/60 dark:bg-zinc-950/60 transition-colors">
      {/* Título y Descarga */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-blue-600/10 dark:bg-blue-400/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <BarChart3 size={18} />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Reportes Consolidados
            </h1>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 pl-10">
            Métricas acumuladas de permanencia, distancias y cobertura territorial.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExport}
          className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer active:scale-98"
        >
          <Download size={15} />
          <span>Exportar a Excel</span>
        </button>
      </div>

      {/* Selector de Rango de Fechas */}
      <div className="mb-6">
        <FiltroFechas
          fechaInicio={fechaInicio}
          fechaFin={fechaFin}
          onInicioChange={setFechaInicio}
          onFinChange={setFechaFin}
        />
      </div>

      {/* Controles Segmentados de Pestañas estilo macOS */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center bg-zinc-200/60 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-300/40 dark:border-zinc-800 shadow-2xs">
          <button
            type="button"
            onClick={() => setTab('perifoneadores')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              tab === 'perifoneadores'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <UserCheck size={14} />
            <span>Por Perifoneador ({resumenP.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('sectores')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              tab === 'sectores'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Map size={14} />
            <span>Por Sector ({resumenS.length})</span>
          </button>
        </div>
      </div>

      {/* Contenido de la Tabla */}
      {tab === 'perifoneadores' ? (
        <TablaDatos data={resumenP} columns={columnsP} isLoading={cargandoP} />
      ) : (
        <TablaDatos data={resumenS} columns={columnsS} isLoading={cargandoS} />
      )}
    </div>
  );
};

export default ReportesPage;
