import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Download,
  History,
  Clock,
  MapPin,
  User,
  Milestone,
  Calendar,
  ChevronRight,
  Activity,
  Filter,
} from 'lucide-react';
import {
  obtenerSesiones,
  obtenerDispositivos,
  obtenerSectores,
} from '../../services/api/endpoints';
import FiltroFechas from '../../components/ui/FiltroFechas';
import TablaDatos from '../../components/ui/TablaDatos';
import {
  formatearFecha,
  formatearHora,
  formatearDuracion,
  formatearPorcentaje,
  hoy,
} from '../../utils/formato';
import { exportarExcel } from '../../utils/excel';
import type {
  SesionRecorrido,
  Dispositivo,
  Sector,
} from '../../types/perifoneo.types';

/**
 * Página de Historial de Recorridos estilo macOS (`HistorialRecorridosPage`).
 *
 * Incluye widgets de métricas acumuladas, filtros adaptables con modo oscuro,
 * tabla con alineación milimétrica por columna, porcentajes visuales y exportación a Excel.
 */
export const HistorialRecorridosPage: React.FC = () => {
  const [fechaInicio, setFechaInicio] = useState<string>(hoy());
  const [fechaFin, setFechaFin] = useState<string>(hoy());
  const [perifoneador, setPerifoneador] = useState<string>('');
  const [sector, setSector] = useState<string>('');

  const navigate = useNavigate();

  // Consultas de catálogos
  const { data: dispositivos = [] } = useQuery<Dispositivo[]>({
    queryKey: ['dispositivos'],
    queryFn: obtenerDispositivos,
  });

  const { data: sectores = [] } = useQuery<Sector[]>({
    queryKey: ['sectores'],
    queryFn: obtenerSectores,
  });

  // Consulta de sesiones de recorrido
  const { data: sesionesRaw = [], isLoading } = useQuery<SesionRecorrido[]>({
    queryKey: ['sesiones', fechaInicio, fechaFin, perifoneador, sector],
    queryFn: () =>
      obtenerSesiones({
        desde: fechaInicio,
        hasta: fechaFin,
        dispositivo: perifoneador || undefined,
        sector: sector || undefined,
      }),
  });

  const sesiones = Array.isArray(sesionesRaw) ? sesionesRaw : [];

  // Definición tipada de columnas con alineación y formato estricto
  const columns: ColumnDef<SesionRecorrido, unknown>[] = [
    {
      header: 'Fecha',
      accessorKey: 'fecha',
      cell: (info) => (
        <div className="flex items-center gap-1.5 font-mono text-zinc-700 dark:text-zinc-300">
          <Calendar size={12} className="text-zinc-400 dark:text-zinc-500 shrink-0" />
          <span>
            {formatearFecha(
              (info.row.original.inicio_at as string) || (info.getValue() as string)
            )}
          </span>
        </div>
      ),
    },
    {
      header: 'Perifoneador',
      accessorKey: 'perifoneador',
      cell: (info) => (
        <div className="flex items-center gap-1.5 font-medium text-zinc-900 dark:text-zinc-100">
          <div className="w-5 h-5 rounded-full bg-blue-500/10 dark:bg-blue-400/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <User size={11} />
          </div>
          <span className="truncate max-w-[140px]">
            {(info.getValue() as string) || info.row.original.perifoneador_nombre || '-'}
          </span>
        </div>
      ),
    },
    {
      header: 'Sector',
      accessorKey: 'sector',
      cell: (info) => (
        <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
          <MapPin size={11} className="text-zinc-400 shrink-0" />
          <span className="truncate max-w-[120px]">
            {(info.getValue() as string) || info.row.original.sector_nombre || '-'}
          </span>
        </div>
      ),
    },
    {
      header: 'Inicio',
      accessorKey: 'inicio_at',
      cell: (info) => (
        <span className="font-mono text-zinc-600 dark:text-zinc-400 tabular-nums">
          {formatearHora(info.getValue() as string)}
        </span>
      ),
    },
    {
      header: 'Fin',
      accessorKey: 'fin_at',
      cell: (info) =>
        info.row.original.estado === 'EN_CURSO' ? (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-2xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            En curso
          </span>
        ) : (
          <span className="font-mono text-zinc-600 dark:text-zinc-400 tabular-nums">
            {formatearHora(info.getValue() as string)}
          </span>
        ),
    },
    {
      header: 'Duración',
      accessorKey: 'minutos_totales',
      cell: (info) => (
        <span className="font-mono font-medium text-zinc-800 dark:text-zinc-200 tabular-nums">
          {formatearDuracion(
            (info.getValue() as number) ?? info.row.original.duracion_minutos
          )}
        </span>
      ),
    },
    {
      header: 'Min Dentro',
      accessorKey: 'minutos_dentro',
      cell: (info) => (
        <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
          {formatearDuracion(info.getValue() as number)}
        </span>
      ),
    },
    {
      header: 'Min Fuera',
      accessorKey: 'minutos_fuera',
      cell: (info) => (
        <span className="font-mono font-medium text-rose-600 dark:text-rose-400 tabular-nums">
          {formatearDuracion(info.getValue() as number)}
        </span>
      ),
    },
    {
      header: '% Dentro',
      accessorKey: 'pct_dentro',
      cell: (info) => {
        const val = (info.getValue() as number) ?? info.row.original.porcentaje_dentro ?? 0;
        const colorClass =
          val >= 80
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
            : val >= 50
            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';

        return (
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded-md text-2xs font-bold border tabular-nums ${colorClass}`}
            >
              {formatearPorcentaje(val)}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Detenido',
      accessorKey: 'minutos_detenido',
      cell: (info) => (
        <span className="font-mono text-zinc-500 dark:text-zinc-400 tabular-nums">
          {formatearDuracion(info.getValue() as number)}
        </span>
      ),
    },
    {
      header: 'Distancia',
      accessorKey: 'km_totales',
      cell: (info) => (
        <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200 tabular-nums">
          {Number((info.getValue() as number) || 0).toFixed(1)} km
        </span>
      ),
    },
    {
      header: '',
      id: 'acciones',
      cell: () => (
        <div className="flex justify-end text-zinc-300 dark:text-zinc-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          <ChevronRight size={15} />
        </div>
      ),
    },
  ];

  // Cálculo de sumatorias de totales
  const totales = sesiones.reduce(
    (acc, s) => ({
      min: acc.min + (s.minutos_totales ?? s.duracion_minutos ?? 0),
      km: acc.km + (s.km_totales ?? s.distancia_km ?? 0),
    }),
    { min: 0, km: 0 }
  );

  const handleExport = () => {
    exportarExcel(sesiones, `Historial_Recorridos_${fechaInicio}_al_${fechaFin}`);
  };

  const handleRowClick = (row: SesionRecorrido) => {
    navigate(`/recorrido/${row.id}`);
  };

  return (
    <div className="p-4 sm:p-6 h-full overflow-y-auto bg-zinc-100/60 dark:bg-zinc-950/60 transition-colors">
      {/* Título y Acciones Superiores */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-blue-600/10 dark:bg-blue-400/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <History size={18} />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Historial de Recorridos
            </h1>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 pl-10">
            Auditoría de sesiones GPS detectadas y métricas espaciales en Tacna.
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

      {/* Widgets de Resumen Métrico estilo macOS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium mb-1">
            <span>Sesiones Registradas</span>
            <Activity size={16} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
            {sesiones.length}
          </div>
          <p className="text-2xs text-zinc-400 dark:text-zinc-500 mt-1">En el rango seleccionado</p>
        </div>

        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium mb-1">
            <span>Tiempo Acumulado</span>
            <Clock size={16} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
            {formatearDuracion(totales.min)}
          </div>
          <p className="text-2xs text-zinc-400 dark:text-zinc-500 mt-1">Suma total de jornadas</p>
        </div>

        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium mb-1">
            <span>Distancia Recorrida</span>
            <Milestone size={16} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
            {totales.km.toFixed(1)} km
          </div>
          <p className="text-2xs text-zinc-400 dark:text-zinc-500 mt-1">Kilometraje auditado</p>
        </div>
      </div>

      {/* Barra de Filtros macOS */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-3.5 sm:p-4 rounded-2xl shadow-2xs border border-zinc-200/80 dark:border-zinc-800 mb-6 flex flex-wrap gap-3 items-center">
        <FiltroFechas
          fechaInicio={fechaInicio}
          fechaFin={fechaFin}
          onInicioChange={setFechaInicio}
          onFinChange={setFechaFin}
        />

        <div className="flex items-center gap-1.5 bg-zinc-50/80 dark:bg-zinc-900/60 p-2 sm:p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80">
          <User size={13} className="text-blue-600 dark:text-blue-400" />
          <select
            value={perifoneador}
            onChange={(e) => setPerifoneador(e.target.value)}
            className="bg-white dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700/80 rounded-lg px-2.5 py-1 text-xs font-medium text-zinc-900 dark:text-zinc-100 shadow-2xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
          >
            <option value="">Todos los perifoneadores</option>
            {dispositivos.map((d) => (
              <option key={d.id} value={d.id} className="dark:bg-zinc-900">
                {d.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 bg-zinc-50/80 dark:bg-zinc-900/60 p-2 sm:p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80">
          <Filter size={13} className="text-blue-600 dark:text-blue-400" />
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="bg-white dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700/80 rounded-lg px-2.5 py-1 text-xs font-medium text-zinc-900 dark:text-zinc-100 shadow-2xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
          >
            <option value="">Todos los sectores</option>
            {sectores.map((s) => (
              <option key={s.id} value={s.id} className="dark:bg-zinc-900">
                {s.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla de Resultados */}
      <TablaDatos
        data={sesiones}
        columns={columns}
        isLoading={isLoading}
        onRowClick={handleRowClick}
        footer={
          <tr>
            <td
              colSpan={columns.length}
              className="px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50/80 dark:bg-zinc-950/60 border-t border-zinc-200/80 dark:border-zinc-800"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                  {sesiones.length} recorridos encontrados
                </span>
                <span className="text-zinc-300 dark:text-zinc-700">·</span>
                <span>
                  Tiempo acumulado: <strong className="font-mono">{formatearDuracion(totales.min)}</strong>
                </span>
                <span className="text-zinc-300 dark:text-zinc-700">·</span>
                <span>
                  Distancia total: <strong className="font-mono">{totales.km.toFixed(1)} km</strong>
                </span>
              </div>
            </td>
          </tr>
        }
      />
    </div>
  );
};

export default HistorialRecorridosPage;
