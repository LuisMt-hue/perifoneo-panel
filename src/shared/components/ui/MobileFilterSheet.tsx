import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { SlidersHorizontal, X } from 'lucide-react';

export interface MobileFilterSheetProps {
  /** Contenido de filtros a mostrar dentro de la hoja (mismos controles que en desktop). */
  children: React.ReactNode;
  /** Cantidad de filtros activos, mostrada como badge sobre el botón "Filtros". */
  activeCount?: number;
  /**
   * Clase de visibilidad responsiva (ej. `lg:hidden` o `md:hidden`) — debe coincidir
   * exactamente con el corte usado por los controles inline equivalentes de cada
   * módulo, para que no quede un rango de ancho sin ninguno de los dos visible.
   */
  className?: string;
}

/**
 * Botón "Filtros" + hoja inferior (bottom sheet) para mobile (`MobileFilterSheet`).
 *
 * Patrón compartido por Live, Dispositivos e Historial: en desktop (`md:` y superior)
 * cada barra de filtros ya muestra todos sus controles en línea, así que este
 * componente no renderiza nada ahí (`md:hidden` en el botón disparador). En mobile,
 * agrupa los controles "secundarios" (los que no caben en la barra compacta) detrás
 * de un botón con contador, y los presenta en una hoja deslizable desde abajo.
 */
export const MobileFilterSheet: React.FC<MobileFilterSheetProps> = ({
  children,
  activeCount = 0,
  className = '',
}) => {
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [abierto]);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="relative h-8 px-3 rounded-xl bg-zinc-100/90 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-200 text-[11.5px] font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer"
      >
        <SlidersHorizontal size={13} />
        <span>Filtros</span>
        {activeCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
            {activeCount}
          </span>
        )}
      </button>

      {abierto &&
        createPortal(
          <div
            className="fixed inset-0 z-[110] flex items-end justify-center bg-black/45 backdrop-blur-xs animate-in fade-in duration-150"
            role="dialog"
            aria-modal="true"
            onClick={(e) => {
              if (e.target === e.currentTarget) setAbierto(false);
            }}
          >
            <div className="w-full max-h-[88vh] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl rounded-t-3xl shadow-2xl border-t border-zinc-200/80 dark:border-white/10 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-white/[0.06] shrink-0">
                <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">Filtros</h3>
                <button
                  type="button"
                  onClick={() => setAbierto(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="p-4 overflow-y-auto flex flex-col gap-3">{children}</div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default MobileFilterSheet;
