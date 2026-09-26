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
import type { ManagedDevice } from '../types';
import type { TraccarGeofence, TraccarGroup } from '../../live/types';
import { DEVICE_TABLE_COLUMNS, type DeviceColumnDef } from '../constants';
import { formatearDuracionDesde } from '../../shared/utils/formato';
import DeviceInlineCell from './DeviceInlineCell';

const ESTADO_DOT_CLASSES: Record<ManagedDevice['estado'], string> = {
  ACTIVO: 'bg-emerald-500',
  DETENIDO: 'bg-amber-500',
  DESCONECTADO: 'bg-zinc-400',
};

interface DevicesTableProps {
  devices: ManagedDevice[];
  geofences: TraccarGeofence[];
  groups: TraccarGroup[];
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
  geofences,
  groups,
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

  const sectorOptions = geofences.map((g) => ({ value: g.name, label: g.name }));
  const groupOptions = groups.map((g) => ({ value: String(g.id), label: g.name }));

  // groupId es numérico en Traccar; el <select> siempre entrega string
  const handleInlineSave = (deviceId: number, key: string, value: any, isAttribute: boolean) => {
    if (key === 'groupId') {
      return onInlineSave(deviceId, key, value ? Number(value) : null, isAttribute);
    }
    return onInlineSave(deviceId, key, value, isAttribute);
  };

  const getCellValue = (device: ManagedDevice, col: DeviceColumnDef): any => {
    if (col.key === 'name') return device.name || '';
    if (col.key === 'uniqueId') return device.uniqueId || '';
    if (col.key === 'phone') return device.phone || '';
    if (col.key === 'groupId') return device.groupId != null ? String(device.groupId) : '';
    if (col.type === 'attribute') return device.attributes?.[col.attributeKey || col.key] || '';
    return (device as any)[col.key] ?? '';
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-zinc-900 overflow-hidden relative">
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse text-[12px] min-w-[680px]">
          <thead className="sticky top-0 z-10 bg-zinc-50/95 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold select-none text-[11px] uppercase tracking-wider">
            <tr>
              <th className="w-10 px-3 py-2.5 text-center">
                <input
                  type="checkbox"
                  checked={todosSeleccionados}
                  onChange={onSeleccionarTodos}
                  className="rounded text-[#155BD0] focus:ring-[#155BD0] h-3.5 w-3.5 cursor-pointer"
                />
              </th>

              {DEVICE_TABLE_COLUMNS.map((col) => {
                const isSorted = sortConfig.key === col.key;
                return (
                  <th
                    key={col.key}
                    onClick={() => onSortChange(col.key)}
                    className="px-3.5 py-2.5 cursor-pointer hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1.5 font-semibold">
                      <span>{col.label}</span>
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

              <th className="w-24 px-3 py-2.5 text-center font-semibold">Acciones</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
            {cargando ? (
              <tr>
                <td colSpan={DEVICE_TABLE_COLUMNS.length + 2} className="text-center py-16 text-zinc-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-7 h-7 border-2 border-[#155BD0] border-t-transparent rounded-full animate-spin" />
                    <span className="text-[12px] font-medium">Cargando dispositivos desde Traccar...</span>
                  </div>
                </td>
              </tr>
            ) : devices.length === 0 ? (
              <tr>
                <td colSpan={DEVICE_TABLE_COLUMNS.length + 2} className="text-center py-16 text-zinc-400">
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
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSeleccion(device.id)}
                        className="rounded text-[#155BD0] focus:ring-[#155BD0] h-3.5 w-3.5 cursor-pointer"
                      />
                    </td>

                    {DEVICE_TABLE_COLUMNS.map((col) => {
                      const isSaving = savingCell?.deviceId === device.id && savingCell.key === col.key;
                      const isSuccess = successCell?.deviceId === device.id && successCell.key === col.key;
                      const rawValue = getCellValue(device, col);

                      // Columna NOMBRE: incluye el punto de estado (mismo cálculo que Live)
                      if (col.key === 'name') {
                        return (
                          <td key={col.key} className="px-3.5 py-1.5 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${ESTADO_DOT_CLASSES[device.estado]} ${
                                  device.estado === 'ACTIVO' ? 'animate-pulse' : ''
                                }`}
                                title={`${device.estado} · ${formatearDuracionDesde(device.lastUpdate)}`}
                              />
                              <DeviceInlineCell
                                value={rawValue}
                                deviceId={device.id}
                                fieldKey={col.key}
                                isAttribute={false}
                                isSaving={isSaving}
                                isSuccess={isSuccess}
                                onSave={handleInlineSave}
                              />
                            </div>
                          </td>
                        );
                      }

                      if (col.key === 'groupId') {
                        return (
                          <td key={col.key} className="px-3.5 py-1.5 whitespace-nowrap">
                            <DeviceInlineCell
                              value={rawValue}
                              deviceId={device.id}
                              fieldKey="groupId"
                              isAttribute={false}
                              isSaving={isSaving}
                              isSuccess={isSuccess}
                              onSave={handleInlineSave}
                              type="select"
                              options={groupOptions}
                              placeholder={groupOptions.length === 0 ? 'Sin grupos en Traccar' : 'Sin grupo'}
                            />
                          </td>
                        );
                      }

                      if (col.key === 'sector') {
                        return (
                          <td key={col.key} className="px-3.5 py-1.5 whitespace-nowrap">
                            <DeviceInlineCell
                              value={rawValue}
                              deviceId={device.id}
                              fieldKey="sector"
                              isAttribute={true}
                              isSaving={isSaving}
                              isSuccess={isSuccess}
                              onSave={handleInlineSave}
                              type="select"
                              options={sectorOptions}
                              placeholder="Sin sector"
                            />
                          </td>
                        );
                      }

                      const isAttribute = col.type === 'attribute';
                      return (
                        <td key={col.key} className="px-3.5 py-1.5 whitespace-nowrap">
                          <DeviceInlineCell
                            value={rawValue}
                            deviceId={device.id}
                            fieldKey={col.attributeKey || col.key}
                            isAttribute={isAttribute}
                            isSaving={isSaving}
                            isSuccess={isSuccess}
                            onSave={handleInlineSave}
                          />
                        </td>
                      );
                    })}

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
