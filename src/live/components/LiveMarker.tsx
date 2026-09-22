import React, { useMemo } from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import type { LiveDevice } from '../types';

interface LiveMarkerProps {
  device: LiveDevice;
  isSelected: boolean;
  onSelect: (device: LiveDevice) => void;
}

export const LiveMarker: React.FC<LiveMarkerProps> = ({ device, isSelected, onSelect }) => {
  if (device.lat === null || device.lon === null) return null;

  const icon = useMemo(() => {
    const { estado, rumbo, enMovimiento } = device;

    let colorBg = 'bg-zinc-400';
    let ringColor = 'ring-zinc-400/40';
    let pingColor = 'bg-zinc-400';

    if (estado === 'ACTIVO') {
      colorBg = 'bg-emerald-500';
      ringColor = 'ring-emerald-500/50';
      pingColor = 'bg-emerald-400';
    } else if (estado === 'DETENIDO') {
      colorBg = 'bg-amber-500';
      ringColor = 'ring-amber-500/50';
      pingColor = 'bg-amber-400';
    }

    const selectedRing = isSelected ? 'ring-4 ring-blue-500 shadow-lg scale-110' : 'ring-2';

    // Si está en movimiento, dibujamos una flecha con rumbo de orientación
    const innerContent = enMovimiento
      ? `<div style="transform: rotate(${rumbo}deg);" class="flex items-center justify-center w-full h-full text-white transition-transform duration-300">
           <svg class="w-3.5 h-3.5 fill-current drop-shadow-xs" viewBox="0 0 24 24">
             <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
           </svg>
         </div>`
      : `<div class="w-2 h-2 rounded-full bg-white shadow-xs"></div>`;

    const html = `
      <div class="relative flex items-center justify-center cursor-pointer transition-transform duration-200">
        ${
          estado === 'ACTIVO'
            ? `<span class="animate-ping pointer-events-none absolute inline-flex h-6 w-6 rounded-full ${pingColor} opacity-70"></span>`
            : ''
        }
        <div class="w-6 h-6 rounded-full ${colorBg} ${ringColor} ${selectedRing} shadow-md flex items-center justify-center relative z-10 transition-all">
          ${innerContent}
        </div>
      </div>
    `;

    return L.divIcon({
      className: 'custom-live-marker',
      html,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  }, [device, isSelected]);

  return (
    <Marker
      position={[device.lat, device.lon]}
      icon={icon}
      eventHandlers={{
        click: () => onSelect(device),
      }}
    >
      <Tooltip direction="top" offset={[0, -12]} opacity={0.95}>
        <div className="text-[12px] font-medium px-1 py-0.5 text-zinc-900 dark:text-zinc-100 flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 font-semibold">
            <span>{device.conductor || device.name}</span>
            {device.placa && (
              <span className="text-[9.5px] font-mono px-1 py-0.2 rounded bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                {device.placa}
              </span>
            )}
          </div>
          <span className="text-[10.5px] text-zinc-500 dark:text-zinc-400 font-mono">
            {device.velocidadKmh} km/h
          </span>
        </div>
      </Tooltip>
    </Marker>
  );
};

export default React.memo(LiveMarker);
