import React from 'react';
import { Battery, BatteryCharging, BatteryLow, Clock, ChevronRight, User } from 'lucide-react';
import type { LiveDevice } from '../types';

interface LiveDeviceRowProps {
  device: LiveDevice;
  isSelected: boolean;
  onSelect: (device: LiveDevice) => void;
}

export const LiveDeviceRow: React.FC<LiveDeviceRowProps> = ({ device, isSelected, onSelect }) => {
  const {
    name,
    uniqueId,
    placa,
    conductor,
    sector,
    velocidadKmh,
    bateria,
    enCarga,
    ultimaActualizacion,
    estado,
  } = device;

  // Renderizado del icono de batería
  const renderBateria = () => {
    if (bateria === null) return null;

    if (enCarga) {
      return (
        <span className="flex items-center gap-0.5 text-2xs text-emerald-600 dark:text-emerald-400 font-mono">
          <BatteryCharging size={13} />
          <span>{bateria}%</span>
        </span>
      );
    }
    if (bateria <= 20) {
      return (
        <span className="flex items-center gap-0.5 text-2xs text-rose-600 dark:text-rose-400 font-mono">
          <BatteryLow size={13} />
          <span>{bateria}%</span>
        </span>
      );
    }
    return (
      <span className="flex items-center gap-0.5 text-2xs text-zinc-500 dark:text-zinc-400 font-mono">
        <Battery size={13} />
        <span>{bateria}%</span>
      </span>
    );
  };

  // Punto de estado
  const renderPuntoEstado = () => {
    if (estado === 'ACTIVO') {
      return (
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
      );
    }
    if (estado === 'DETENIDO') {
      return (
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
        </span>
      );
    }
    return (
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="inline-flex rounded-full h-2.5 w-2.5 bg-zinc-400 dark:bg-zinc-600"></span>
      </span>
    );
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(device)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(device);
        }
      }}
      className={`group w-full text-left p-3 rounded-xl transition-all cursor-pointer border ${
        isSelected
          ? 'bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/40 shadow-xs'
          : 'bg-white/40 dark:bg-zinc-900/40 border-transparent hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 hover:border-zinc-200/50 dark:hover:border-zinc-800/50'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          {renderPuntoEstado()}
          <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 truncate">
            {name}
          </span>
          {placa && (
            <span className="text-2xs font-mono font-medium px-1.5 py-0.5 rounded-md bg-zinc-200/60 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shrink-0">
              {placa}
            </span>
          )}
        </div>

        {/* Velocidad */}
        <div className="shrink-0 flex items-center gap-1">
          <span
            className={`text-2xs font-mono font-bold px-1.5 py-0.5 rounded-md ${
              velocidadKmh > 0
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                : 'bg-zinc-200/50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
            }`}
          >
            {velocidadKmh} km/h
          </span>
          <ChevronRight
            size={14}
            className={`text-zinc-400 transition-transform ${
              isSelected ? 'translate-x-0.5 text-blue-600 dark:text-blue-400' : 'group-hover:translate-x-0.5'
            }`}
          />
        </div>
      </div>

      {/* Fila secundaria de metadatos (Conductor / DNI y Sector) */}
      <div className="flex items-center justify-between text-2xs text-zinc-500 dark:text-zinc-400 pl-4.5 gap-2">
        <div className="truncate flex items-center gap-1">
          <User size={11} className="shrink-0 opacity-60" />
          <span className="truncate">{conductor || uniqueId}</span>
        </div>

        {sector && (
          <span className="truncate max-w-[110px] text-blue-600 dark:text-blue-400 font-medium">
            {sector}
          </span>
        )}
      </div>

      {/* Fila terciaria (Batería y Último reporte) */}
      <div className="flex items-center justify-between text-2xs text-zinc-400 dark:text-zinc-500 pl-4.5 mt-1">
        <div className="flex items-center gap-1">
          <Clock size={11} className="shrink-0 opacity-60" />
          <span>{ultimaActualizacion}</span>
        </div>
        <div>{renderBateria()}</div>
      </div>
    </div>
  );
};

export default React.memo(LiveDeviceRow);
