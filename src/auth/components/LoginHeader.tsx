import React from 'react';
import { Activity } from 'lucide-react';

/**
 * Cabecera de la ventana de Login estilo macOS Sonoma:
 * Semáforos de ventana, isotipo con animación de pulso y títulos de la aplicación.
 */
export const LoginHeader: React.FC = () => {
  return (
    <>
      {/* Controles de Semáforo macOS */}
      <div className="flex items-center gap-2 mb-6">
        <span className="w-3 h-3 rounded-full bg-[#ff5f56] inline-block shadow-2xs" />
        <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block shadow-2xs" />
        <span className="w-3 h-3 rounded-full bg-[#27c93f] inline-block shadow-2xs" />
      </div>

      {/* Logo y Encabezado */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-400/30 text-blue-400 shadow-inner mb-3">
          <Activity size={28} className="animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Perifoneo Tacna
        </h1>
        <p className="mt-1 text-xs text-zinc-300">
          Panel de Supervisión y Auditoría Satelital (Traccar)
        </p>
      </div>
    </>
  );
};

export default LoginHeader;
