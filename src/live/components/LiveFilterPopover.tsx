import React, { useRef, useEffect } from 'react';
import { X, MapPin, Tag, RotateCcw } from 'lucide-react';
import type { TraccarGeofence, LiveDevice } from '../types';

interface LiveFilterPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  geofences: TraccarGeofence[];
  devices: LiveDevice[];
  selectedGeofenceId: number | 'TODOS';
  onSelectGeofence: (id: number | 'TODOS') => void;
  selectedSector: string | 'TODOS';
  onSelectSector: (sector: string | 'TODOS') => void;
  onReset: () => void;
}

export const LiveFilterPopover: React.FC<LiveFilterPopoverProps> = ({
  isOpen,
  onClose,
  geofences,
  devices,
  selectedGeofenceId,
  onSelectGeofence,
  selectedSector,
  onSelectSector,
  onReset,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Lista única de sectores presentes en los dispositivos
  const sectoresDisponibles = React.useMemo(() => {
    const set = new Set<string>();
    for (const d of devices) {
      if (d.sector) set.add(d.sector);
    }
    return Array.from(set).sort();
  }, [devices]);

  // Cerrar al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className="absolute top-full left-0 right-0 mt-2 p-3.5 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-xl z-30 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Filtros Avanzados</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onReset}
            title="Restablecer"
            className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <RotateCcw size={13} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Filtro por Geocercas de Traccar */}
      {geofences.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label className="text-2xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
            <MapPin size={12} className="text-blue-500" />
            <span>Zona / Geocerca</span>
          </label>
          <select
            value={selectedGeofenceId}
            onChange={(e) => {
              const val = e.target.value === 'TODOS' ? 'TODOS' : Number(e.target.value);
              onSelectGeofence(val);
            }}
            className="w-full text-xs px-2.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="TODOS">Todas las zonas ({geofences.length})</option>
            {geofences.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Filtro por Sector / Atributo */}
      {sectoresDisponibles.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label className="text-2xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
            <Tag size={12} className="text-emerald-500" />
            <span>Sector Asignado</span>
          </label>
          <select
            value={selectedSector}
            onChange={(e) => onSelectSector(e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="TODOS">Todos los sectores ({sectoresDisponibles.length})</option>
            {sectoresDisponibles.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default React.memo(LiveFilterPopover);
