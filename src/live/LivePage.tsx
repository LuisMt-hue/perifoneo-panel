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
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2 bg-rose-500/90 text-white backdrop-blur-md rounded-2xl shadow-xl text-xs font-semibold">
          <AlertCircle size={15} />
          <span>{error}</span>
          <button
            type="button"
            onClick={recargar}
            className="ml-2 underline hover:no-underline font-bold"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Mapa a Pantalla Completa (Fondo principal estilo Traccar Web) */}
      <div className="absolute inset-0 z-0">
        <LiveMap
          devices={filterProps.filteredDevices}
          geofences={geofences}
          selectedDevice={selectedDevice}
          focusTrigger={focusTrigger}
          onSelectDevice={handleSelectDevice}
        />
      </div>

      {/* Barra de Filtros Flotante en la parte Izquierda Superior del Mapa */}
      <LiveMapFilters
        filterProps={filterProps}
        geofences={geofences}
        devices={devices}
      />

      {/* Panel Lateral Flotante Izquierdo (Lista de Dispositivos) */}
      <LiveSidebar
        selectedDeviceId={selectedDeviceId}
        onSelectDevice={handleSelectDevice}
        filterProps={filterProps}
        socketConectado={socketConectado}
        cargando={cargando}
        visibleOnMobile={vistaMovil === 'lista'}
      />

      {/* Tarjeta de Estado Flotante del Dispositivo Seleccionado */}
      {selectedDevice && (
        <LiveStatusCard
          device={selectedDevice}
          onClose={handleCloseCard}
          onFocusDevice={handleFocusDevice}
        />
      )}

      {/* Alternador Flotante Inferior para Móviles (Estilo iOS Segment Control) */}
      <div className="md:hidden absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl p-1 rounded-2xl shadow-xl border border-zinc-200/80 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setVistaMovil('mapa')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            vistaMovil === 'mapa'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
          }`}
        >
          <MapIcon size={14} />
          <span>Mapa</span>
        </button>
        <button
          type="button"
          onClick={() => setVistaMovil('lista')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            vistaMovil === 'lista'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
          }`}
        >
          <List size={14} />
          <span>Lista ({filterProps.counts.visibles})</span>
        </button>
      </div>
    </div>
  );
};

export default LivePage;
