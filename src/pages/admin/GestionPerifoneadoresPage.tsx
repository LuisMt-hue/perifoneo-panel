import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Radio,
  RefreshCw,
  AlertTriangle,
  Smartphone,
  MapPin,
  Phone,
} from 'lucide-react';
import { obtenerDispositivos, importarDesdeTraccar } from '../../services/api/endpoints';
import TablaDatos from '../../components/ui/TablaDatos';
import type { Dispositivo } from '../../types/perifoneo.types';

/**
 * Página de Gestión y Catálogo de Perifoneadores estilo macOS (`GestionPerifoneadoresPage`).
 *
 * Muestra las unidades GPS registradas desde Traccar con indicadores semánticos
 * y sincronización con animación de carga.
 */
export const GestionPerifoneadoresPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: dispositivos = [], isLoading } = useQuery<Dispositivo[]>({
    queryKey: ['dispositivos'],
    queryFn: obtenerDispositivos,
  });

  const mutImportar = useMutation({
    mutationFn: importarDesdeTraccar,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dispositivos'] });
      alert(data.mensaje || 'Sincronización con el servidor Traccar completada con éxito.');
    },
    onError: (err: Error) => {
      alert(`Error al sincronizar con Traccar: ${err.message}`);
    },
  });

  const columns: ColumnDef<Dispositivo, unknown>[] = [
    {
      header: 'Perifoneador / Nombre',
      accessorKey: 'nombre',
      cell: (info) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-500/10 dark:bg-blue-400/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Radio size={12} />
          </div>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            {info.getValue() as string}
          </span>
        </div>
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
      header: 'Placa',
      accessorKey: 'placa',
      cell: (info) => {
        const placa = info.getValue() as string;
        return placa ? (
          <span className="font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700 text-2xs font-bold">
            {placa}
          </span>
        ) : (
          <span className="text-zinc-400">-</span>
        );
      },
    },
    {
      header: 'Teléfono',
      accessorKey: 'telefono',
      cell: (info) => {
        const tel = info.getValue() as string;
        return tel ? (
          <span className="flex items-center gap-1 font-mono text-zinc-600 dark:text-zinc-400">
            <Phone size={11} className="text-zinc-400" />
            <span>{tel}</span>
          </span>
        ) : (
          <span className="text-zinc-400">-</span>
        );
      },
    },
    {
      header: 'Sector Asignado',
      accessorKey: 'sector',
      cell: (info) => {
        const sector = (info.getValue() as string) || info.row.original.sector_nombre;
        return sector ? (
          <div className="flex items-center gap-1 text-zinc-700 dark:text-zinc-300">
            <MapPin size={12} className="text-blue-500" />
            <span className="font-medium">{sector}</span>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full text-2xs font-semibold">
            <AlertTriangle size={11} />
            Sin sector
          </span>
        );
      },
    },
    {
      header: 'Modelo de Celular',
      accessorKey: 'modelo_celular',
      cell: (info) => {
        const val = info.getValue() as string;
        return val ? (
          <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 text-xs">
            <Smartphone size={13} className="text-zinc-400" />
            <span>{val}</span>
          </span>
        ) : (
          <span className="text-zinc-400">-</span>
        );
      },
    },
  ];

  return (
    <div className="p-4 sm:p-6 h-full overflow-y-auto bg-zinc-100/60 dark:bg-zinc-950/60 transition-colors">
      {/* Encabezado y Acción de Sincronización */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-blue-600/10 dark:bg-blue-400/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Radio size={18} />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Perifoneadores y Dispositivos
            </h1>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 pl-10">
            Registro de unidades GPS sincronizadas desde el servidor Traccar.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (window.confirm('¿Deseas sincronizar los perifoneadores y geocercas desde Traccar?')) {
              mutImportar.mutate();
            }
          }}
          disabled={mutImportar.isPending}
          className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer active:scale-98"
        >
          <RefreshCw
            size={14}
            className={mutImportar.isPending ? 'animate-spin' : ''}
          />
          <span>
            {mutImportar.isPending ? 'Sincronizando...' : 'Actualizar desde Traccar'}
          </span>
        </button>
      </div>

      {/* Tabla de Dispositivos */}
      <TablaDatos data={dispositivos} columns={columns} isLoading={isLoading} />
    </div>
  );
};

export default GestionPerifoneadoresPage;
