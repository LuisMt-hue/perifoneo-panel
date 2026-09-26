import React from 'react';
import { Maximize2, Layers, Route } from 'lucide-react';

interface LiveMapToolbarProps {
  onCenterAll: () => void;
  mostrarRecorrido: boolean;
  onToggleRecorrido: () => void;
  mostrarGeocercas: boolean;
  onToggleGeocercas: () => void;
}

/**
 * Paleta flotante de herramientas del mapa estilo macOS (centrar, recorrido, geocercas).
 */
export const LiveMapToolbar: React.FC<LiveMapToolbarProps> = ({
  onCenterAll,
  mostrarRecorrido,
  onToggleRecorrido,
  mostrarGeocercas,
  onToggleGeocercas,
}) => {
  return (
    <div className="absolute top-3 right-3 z-20 flex flex-col gap-1 p-1 rounded-2xl bg-white/85 dark:bg-zinc-900/85 backdrop-blur-2xl border border-zinc-200/80 dark:border-white/10 shadow-xl select-none">
      <button
        type="button"
        onClick={onCenterAll}
        title="Centrar en todos los dispositivos"
        className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
      >
        <Maximize2 size={15} />
      </button>

      {/* Botón de Recorrido en Tiempo Real */}
      <button
        type="button"
        onClick={onToggleRecorrido}
        title={mostrarRecorrido ? 'Ocultar recorrido' : 'Ver recorrido en tiempo real'}
        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
          mostrarRecorrido
            ? 'bg-blue-600 text-white shadow-xs'
            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
        }`}
      >
        <Route size={15} />
      </button>

      {/* Botón de Geocercas */}
      <button
        type="button"
        onClick={onToggleGeocercas}
        title={mostrarGeocercas ? 'Ocultar Geocercas' : 'Mostrar Geocercas'}
        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
          mostrarGeocercas
            ? 'bg-blue-600 text-white shadow-xs'
            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
        }`}
      >
        <Layers size={15} />
      </button>
    </div>
  );
};

export default React.memo(LiveMapToolbar);
