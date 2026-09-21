import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useState } from 'react';

export default function TablaDatos(props) {
  // Acepta nombres en español (guía) y en inglés (código actual)
  const columnas = props.columnas || props.columns || [];
  const datos = props.datos || props.data || [];
  const cargando = props.cargando ?? props.loading ?? props.isLoading ?? false;
  const onFilaClic = props.onFilaClic || props.onRowClick;
  const pieDePagina = props.pieDePagina || props.footer;
  const [sorting, setSorting] = useState([]);

  const table = useReactTable({
    data: datos,
    columns: columnas,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className={`px-4 py-3 ${header.column.getCanSort() ? 'cursor-pointer select-none hover:bg-gray-100' : ''}`}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div className="flex items-center gap-2">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {{
                      asc: ' ▲',
                      desc: ' ▼',
                    }[header.column.getIsSorted()] ?? null}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {cargando ? (
            <tr>
              <td colSpan={columnas.length} className="px-4 py-8 text-center text-gray-500">
                <div className="flex justify-center items-center gap-2">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  Cargando datos...
                </div>
              </td>
            </tr>
          ) : table.getRowModel().rows.length === 0 ? (
            <tr>
              <td colSpan={columnas.length} className="px-4 py-8 text-center text-gray-500">
                No hay datos disponibles.
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={`bg-white border-b hover:bg-gray-50 transition-colors ${onFilaClic ? 'cursor-pointer' : ''}`}
                onClick={() => onFilaClic && onFilaClic(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
        {pieDePagina && (
          <tfoot className="bg-gray-50 text-gray-700 font-semibold border-t">
            {pieDePagina}
          </tfoot>
        )}
      </table>
    </div>
  );
}
