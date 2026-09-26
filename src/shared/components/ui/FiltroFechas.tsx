import React, { useEffect, useMemo, useRef, useState } from 'react';
import { subDays, startOfWeek, startOfMonth } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { Calendar, ChevronDown } from 'lucide-react';
import { hoy, formatearFecha, ZONA_LIMA } from '../../utils/formato';

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

function fechaISO(date: Date): string {
  return formatInTimeZone(date, ZONA_LIMA, 'yyyy-MM-dd');
}

/**
 * Selector de Rango de Fechas macOS (`FiltroFechas`).
 *
 * Botón único con popover: atajos rápidos (Hoy, Ayer, Esta semana, Este mes)
 * arriba y el rango personalizado abajo. Mismo contrato de props que la versión
 * anterior, así que no afecta a otros consumidores existentes del componente.
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

  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(event.target as Node)) {
        setAbierto(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setAbierto(false);
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

  const atajos = useMemo(() => {
    const hoyStr = hoy();
    const ayerStr = fechaISO(subDays(new Date(), 1));
    const inicioSemanaStr = fechaISO(startOfWeek(new Date(), { weekStartsOn: 1 }));
    const inicioMesStr = fechaISO(startOfMonth(new Date()));

    return [
      { label: 'Hoy', desde: hoyStr, hasta: hoyStr },
      { label: 'Ayer', desde: ayerStr, hasta: ayerStr },
      { label: 'Esta semana', desde: inicioSemanaStr, hasta: hoyStr },
      { label: 'Este mes', desde: inicioMesStr, hasta: hoyStr },
    ];
  }, []);

  const etiqueta = useMemo(() => {
    if (!desde || !hasta) return 'Seleccionar fechas';
    const atajoActivo = atajos.find((a) => a.desde === desde && a.hasta === hasta);
    if (atajoActivo) return atajoActivo.label;
    if (desde === hasta) return formatearFecha(desde);
    return `${formatearFecha(desde)} – ${formatearFecha(hasta)}`;
  }, [desde, hasta, atajos]);

  const handleSelectAtajo = (a: { desde: string; hasta: string }) => {
    handleCambio({ desde: a.desde, hasta: a.hasta });
    setAbierto(false);
  };

  return (
    <div className={`relative ${className}`} ref={contenedorRef}>
      <button
        type="button"
        onClick={() => setAbierto((prev) => !prev)}
        className="flex items-center gap-2 h-8 px-3 rounded-[21px] bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 text-xs font-medium text-zinc-700 dark:text-zinc-300 shadow-2xs hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer"
      >
        <Calendar size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />
        <span>{etiqueta}</span>
        <ChevronDown
          size={12}
          className={`opacity-60 transition-transform duration-200 ${abierto ? 'rotate-180' : ''}`}
        />
      </button>

      {abierto && (
        <div className="absolute left-0 top-full mt-1.5 w-72 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md shadow-xl border border-zinc-200/80 dark:border-zinc-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2 flex flex-col gap-0.5 border-b border-zinc-100 dark:border-zinc-800/80">
            {atajos.map((a) => {
              const activo = a.desde === desde && a.hasta === hasta;
              return (
                <button
                  key={a.label}
                  type="button"
                  onClick={() => handleSelectAtajo(a)}
                  className={`text-left px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    activo
                      ? 'bg-[#155BD0] text-white'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  {a.label}
                </button>
              );
            })}
          </div>

          <div className="p-3 flex flex-col gap-2.5">
            <p className="text-3xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Rango personalizado
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex flex-col gap-1">
                <label htmlFor="input-desde" className="text-2xs text-zinc-400">Del</label>
                <input
                  type="date"
                  id="input-desde"
                  name="desde"
                  value={desde}
                  onChange={handleChange}
                  className="w-full bg-zinc-50 dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700/80 rounded-lg px-2.5 py-1 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <label htmlFor="input-hasta" className="text-2xs text-zinc-400">Al</label>
                <input
                  type="date"
                  id="input-hasta"
                  name="hasta"
                  value={hasta}
                  onChange={handleChange}
                  className="w-full bg-zinc-50 dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700/80 rounded-lg px-2.5 py-1 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export default FiltroFechas;
