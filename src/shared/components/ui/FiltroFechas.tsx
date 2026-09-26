import React from 'react';
import { Calendar } from 'lucide-react';

export interface FiltroFechasProps {
  desde?: string;
  fechaInicio?: string;
  hasta?: string;
  fechaFin?: string;
  onCambio?: (params: { desde: string; hasta: string; [key: string]: string }) => void;
  onInicioChange?: (fecha: string) => void;
  onFinChange?: (fecha: string) => void;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Selector de Rango de Fechas macOS (`FiltroFechas`).
 *
 * Controles de fecha pulidos con iconos Lucide, soporte completo de modo oscuro
 * y disposición responsiva para computadoras y teléfonos.
 */
export const FiltroFechas: React.FC<FiltroFechasProps> = ({
  desde: propDesde,
  fechaInicio,
  hasta: propHasta,
  fechaFin,
  onCambio,
  onInicioChange,
  onFinChange,
  children,
  className = '',
}) => {
  const desde = propDesde ?? fechaInicio ?? '';
  const hasta = propHasta ?? fechaFin ?? '';

  const handleCambio =
    onCambio ||
    ((obj: { desde: string; hasta: string }) => {
      if (onInicioChange && obj.desde !== undefined) onInicioChange(obj.desde);
      if (onFinChange && obj.hasta !== undefined) onFinChange(obj.hasta);
    });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    handleCambio({
      desde: name === 'desde' ? value : desde,
      hasta: name === 'hasta' ? value : hasta,
      [name]: value,
    });
  };

  return (
    <div
      className={`flex flex-wrap items-center gap-3 bg-zinc-50/80 dark:bg-zinc-900/60 p-2 sm:p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 ${className}`}
    >
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-2xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          <Calendar size={13} className="text-blue-600 dark:text-blue-400" />
          <span>Del</span>
        </div>
        <input
          type="date"
          id="input-desde"
          name="desde"
          value={desde}
          onChange={handleChange}
          className="bg-white dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700/80 rounded-lg px-2.5 py-1 text-xs font-medium text-zinc-900 dark:text-zinc-100 shadow-2xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-colors cursor-pointer"
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-2xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          al
        </span>
        <input
          type="date"
          id="input-hasta"
          name="hasta"
          value={hasta}
          onChange={handleChange}
          className="bg-white dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700/80 rounded-lg px-2.5 py-1 text-xs font-medium text-zinc-900 dark:text-zinc-100 shadow-2xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-colors cursor-pointer"
        />
      </div>

      {children}
    </div>
  );
};

export default FiltroFechas;
