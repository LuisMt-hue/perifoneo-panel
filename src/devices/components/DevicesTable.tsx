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
  columnasVisibles: AttributeColumnConfig[];
  selectedIds: Set<number>;
  onToggleSeleccion: (id: number) => void;
  onSeleccionarTodos: () => void;
  onDeseleccionarTodo: () => void;
  savingCell: { deviceId: number; key: string } | null;
  successCell: { deviceId: number; key: string } | null;
  onInlineSave: (deviceId: number, key: string, value: any, isAttribute: boolean) => Promise<void>;
  onOpenEditModal: (device: ManagedDevice) => void;
  onEliminarDispositivo: (device: ManagedDevice) => void;
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
  columnasVisibles,
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
  const todosSeleccionados = devices.length > 0 && devices.every((d) => selectedIds.has(d.id));

  // Obtener valor de celda según el mapeo de propiedad estándar o atributo
  const getCellValue = (device: ManagedDevice, col: AttributeColumnConfig): any => {
    const k = col.key;
    if (k === 'name') return device.name || '';
    if (k === 'uniqueId') return device.uniqueId || '';
    if (k === 'phone') return device.phone || device.attributes?.celular || device.attributes?.telefono || '';
    if (k === 'base') return device.attributes?.base || device.attributes?.BASE || '';
    if (k === 'distrito') return device.attributes?.distrito || device.attributes?.DISTRITO || '';
    if (k === 'placa') return device.attributes?.placa || device.attributes?.['PLACA DEL CARRO'] || device.attributes?.placaDelCarro || '';
    if (k === 'sector') return device.attributes?.sector || device.attributes?.sector_asignado || device.attributes?.SECTOR || '';

    if (col.type === 'attribute') {
      return device.attributes?.[col.attributeKey || k] ?? '';
    }

    return (device as any)[k] ?? '';
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-zinc-900 overflow-hidden relative">
      {/* Contenedor con Scroll de la Tabla */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse text-[12px] min-w-[760px]">
          {/* Cabecera Fija estilo Apple Numbers */}
          <thead className="sticky top-0 z-10 bg-zinc-50/95 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold select-none text-[11px] uppercase tracking-wider">
            <tr>
              {/* Checkbox de Selección General Centrado */}
              <th className="w-10 px-3 py-2.5 text-center">
                <input
                  type="checkbox"
                  checked={todosSeleccionados}
                  onChange={onSeleccionarTodos}
                  className="rounded text-[#155BD0] focus:ring-[#155BD0] h-3.5 w-3.5 cursor-pointer"
                />
              </th>

              {/* Columnas Visibles (Prioritarias y Opcionales) */}
              {columnasVisibles.map((col) => {
                const isSorted = sortConfig.key === col.key;
                return (
                  <th
                    key={col.key}
                    onClick={() => onSortChange(col.key)}
                    className="px-3.5 py-2.5 cursor-pointer hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1.5 font-semibold">
                      <span
                        className={
                          col.isPriority
                            ? 'text-zinc-800 dark:text-zinc-200 font-semibold'
                            : col.type === 'attribute'
                            ? 'text-purple-600 dark:text-purple-400 font-mono'
                            : ''
                        }
                      >
                        {col.label}
                      </span>
                      {col.isPriority && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#155BD0] inline-block shrink-0" title="Prioritaria" />
                      )}
                      <span className="text-zinc-400 ml-0.5">
                        {isSorted ? (
                          sortConfig.direction === 'asc' ? (
                            <ArrowUp size={12} className="text-[#155BD0]" />
                          ) : (
                            <ArrowDown size={12} className="text-[#155BD0]" />
                          )
                        ) : (
                          <ArrowUpDown size={11} className="opacity-40" />
                        )}
                      </span>
                    </div>
                  </th>
                );
              })}

              {/* Columna Acciones Centrada */}
              <th className="w-24 px-3 py-2.5 text-center font-semibold">Acciones</th>
            </tr>
          </thead>

          {/* Cuerpo de la Tabla */}
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
            {cargando ? (
              <tr>
                <td colSpan={columnasVisibles.length + 2} className="text-center py-16 text-zinc-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-7 h-7 border-2 border-[#155BD0] border-t-transparent rounded-full animate-spin" />
                    <span className="text-[12px] font-medium">Cargando dispositivos desde Traccar...</span>
                  </div>
                </td>
              </tr>
            ) : devices.length === 0 ? (
              <tr>
                <td colSpan={columnasVisibles.length + 2} className="text-center py-16 text-zinc-400">
                  <p className="text-[12.5px] font-semibold text-zinc-700 dark:text-zinc-300">
                    No se encontraron dispositivos coincidentes
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Prueba modificando los términos de búsqueda o los filtros activos.
                  </p>
                </td>
              </tr>
            ) : (
              devices.map((device) => {
                const isSelected = selectedIds.has(device.id);

                return (
                  <tr
                    key={device.id}
                    className={`transition-colors hover:bg-zinc-50/90 dark:hover:bg-zinc-800/40 ${
                      isSelected ? 'bg-blue-50/60 dark:bg-blue-950/25' : ''
                    }`}
                  >
                    {/* Checkbox de fila Centrado */}
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSeleccion(device.id)}
                        className="rounded text-[#155BD0] focus:ring-[#155BD0] h-3.5 w-3.5 cursor-pointer"
                      />
                    </td>

                    {/* Celdas Dinámicas */}
                    {columnasVisibles.map((col) => {
                      const isSaving = savingCell?.deviceId === device.id && savingCell.key === col.key;
                      const isSuccess = successCell?.deviceId === device.id && successCell.key === col.key;

                      // Columna Estado especial con badge Apple
                      if (col.key === 'status') {
                        const isOnline = device.status === 'online';
                        return (
                          <td key={col.key} className="px-3.5 py-2 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                isOnline
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60'
                                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200/60 dark:border-zinc-700/60'
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
                          <td key={col.key} className="px-3.5 py-2 whitespace-nowrap text-zinc-500 font-mono text-[11px]">
                            {device.lastUpdate ? new Date(device.lastUpdate).toLocaleString() : 'N/D'}
                          </td>
                        );
                      }

                      // Celdas Editables Inline (Propiedades estándar o Atributos)
                      const isAttribute = col.type === 'attribute';
                      const rawValue = getCellValue(device, col);

                      return (
                        <td key={col.key} className="px-3.5 py-1.5 whitespace-nowrap">
                          <DeviceInlineCell
                            value={rawValue}
                            deviceId={device.id}
                            fieldKey={col.attributeKey || col.key}
                            isAttribute={isAttribute}
                            isSaving={isSaving}
                            isSuccess={isSuccess}
                            onSave={onInlineSave}
                            type={col.key === 'disabled' ? 'boolean' : 'text'}
                          />
                        </td>
                      );
                    })}

                    {/* Acciones de Fila Centradas */}
                    <td className="px-3 py-2 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => onOpenEditModal(device)}
                          title="Editar detalles completos"
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-[#155BD0] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                        >
                          <Edit3 size={13.5} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEliminarDispositivo(device)}
                          title="Eliminar dispositivo de Traccar"
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        >
                          <Trash2 size={13.5} />
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
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 px-3.5 py-1.5 bg-zinc-900/95 dark:bg-zinc-100/95 text-white dark:text-zinc-900 rounded-2xl shadow-2xl backdrop-blur-xl border border-zinc-700/50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-1.5 text-[11.5px] font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#155BD0] animate-pulse" />
            <span>{selectedIds.size} seleccionados</span>
          </div>

          <div className="h-3.5 w-px bg-zinc-700 dark:bg-zinc-300" />

          <button
            type="button"
            onClick={onOpenBulkEdit}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#155BD0] hover:bg-[#114eb3] text-white rounded-lg text-[11px] font-medium shadow-xs transition-colors cursor-pointer"
          >
            <Layers size={12} />
            <span>Editar en Masa</span>
          </button>

          <button
            type="button"
            onClick={onDeseleccionarTodo}
            className="text-[11px] text-zinc-400 hover:text-white dark:hover:text-zinc-900 underline transition-colors cursor-pointer"
          >
            Desmarcar
          </button>
        </div>
      )}

      {/* Barra de Paginación Responsiva con diseño Apple */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 text-[11.5px] shrink-0 select-none flex-wrap gap-2">
        <div className="flex items-center gap-2.5 text-zinc-500 dark:text-zinc-400 flex-wrap">
          <span className="font-medium hidden sm:inline">Filas por página:</span>
          <select
            value={filasPorPagina}
            onChange={(e) => onCambiarFilasPorPagina(Number(e.target.value))}
            className="h-7 px-2.5 bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 font-medium text-[11px] focus:outline-none cursor-pointer shadow-2xs"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-zinc-400 text-[11px]">Total: {totalRegistros} dispositivos</span>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-zinc-500 dark:text-zinc-400 font-mono text-[11px] font-medium">
            Página {paginaActual} de {totalPaginas}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={paginaActual <= 1}
              onClick={() => onCambiarPagina(paginaActual - 1)}
              className="w-7 h-7 rounded-lg border border-zinc-200/90 dark:border-zinc-700/90 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              disabled={paginaActual >= totalPaginas}
              onClick={() => onCambiarPagina(paginaActual + 1)}
              className="w-7 h-7 rounded-lg border border-zinc-200/90 dark:border-zinc-700/90 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevicesTable;
