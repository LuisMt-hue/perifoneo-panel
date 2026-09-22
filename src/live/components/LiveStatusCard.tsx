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
    <div className="fixed bottom-4 z-30 transition-all duration-300 left-4 right-4 md:right-auto md:w-96 md:left-[25.5rem]">
      <div className="p-4 rounded-3xl bg-white/92 dark:bg-zinc-900/92 backdrop-blur-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Cabecera de la tarjeta */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  estado === 'ACTIVO'
                    ? 'bg-emerald-500 animate-pulse'
                    : estado === 'DETENIDO'
                    ? 'bg-amber-500'
                    : 'bg-zinc-400'
                }`}
              />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{name}</h3>
              {placa && (
                <span className="text-2xs font-mono font-semibold px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60 text-zinc-800 dark:text-zinc-200">
                  {placa}
                </span>
              )}
            </div>

            <p className="text-2xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              DNI: <span className="font-mono">{uniqueId}</span>
              {categoria && ` • ${categoria}`}
            </p>
          </div>

          <div className="flex items-center gap-1">
            {onFocusDevice && (
              <button
                type="button"
                onClick={() => onFocusDevice(device)}
                title="Centrar en el mapa"
                className="p-1.5 rounded-xl text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <Focus size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Cuadrícula de Métricas Clave */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {/* Velocidad */}
          <div className="p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 flex flex-col">
            <span className="text-3xs uppercase font-semibold text-zinc-400 flex items-center gap-1">
              <Gauge size={11} className="text-blue-500" />
              <span>Velocidad</span>
            </span>
            <span className="text-sm font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5">
              {velocidadKmh} <span className="text-2xs font-normal text-zinc-500">km/h</span>
            </span>
          </div>

          {/* Batería */}
          <div className="p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 flex flex-col">
            <span className="text-3xs uppercase font-semibold text-zinc-400 flex items-center gap-1">
              {enCarga ? (
                <BatteryCharging size={11} className="text-emerald-500" />
              ) : (
                <Battery size={11} className="text-emerald-500" />
              )}
              <span>Batería</span>
            </span>
            <span className="text-sm font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5">
              {bateria !== null ? `${bateria}%` : 'N/D'}
            </span>
          </div>

          {/* Último reporte */}
          <div className="p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 flex flex-col">
            <span className="text-3xs uppercase font-semibold text-zinc-400 flex items-center gap-1">
              <Clock size={11} className="text-amber-500" />
              <span>Reporte</span>
            </span>
            <span className="text-2xs font-medium text-zinc-900 dark:text-zinc-100 mt-0.5 truncate">
              {ultimaActualizacion}
            </span>
          </div>
        </div>

        {/* Fila de Detalles: Conductor, Teléfono, Sector */}
        <div className="space-y-1.5 text-xs border-t border-zinc-100 dark:border-zinc-800/80 pt-2.5">
          <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <User size={13} />
              <span>Conductor</span>
            </span>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">{conductor || 'No asignado'}</span>
          </div>

          {telefono && (
            <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
              <span className="flex items-center gap-1.5 text-zinc-400">
                <Phone size={13} />
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
                <Shield size={13} />
                <span>Sector Asignado</span>
              </span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">{sector}</span>
            </div>
          )}

          {/* Coordenadas */}
          {lat !== null && lon !== null && (
            <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400 pt-1">
              <span className="flex items-center gap-1.5 text-zinc-400">
                <MapPin size={13} />
                <span>Coordenadas</span>
              </span>
              <button
                type="button"
                onClick={handleCopiarCoords}
                className="flex items-center gap-1 font-mono text-2xs text-zinc-600 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <span>
                  {lat.toFixed(4)}, {lon.toFixed(4)}
                </span>
                {copiado ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(LiveStatusCard);
