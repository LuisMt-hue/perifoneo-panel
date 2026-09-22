import React from 'react';
import { Radio } from 'lucide-react';
import type { LiveDevice } from '../types';
import type { UseLiveFiltersReturn } from '../hooks/useLiveFilters';
import LiveDeviceList from './LiveDeviceList';

interface LiveSidebarProps {
  selectedDeviceId: number | null;
  onSelectDevice: (device: LiveDevice) => void;
  filterProps: UseLiveFiltersReturn;
  socketConectado: boolean;
  cargando: boolean;
  visibleOnMobile: boolean;
}

export const LiveSidebar: React.FC<LiveSidebarProps> = ({
  selectedDeviceId,
  onSelectDevice,
  filterProps,
  socketConectado,
  cargando,
  visibleOnMobile,
}) => {
  return (
    <aside
      className={`fixed md:absolute top-0 bottom-0 left-0 md:top-3 md:bottom-3 md:left-3 z-20 w-full sm:w-80 md:w-80 lg:w-84 md:rounded-2xl bg-white/85 dark:bg-zinc-900/85 backdrop-blur-2xl border-r md:border border-zinc-200/80 dark:border-white/10 shadow-2xl flex flex-col transition-all duration-300 overflow-hidden ${
        visibleOnMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      {/* Cabecera del Panel Flotante macOS */}
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-zinc-200/70 dark:border-white/[0.08] bg-zinc-50/60 dark:bg-zinc-950/40 select-none">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 dark:bg-blue-400/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Radio size={14} className={socketConectado ? 'animate-pulse' : ''} />
          </div>

          <div className="flex items-center gap-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Dispositivos
            </h2>
            <span className="text-[10.5px] font-mono font-medium px-2 py-0.5 rounded-full bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 tabular-nums">
              {filterProps.counts.visibles}
            </span>
          </div>
        </div>

        {/* Indicador de Conexión en Tiempo Real estilo Apple Status Badge */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-zinc-100/90 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60">
          {socketConectado ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-emerald-600 dark:text-emerald-400">En vivo</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              <span className="text-amber-600 dark:text-amber-400">Reconectando</span>
            </>
          )}
        </div>
      </div>

      {/* Lista de Dispositivos con Scroll Suave */}
      <LiveDeviceList
        devices={filterProps.filteredDevices}
        selectedDeviceId={selectedDeviceId}
        onSelectDevice={onSelectDevice}
        onResetFilters={filterProps.limpiarFiltros}
        cargando={cargando}
      />
    </aside>
  );
};

export default React.memo(LiveSidebar);
