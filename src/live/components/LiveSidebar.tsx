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
      className={`fixed md:absolute top-0 left-0 bottom-0 z-20 w-full md:w-92 lg:w-96 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-2xl border-r border-zinc-200/80 dark:border-zinc-800 shadow-2xl flex flex-col transition-transform duration-300 ${
        visibleOnMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      {/* Cabecera del Panel */}
      <div className="flex items-center justify-between p-3.5 border-b border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-blue-600/10 dark:bg-blue-400/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Radio size={15} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                Dispositivos
              </h2>
              <span className="text-2xs font-mono font-bold px-1.5 py-0.2 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50">
                {filterProps.counts.visibles}
              </span>
            </div>
            {/* Estado de WebSocket */}
            <div className="flex items-center gap-1.5 text-2xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
              {socketConectado ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono">En vivo</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span className="text-amber-600 dark:text-amber-400 font-mono">Reconectando</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lista limpia con scroll suave (sin filtros duplicados) */}
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
