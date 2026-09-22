import React from 'react';
import {
  Battery,
  BatteryCharging,
  BatteryLow,
  Radio,
  Clock,
  ChevronRight,
} from 'lucide-react';
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

  // Renderizado del icono y porcentaje de batería
  const renderBateria = () => {
    if (bateria === null) return null;

    if (enCarga) {
      return (
        <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
          <BatteryCharging size={11} className="shrink-0" />
          <span>{bateria}%</span>
        </span>
      );
    }
    if (bateria <= 20) {
      return (
        <span className="flex items-center gap-0.5 text-[10px] text-rose-600 dark:text-rose-400 font-mono tabular-nums">
          <BatteryLow size={11} className="shrink-0" />
          <span>{bateria}%</span>
        </span>
      );
    }
    return (
      <span className="flex items-center gap-0.5 text-[10px] text-zinc-400 dark:text-zinc-500 font-mono tabular-nums">
        <Battery size={11} className="shrink-0" />
        <span>{bateria}%</span>
      </span>
    );
  };

  // Punto de estado en vivo sobre el squircle
  const renderStatusBadge = () => {
    if (estado === 'ACTIVO') {
      return (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
        </span>
      );
    }
    if (estado === 'DETENIDO') {
      return (
        <span className="absolute -bottom-0.5 -right-0.5 inline-flex rounded-full h-2.5 w-2.5 bg-amber-500 ring-2 ring-white dark:ring-zinc-900" />
      );
    }
    return (
      <span className="absolute -bottom-0.5 -right-0.5 inline-flex rounded-full h-2.5 w-2.5 bg-zinc-400 dark:bg-zinc-600 ring-2 ring-white dark:ring-zinc-900" />
    );
  };

  const nombrePrincipal = conductor || name;
  const subtituloIdentificador = conductor ? name : uniqueId;

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
      className={`group w-full text-left px-2.5 py-2 rounded-xl transition-all duration-150 cursor-pointer border flex items-center gap-2.5 select-none ${
        isSelected
          ? 'bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/30 text-zinc-900 dark:text-zinc-50 shadow-xs ring-1 ring-blue-500/20'
          : 'bg-white/40 dark:bg-zinc-900/30 border-zinc-200/50 dark:border-white/[0.04] hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50 hover:border-zinc-300/60 dark:hover:border-zinc-700/60'
      }`}
    >
      {/* Squircle Leading Icon estilo Apple Find My */}
      <div className="relative shrink-0">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            isSelected
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60'
          }`}
        >
          <Radio size={14} className={estado === 'ACTIVO' ? 'animate-pulse' : ''} />
        </div>
        {renderStatusBadge()}
      </div>

      {/* Información Central */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        {/* Fila 1: Título y Placa */}
        <div className="flex items-center gap-1.5">
          <span className="text-[12.5px] font-semibold text-zinc-900 dark:text-zinc-100 truncate">
            {nombrePrincipal}
          </span>
          {placa && (
            <span className="text-[9.5px] font-mono font-medium px-1.5 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/50 shrink-0">
              {placa}
            </span>
          )}
        </div>

        {/* Fila 2: Sector o Subtítulo · Último reporte */}
        <div className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
          {sector ? (
            <span className="text-blue-600 dark:text-blue-400 font-medium truncate">
              {sector}
            </span>
          ) : (
            <span className="truncate opacity-75">{subtituloIdentificador}</span>
          )}
          <span className="text-zinc-300 dark:text-zinc-600">·</span>
          <span className="flex items-center gap-0.5 text-zinc-400 dark:text-zinc-500 shrink-0 text-[10.5px]">
            <Clock size={10} className="shrink-0 opacity-70" />
            <span>{ultimaActualizacion}</span>
          </span>
        </div>
      </div>

      {/* Columna Derecha: Velocidad y Batería */}
      <div className="shrink-0 flex flex-col items-end justify-center gap-1">
        <div className="flex items-center gap-1">
          <span
            className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-md tabular-nums ${
              velocidadKmh > 0
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border border-zinc-200/40 dark:border-zinc-700/40'
            }`}
          >
            {velocidadKmh} km/h
          </span>
          <ChevronRight
            size={12}
            className={`text-zinc-400 transition-transform ${
              isSelected
                ? 'translate-x-0.5 text-blue-600 dark:text-blue-400'
                : 'group-hover:translate-x-0.5 opacity-60'
            }`}
          />
        </div>

        <div>{renderBateria()}</div>
      </div>
    </div>
  );
};

export default React.memo(LiveDeviceRow);
