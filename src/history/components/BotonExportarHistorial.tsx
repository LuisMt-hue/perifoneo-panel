import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileSpreadsheet, FileText } from 'lucide-react';

export interface BotonExportarHistorialProps {
  onExportarExcel: () => void;
  onExportarPDF: () => void;
  deshabilitado?: boolean;
}

/**
 * Botón desplegable estilo Apple UI para exportar el historial a Excel (.xlsx) o PDF (.pdf).
 */
export const BotonExportarHistorial: React.FC<BotonExportarHistorialProps> = ({
  onExportarExcel,
  onExportarPDF,
  deshabilitado = false,
}) => {
  const [abierto, setAbierto] = useState<boolean>(false);
  const contenedorRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera o presionar Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(event.target as Node)) {
        setAbierto(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setAbierto(false);
      }
    }

    if (abierto) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [abierto]);

  const handleSelectExcel = () => {
    setAbierto(false);
    onExportarExcel();
  };

  const handleSelectPDF = () => {
    setAbierto(false);
    onExportarPDF();
  };

  return (
    <div className="relative inline-block text-left" ref={contenedorRef}>
      <button
        type="button"
        onClick={() => setAbierto((prev) => !prev)}
        disabled={deshabilitado}
        className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-[21px] shadow-xs transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#155BD0]/30 select-none ${
          abierto
            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
            : 'bg-zinc-800 hover:bg-zinc-900 active:bg-black text-white dark:bg-zinc-800 dark:hover:bg-zinc-700'
        } disabled:opacity-40 disabled:cursor-not-allowed`}
        aria-haspopup="true"
        aria-expanded={abierto}
      >
        <Download size={13} className="shrink-0" />
        <span>Exportar</span>
        <ChevronDown
          size={12}
          className={`shrink-0 opacity-70 transition-transform duration-200 ${
            abierto ? 'rotate-180' : ''
          }`}
        />
      </button>

      {abierto && (
        <div className="absolute right-0 mt-1.5 w-60 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md shadow-xl border border-zinc-200/80 dark:border-zinc-800 z-50 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 border-b border-zinc-100 dark:border-zinc-800/80">
            <p className="text-3xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Formato de exportación
            </p>
          </div>

          <button
            type="button"
            onClick={handleSelectExcel}
            className="w-full flex items-start gap-2.5 px-3 py-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer group"
          >
            <div className="size-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
              <FileSpreadsheet size={15} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Excel (.xlsx)
              </span>
              <span className="text-3xs text-zinc-400 dark:text-zinc-500">
                Hoja de cálculo con fórmulas y columnas
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={handleSelectPDF}
            className="w-full flex items-start gap-2.5 px-3 py-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer group"
          >
            <div className="size-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
              <FileText size={15} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                PDF (.pdf)
              </span>
              <span className="text-3xs text-zinc-400 dark:text-zinc-500">
                Informe formal de auditoría para imprimir
              </span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default BotonExportarHistorial;
