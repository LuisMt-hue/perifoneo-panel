import React from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Layers,
} from 'lucide-react';
import type { ManagedDevice, AttributeColumnConfig } from '../types';
import DeviceInlineCell from './DeviceInlineCell';

interface DevicesTableProps {
  devices: ManagedDevice[];
  columnasDisponibles: AttributeColumnConfig[];
  selectedIds: Set<number>;
  onToggleSeleccion: (id: number) => void;
  onSeleccionarTodos: () => void;
  onDeseleccionarTodo: () => void;
  savingCell: { deviceId: number; key: string } | null;
  successCell: { deviceId: number; key: string } | null;
  onInlineSave: (deviceId: number, key: string, value: any, isAttribute: boolean) => Promise<void>;
  onOpenEditModal: (device: ManagedDevice) => void;
  onEliminarDispositivo: (id: number) => void;
  onOpenBulkEdit: () => void;
  sortConfig: { key: string; direction: 'asc' | 'desc' };
  onSortChange: (key: string) => void;
  paginaActual: number;
  totalPaginas: number;
  onCambiarPagina: (pag: number) => void;
  filasPorPagina: number;
  onCambiarFilasPorPagina: (num: number) => void;
  totalRegistros: number;
  cargando: boolean;
}

export const DevicesTable: React.FC<DevicesTableProps> = ({
  devices,
  columnasDisponibles,
  selectedIds,
  onToggleSeleccion,
  onSeleccionarTodos,
  onDeseleccionarTodo,
  savingCell,
  successCell,
  onInlineSave,
  onOpenEditModal,
  onEliminarDispositivo,
  onOpenBulkEdit,
  sortConfig,
  onSortChange,
  paginaActual,
  totalPaginas,
  onCambiarPagina,
  filasPorPagina,
  onCambiarFilasPorPagina,
  totalRegistros,
  cargando,
}) => {
  const columnasVisibles = columnasDisponibles.filter((c) => c.visible);
  const todosSeleccionados = devices.length > 0 && devices.every((d) => selectedIds.has(d.id));

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-zinc-950 overflow-hidden relative">
      {/* Contenedor con Scroll de la Tabla */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse text-xs">
          {/* Cabecera Fija */}
          <thead className="sticky top-0 z-10 bg-zinc-100/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold select-none">
            <tr>
              {/* Checkbox de Selección General */}
              <th className="w-10 px-3 py-2.5 text-center">
                <input
                  type="checkbox"
                  checked={todosSeleccionados}
                  onChange={onSeleccionarTodos}
                  className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                />
              </th>

              {/* Columnas Dinámicas y Estándar */}
              {columnasVisibles.map((col) => {
                const isSorted = sortConfig.key === col.key;
                return (
                  <th
                    key={col.key}
                    onClick={() => onSortChange(col.key)}
                    className="px-3 py-2.5 cursor-pointer hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className={col.type === 'attribute' ? 'text-blue-600 dark:text-blue-400 font-mono' : ''}>
                        {col.label}
                      </span>
                      {col.type === 'attribute' && (
                        <span className="text-3xs font-normal text-zinc-400 font-mono">[attr]</span>
                      )}
                      <span className="text-zinc-400">
                        {isSorted ? (
                          sortConfig.direction === 'asc' ? (
                            <ArrowUp size={12} className="text-blue-600" />
                          ) : (
                            <ArrowDown size={12} className="text-blue-600" />
                          )
                        ) : (
                          <ArrowUpDown size={11} className="opacity-40" />
                        )}
                      </span>
                    </div>
                  </th>
                );
              })}

              {/* Columna Acciones */}
              <th className="w-20 px-3 py-2.5 text-right font-bold">Acciones</th>
            </tr>
          </thead>

          {/* Cuerpo de la Tabla */}
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
            {cargando ? (
              <tr>
                <td colSpan={columnasVisibles.length + 2} className="text-center py-12 text-zinc-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span>Cargando dispositivos desde Traccar...</span>
                  </div>
                </td>
              </tr>
            ) : devices.length === 0 ? (
              <tr>
                <td colSpan={columnasVisibles.length + 2} className="text-center py-12 text-zinc-400">
                  No se encontraron dispositivos coincidentes con los filtros.
                </td>
              </tr>
            ) : (
              devices.map((device) => {
                const isSelected = selectedIds.has(device.id);

                return (
                  <tr
                    key={device.id}
                    className={`transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-900/60 ${
                      isSelected ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                    }`}
                  >
                    {/* Checkbox de fila */}
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSeleccion(device.id)}
                        className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                      />
                    </td>

                    {/* Celdas Dinámicas */}
                    {columnasVisibles.map((col) => {
                      const isSaving = savingCell?.deviceId === device.id && savingCell.key === col.key;
                      const isSuccess = successCell?.deviceId === device.id && successCell.key === col.key;

                      // Columna Estado especial
                      if (col.key === 'status') {
                        const isOnline = device.status === 'online';
                        return (
                          <td key={col.key} className="px-3 py-2 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-2xs font-semibold ${
                                isOnline
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50'
                                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200/50 dark:border-zinc-700/50'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'
                                }`}
                              />
                              <span>{isOnline ? 'En Línea' : 'Desconectado'}</span>
                            </span>
                          </td>
                        );
                      }

                      // Columna Última Actualización especial
                      if (col.key === 'lastUpdate') {
                        return (
                          <td key={col.key} className="px-3 py-2 whitespace-nowrap text-zinc-500 font-mono text-2xs">
                            {device.lastUpdate ? new Date(device.lastUpdate).toLocaleTimeString() : 'N/D'}
                          </td>
                        );
                      }

                      // Celdas Editables Inline (Propiedades estándar o Atributos)
                      const isAttribute = col.type === 'attribute';
                      const rawValue = isAttribute
                        ? device.attributes?.[col.key]
                        : (device as any)[col.key];

                      return (
                        <td key={col.key} className="px-3 py-1.5 whitespace-nowrap">
                          <DeviceInlineCell
                            value={rawValue}
                            deviceId={device.id}
                            fieldKey={col.key}
                            isAttribute={isAttribute}
                            isSaving={isSaving}
                            isSuccess={isSuccess}
                            onSave={onInlineSave}
                            type={col.key === 'disabled' ? 'boolean' : 'text'}
                          />
                        </td>
                      );
                    })}

                    {/* Acciones de Fila */}
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onOpenEditModal(device)}
                          title="Editar detalles completos"
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEliminarDispositivo(device.id)}
                          title="Eliminar dispositivo"
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Barra Flotante de Acciones Masivas cuando hay Selección */}
      {selectedIds.size > 0 && (
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-2 bg-zinc-900/95 dark:bg-zinc-100/95 text-white dark:text-zinc-900 rounded-2xl shadow-2xl backdrop-blur-xl border border-zinc-700/50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>{selectedIds.size} seleccionados</span>
          </div>

          <div className="h-4 w-px bg-zinc-700 dark:bg-zinc-300" />

          <button
            type="button"
            onClick={onOpenBulkEdit}
            className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Layers size={13} />
            <span>Editar en Masa</span>
          </button>

          <button
            type="button"
            onClick={onDeseleccionarTodo}
            className="text-xs text-zinc-400 hover:text-white dark:hover:text-zinc-900 underline transition-colors"
          >
            Desmarcar
          </button>
        </div>
      )}

      {/* Barra de Paginación */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50 text-xs shrink-0 select-none">
        <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
          <span>Filas por página:</span>
          <select
            value={filasPorPagina}
            onChange={(e) => onCambiarFilasPorPagina(Number(e.target.value))}
            className="px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 font-mono text-2xs focus:outline-none"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-zinc-400 ml-2">Total: {totalRegistros} dispositivos</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-zinc-500 dark:text-zinc-400 font-mono text-2xs">
            Pág. {paginaActual} de {totalPaginas}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={paginaActual <= 1}
              onClick={() => onCambiarPagina(paginaActual - 1)}
              className="p-1 rounded-lg border border-zinc-200/80 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              type="button"
              disabled={paginaActual >= totalPaginas}
              onClick={() => onCambiarPagina(paginaActual + 1)}
              className="p-1 rounded-lg border border-zinc-200/80 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevicesTable;
