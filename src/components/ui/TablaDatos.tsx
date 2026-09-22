import React, { useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowUpDown, ArrowUp, ArrowDown, SearchX, Loader2 } from 'lucide-react';

export interface TablaDatosProps<TData> {
  /** Definición de columnas de TanStack Table */
  columnas?: ColumnDef<TData, unknown>[];
  columns?: ColumnDef<TData, unknown>[];
  /** Lista de registros a desplegar */
  datos?: TData[];
  data?: TData[];
  /** Indicador de estado de carga */
  cargando?: boolean;
  loading?: boolean;
  isLoading?: boolean;
  /** Callback ejecutado al hacer clic en una fila */
  onFilaClic?: (fila: TData) => void;
  onRowClick?: (fila: TData) => void;
  /** Elemento opcional para renderizar al pie de la tabla */
  pieDePagina?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

/**
 * Componente Genérico de Tabla de Datos macOS (`TablaDatos`).
 *
 * Desarrollado con `@tanstack/react-table` v8 con estética Apple Numbers / Finder:
 * - Cabeceras refinadas con soporte de ordenamiento visual (iconos Lucide).
 * - Separadores suaves, modo oscuro integral y alineación cuidada.
 * - Estados de carga animados y estado vacío ilustrado.
 * - Desplazamiento horizontal responsivo para pantallas móviles.
 */
export function TablaDatos<TData>({
  columnas,
  columns,
  datos,
  data,
  cargando,
  loading,
  isLoading,
  onFilaClic,
  onRowClick,
  pieDePagina,
  footer,
  className = '',
}: TablaDatosProps<TData>): React.ReactElement {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const colDef = (columnas || columns || []) as ColumnDef<TData, any>[];
  const items = datos || data || [];
  const estaCargando = cargando ?? loading ?? isLoading ?? false;
  const handleFilaClic = onFilaClic || onRowClick;
  const footerContent = pieDePagina || footer;

  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data: items,
    columns: colDef,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div
      className={`w-full overflow-x-auto rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 shadow-xs transition-colors ${className}`}
    >
      <table className="w-full text-[12px] text-left border-collapse">
        <thead className="bg-zinc-50/90 dark:bg-zinc-950/60 backdrop-blur-sm border-b border-zinc-200/80 dark:border-zinc-800/80 text-zinc-500 dark:text-zinc-400 font-semibold text-[11px] uppercase tracking-wider select-none">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const isSorted = header.column.getIsSorted();

                return (
                  <th
                    key={header.id}
                    scope="col"
                    className={`px-3.5 py-2.5 font-semibold transition-colors ${
                      canSort ? 'cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40' : ''
                    }`}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                      {canSort && (
                        <span className="text-zinc-400 dark:text-zinc-500">
                          {isSorted === 'asc' ? (
                            <ArrowUp size={12} className="text-blue-600 dark:text-blue-400" />
                          ) : isSorted === 'desc' ? (
                            <ArrowDown size={12} className="text-blue-600 dark:text-blue-400" />
                          ) : (
                            <ArrowUpDown size={11} className="opacity-40" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>

        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
          {estaCargando ? (
            <tr>
              <td colSpan={colDef.length || 1} className="px-3.5 py-14 text-center">
                <div className="flex flex-col items-center justify-center gap-2 text-zinc-500 dark:text-zinc-400">
                  <Loader2 size={22} className="animate-spin text-blue-600 dark:text-blue-400" />
                  <span className="text-[12px] font-medium">Cargando registros...</span>
                </div>
              </td>
            </tr>
          ) : table.getRowModel().rows.length === 0 ? (
            <tr>
              <td colSpan={colDef.length || 1} className="px-3.5 py-12 text-center">
                <div className="flex flex-col items-center justify-center gap-2 text-zinc-400 dark:text-zinc-500">
                  <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center text-zinc-400 dark:text-zinc-500">
                    <SearchX size={18} />
                  </div>
                  <p className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">
                    No se encontraron registros
                  </p>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                    Ajusta los filtros de búsqueda para consultar la información
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={`transition-colors ${
                  handleFilaClic
                    ? 'cursor-pointer hover:bg-blue-50/50 dark:hover:bg-zinc-800/50 active:bg-blue-100/40 dark:active:bg-zinc-800'
                    : 'hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30'
                }`}
                onClick={() => handleFilaClic && handleFilaClic(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-3.5 py-2 whitespace-nowrap text-zinc-700 dark:text-zinc-300 text-[12px]"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>

        {footerContent && (
          <tfoot className="bg-zinc-50/90 dark:bg-zinc-950/60 border-t border-zinc-200/80 dark:border-zinc-800/80 text-zinc-700 dark:text-zinc-300 font-medium">
            {footerContent}
          </tfoot>
        )}
      </table>
    </div>
  );
}

export default TablaDatos;
