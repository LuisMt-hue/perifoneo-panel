import React from 'react';
import { SearchX, Radio } from 'lucide-react';
import type { LiveDevice } from '../types';
import LiveDeviceRow from './LiveDeviceRow';

interface LiveDeviceListProps {
  devices: LiveDevice[];
  selectedDeviceId: number | null;
  onSelectDevice: (device: LiveDevice) => void;
  onResetFilters?: () => void;
  cargando?: boolean;
}

export const LiveDeviceList: React.FC<LiveDeviceListProps> = ({
  devices,
  selectedDeviceId,
  onSelectDevice,
  onResetFilters,
  cargando = false,
}) => {
  if (cargando && devices.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-zinc-400 gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-blue-500/10 dark:bg-blue-400/10 flex items-center justify-center text-blue-500">
          <Radio size={18} className="animate-pulse" />
        </div>
        <span className="text-[12px] text-zinc-500 dark:text-zinc-400 font-medium">
          Cargando dispositivos...
        </span>
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-zinc-400 gap-2">
        <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-1">
          <SearchX size={20} className="opacity-70" />
        </div>
        <p className="text-[12px] font-medium text-zinc-600 dark:text-zinc-400 max-w-[200px]">
          Sin dispositivos coincidentes
        </p>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-[11px] text-white font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Restablecer filtros
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1 scrollbar-thin">
      {devices.map((device) => (
        <LiveDeviceRow
          key={device.id}
          device={device}
          isSelected={selectedDeviceId === device.id}
          onSelect={onSelectDevice}
        />
      ))}
    </div>
  );
};

export default React.memo(LiveDeviceList);
