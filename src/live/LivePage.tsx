import React, { useState } from 'react';
import { Map as MapIcon, List, AlertCircle } from 'lucide-react';
import { useLiveTracking } from './hooks/useLiveTracking';
import { useLiveFilters } from './hooks/useLiveFilters';
import LiveMap from './components/LiveMap';
import LiveSidebar from './components/LiveSidebar';
import LiveStatusCard from './components/LiveStatusCard';
import LiveMapFilters from './components/LiveMapFilters';
import type { LiveDevice } from './types';

export const LivePage: React.FC = () => {
  const [vistaMovil, setVistaMovil] = useState<'mapa' | 'lista'>('mapa');
  const [focusTrigger, setFocusTrigger] = useState<number>(0);

  // Estado del tracking directo con Traccar (REST + WebSocket)
  const {
    devices,
    geofences,
    selectedDeviceId,
    selectedDevice,
    setSelectedDeviceId,
    socketConectado,
    cargando,
    error,
    recargar,
  } = useLiveTracking();

  // Gestión reactiva de filtros y búsqueda
  const filterProps = useLiveFilters(devices, geofences);

  const handleSelectDevice = (device: LiveDevice) => {
    setSelectedDeviceId(device.id);
    setFocusTrigger(Date.now());
    setVistaMovil('mapa'); // En móviles, al seleccionar lleva de vuelta al mapa
  };

  const handleFocusDevice = (device: LiveDevice) => {
    setSelectedDeviceId(device.id);
    setFocusTrigger(Date.now());
  };

  const handleCloseCard = () => {
    setSelectedDeviceId(null);
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-zinc-100 dark:bg-zinc-950">
      {/* Alerta si falla la conexión con Traccar */}
      {error && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-3.5 py-1.5 bg-rose-500/90 text-white backdrop-blur-md rounded-2xl shadow-xl text-[12px] font-medium border border-rose-400/30">
          <AlertCircle size={14} />
          <span>{error}</span>
          <button
            type="button"
            onClick={recargar}
            className="ml-2 underline hover:no-underline font-semibold cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Mapa a Pantalla Completa (Fondo interactivo) */}
      <div className="absolute inset-0 z-0">
        <LiveMap
          devices={filterProps.filteredDevices}
          geofences={geofences}
          selectedDevice={selectedDevice}
          focusTrigger={focusTrigger}
          onSelectDevice={handleSelectDevice}
        />
      </div>

      {/* Barra de Filtros Flotante estilo macOS */}
      <LiveMapFilters
        filterProps={filterProps}
        geofences={geofences}
        devices={devices}
      />

      {/* Panel Lateral Flotante Izquierdo estilo macOS */}
      <LiveSidebar
        selectedDeviceId={selectedDeviceId}
        onSelectDevice={handleSelectDevice}
        filterProps={filterProps}
        socketConectado={socketConectado}
        cargando={cargando}
        visibleOnMobile={vistaMovil === 'lista'}
      />

      {/* Tarjeta Inspector Flotante del Dispositivo Seleccionado */}
      {selectedDevice && (
        <LiveStatusCard
          device={selectedDevice}
          onClose={handleCloseCard}
          onFocusDevice={handleFocusDevice}
        />
      )}

      {/* Alternador Flotante Inferior para Móviles (macOS/iOS Segment Control) */}
      <div className="md:hidden absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl p-1 rounded-2xl shadow-2xl border border-zinc-200/80 dark:border-white/10 select-none">
        <button
          type="button"
          onClick={() => setVistaMovil('mapa')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all cursor-pointer ${
            vistaMovil === 'mapa'
              ? 'bg-blue-600 text-white shadow-xs font-semibold'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <MapIcon size={14} />
          <span>Mapa</span>
        </button>
        <button
          type="button"
          onClick={() => setVistaMovil('lista')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all cursor-pointer ${
            vistaMovil === 'lista'
              ? 'bg-blue-600 text-white shadow-xs font-semibold'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <List size={14} />
          <span>Lista</span>
          <span
            className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full tabular-nums ${
              vistaMovil === 'lista'
                ? 'bg-white/20 text-white font-semibold'
                : 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
            }`}
          >
            {filterProps.counts.visibles}
          </span>
        </button>
      </div>
    </div>
  );
};

export default LivePage;
