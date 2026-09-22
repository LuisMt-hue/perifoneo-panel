import React, { useState } from 'react';
import {
  X,
  Gauge,
  Battery,
  BatteryCharging,
  Clock,
  MapPin,
  User,
  Copy,
  Check,
  Phone,
  Shield,
  Focus,
} from 'lucide-react';
import type { LiveDevice } from '../types';

interface LiveStatusCardProps {
  device: LiveDevice;
  onClose: () => void;
  onFocusDevice?: (device: LiveDevice) => void;
}

export const LiveStatusCard: React.FC<LiveStatusCardProps> = ({
  device,
  onClose,
  onFocusDevice,
}) => {
  const [copiado, setCopiado] = useState(false);

  const {
    name,
    uniqueId,
    placa,
    conductor,
    telefono,
    sector,
    categoria,
    velocidadKmh,
    bateria,
    enCarga,
    ultimaActualizacion,
    estado,
    lat,
    lon,
  } = device;

  const handleCopiarCoords = () => {
    if (lat !== null && lon !== null) {
      navigator.clipboard.writeText(`${lat.toFixed(6)}, ${lon.toFixed(6)}`);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  return (
    <div className="fixed bottom-3 z-30 transition-all duration-300 left-3 right-3 md:right-auto md:w-96 md:left-[21.5rem] lg:left-[22.5rem]">
      <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl border border-zinc-200/80 dark:border-white/10 shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200 select-none">
        {/* Cabecera del Inspector */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  estado === 'ACTIVO'
                    ? 'bg-emerald-500 animate-pulse'
                    : estado === 'DETENIDO'
                    ? 'bg-amber-500'
                    : 'bg-zinc-400'
                }`}
              />
              <h3 className="text-[13.5px] font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {conductor || name}
              </h3>
              {placa && (
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/70 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300 shrink-0">
                  {placa}
                </span>
              )}
            </div>

            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1.5">
              <span>DNI: {uniqueId}</span>
              {categoria && (
                <>
                  <span className="text-zinc-300 dark:text-zinc-600">·</span>
                  <span>{categoria}</span>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {onFocusDevice && (
              <button
                type="button"
                onClick={() => onFocusDevice(device)}
                title="Centrar en el mapa"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <Focus size={15} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              title="Cerrar detalle"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Cuadrícula de Métricas Clave (Widgets estilo macOS) */}
        <div className="grid grid-cols-3 gap-1.5 mb-3">
          {/* Velocidad */}
          <div className="p-2 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/50 border border-zinc-200/50 dark:border-white/[0.04] flex flex-col">
            <span className="text-[10px] uppercase font-semibold text-zinc-400 flex items-center gap-1">
              <Gauge size={11} className="text-blue-500 shrink-0" />
              <span>Velocidad</span>
            </span>
            <span className="text-[13px] font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5 tabular-nums">
              {velocidadKmh}{' '}
              <span className="text-[10px] font-normal text-zinc-500">km/h</span>
            </span>
          </div>

          {/* Batería */}
          <div className="p-2 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/50 border border-zinc-200/50 dark:border-white/[0.04] flex flex-col">
            <span className="text-[10px] uppercase font-semibold text-zinc-400 flex items-center gap-1">
              {enCarga ? (
                <BatteryCharging size={11} className="text-emerald-500 shrink-0" />
              ) : (
                <Battery size={11} className="text-emerald-500 shrink-0" />
              )}
              <span>Batería</span>
            </span>
            <span className="text-[13px] font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5 tabular-nums">
              {bateria !== null ? `${bateria}%` : 'N/D'}
            </span>
          </div>

          {/* Último reporte */}
          <div className="p-2 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/50 border border-zinc-200/50 dark:border-white/[0.04] flex flex-col">
            <span className="text-[10px] uppercase font-semibold text-zinc-400 flex items-center gap-1">
              <Clock size={11} className="text-amber-500 shrink-0" />
              <span>Reporte</span>
            </span>
            <span className="text-[11.5px] font-medium text-zinc-900 dark:text-zinc-100 mt-0.5 truncate">
              {ultimaActualizacion}
            </span>
          </div>
        </div>

        {/* Fila de Detalles: Conductor, Teléfono, Sector, Coordenadas */}
        <div className="space-y-1.5 text-[11.5px] border-t border-zinc-100 dark:border-white/[0.06] pt-2.5">
          <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <User size={12} className="shrink-0" />
              <span>Conductor</span>
            </span>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              {conductor || name}
            </span>
          </div>

          {telefono && (
            <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
              <span className="flex items-center gap-1.5 text-zinc-400">
                <Phone size={12} className="shrink-0" />
                <span>Teléfono</span>
              </span>
              <a
                href={`tel:${telefono}`}
                className="font-mono text-blue-600 dark:text-blue-400 hover:underline"
              >
                {telefono}
              </a>
            </div>
          )}

          {sector && (
            <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
              <span className="flex items-center gap-1.5 text-zinc-400">
                <Shield size={12} className="shrink-0" />
                <span>Sector Asignado</span>
              </span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">{sector}</span>
            </div>
          )}

          {/* Coordenadas */}
          {lat !== null && lon !== null && (
            <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400 pt-0.5">
              <span className="flex items-center gap-1.5 text-zinc-400">
                <MapPin size={12} className="shrink-0" />
                <span>Coordenadas</span>
              </span>
              <button
                type="button"
                onClick={handleCopiarCoords}
                className="flex items-center gap-1 font-mono text-[10.5px] text-zinc-600 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
              >
                <span>
                  {lat.toFixed(4)}, {lon.toFixed(4)}
                </span>
                {copiado ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(LiveStatusCard);
