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
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-zinc-400 gap-2">
        <Radio size={24} className="animate-pulse text-blue-500" />
        <span className="text-xs">Cargando dispositivos desde Traccar...</span>
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-zinc-400 gap-2">
        <SearchX size={28} className="opacity-40" />
        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          No hay dispositivos que coincidan con los filtros
        </p>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-1 text-2xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
          >
            Restablecer filtros
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5 scrollbar-thin">
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
