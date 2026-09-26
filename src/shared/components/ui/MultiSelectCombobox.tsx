import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Check, ChevronDown } from 'lucide-react';

export interface MultiSelectOption {
  value: number | string;
  label: string;
}

export interface MultiSelectComboboxProps {
  icon?: React.ReactNode;
  label: string;
  options: MultiSelectOption[];
  selectedValues: (number | string)[];
  onToggle: (value: number | string) => void;
  onClear: () => void;
  placeholder?: string;
  /** Estilo del botón disparador: `inline` (pill compacta) o `block` (w-full, para hojas mobile). */
  variant?: 'inline' | 'block';
  className?: string;
}

const POPOVER_WIDTH = 288;
const ALTURA_ESTIMADA = 320;

/**
 * Selector múltiple con búsqueda (`MultiSelectCombobox`).
 *
 * Botón disparador + popover posicionado vía portal a `document.body` (calculado a
 * partir del rect real del botón, igual que `SearchSelectCombobox`), así nunca queda
 * recortado por el overflow de un contenedor ancestro (barra flotante, hoja mobile).
 * Dentro del popover: input de búsqueda con sugerencias filtradas (clic para marcar/
 * desmarcar, sin cerrar, para elegir varias seguidas) y, debajo, las opciones ya
 * seleccionadas como chips removibles.
 */
export const MultiSelectCombobox: React.FC<MultiSelectComboboxProps> = ({
  icon,
  label,
  options,
  selectedValues,
  onToggle,
  onClear,
  placeholder = 'Buscar...',
  variant = 'inline',
  className = '',
}) => {
  const [abierto, setAbierto] = useState(false);
  const [query, setQuery] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties | null>(null);

  const seleccionados = useMemo(
    () => options.filter((o) => selectedValues.includes(o.value)),
    [options, selectedValues]
  );

  const sugerencias = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    if (!abierto) return;
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const dentroTrigger = Boolean(triggerRef.current?.contains(target));
      const dentroPopover = Boolean(popoverRef.current?.contains(target));
      if (!dentroTrigger && !dentroPopover) setAbierto(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setAbierto(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;

    const actualizarPosicion = () => {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const espacioAbajo = window.innerHeight - rect.bottom;
      const abrirArriba = espacioAbajo < ALTURA_ESTIMADA && rect.top > espacioAbajo;
      const anchoPopover = Math.min(POPOVER_WIDTH, window.innerWidth - 16);
      let left = rect.left;
      if (left + anchoPopover > window.innerWidth - 8) {
        left = Math.max(8, window.innerWidth - anchoPopover - 8);
      }
      setPopoverStyle({
        position: 'fixed',
        left,
        width: anchoPopover,
        ...(abrirArriba
          ? { bottom: window.innerHeight - rect.top + 6 }
          : { top: rect.bottom + 6 }),
      });
    };

    actualizarPosicion();
    window.addEventListener('resize', actualizarPosicion);
    window.addEventListener('scroll', actualizarPosicion, true);
    return () => {
      window.removeEventListener('resize', actualizarPosicion);
      window.removeEventListener('scroll', actualizarPosicion, true);
    };
  }, [abierto]);

  useEffect(() => {
    if (abierto) {
      setQuery('');
      const raf = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(raf);
    }
  }, [abierto]);

  const triggerClass =
    className ||
    (variant === 'block'
      ? 'w-full h-10 flex items-center justify-center gap-2 px-3.5 rounded-xl text-[13px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700 cursor-pointer transition-all'
      : 'h-8 flex items-center justify-center gap-1.5 px-2.5 rounded-xl text-[11.5px] font-medium bg-zinc-100/90 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-white/[0.08] text-zinc-800 dark:text-zinc-200 cursor-pointer shrink-0 transition-all');

  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setAbierto((p) => !p)} className={triggerClass}>
        {icon}
        <span>{label}</span>
        {seleccionados.length > 0 && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-blue-600 text-white tabular-nums">
            {seleccionados.length}
          </span>
        )}
        <ChevronDown size={12} className={`opacity-60 transition-transform ${abierto ? 'rotate-180' : ''}`} />
      </button>

      {abierto &&
        popoverStyle &&
        createPortal(
          <div
            ref={popoverRef}
            style={popoverStyle}
            className="rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md shadow-2xl border border-zinc-200/80 dark:border-zinc-800 z-[200] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="p-2 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
              <div className="relative h-9 flex items-center">
                <Search size={13} className="absolute left-2.5 text-zinc-400 pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={placeholder}
                  className="w-full h-9 pl-8 pr-2 text-[13px] bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-white/[0.08] rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                />
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto py-1">
              {sugerencias.length === 0 && (
                <p className="px-3 py-3 text-[12px] text-zinc-400 text-center">Sin coincidencias</p>
              )}
              {sugerencias.map((opt) => {
                const activo = selectedValues.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onToggle(opt.value)}
                    className={`w-full flex items-center justify-between gap-2 text-left px-3 py-2 text-[13px] transition-colors cursor-pointer ${
                      activo
                        ? 'bg-[#155BD0]/10 text-[#155BD0] dark:text-blue-400 font-medium'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {activo && <Check size={13} className="shrink-0" />}
                  </button>
                );
              })}
            </div>

            {seleccionados.length > 0 && (
              <div className="border-t border-zinc-100 dark:border-zinc-800 p-2 flex flex-col gap-1.5 shrink-0">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    Seleccionadas
                  </span>
                  <button
                    type="button"
                    onClick={onClear}
                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
                  >
                    Limpiar
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 px-1 pb-1 max-h-20 overflow-y-auto">
                  {seleccionados.map((opt) => (
                    <span
                      key={opt.value}
                      className="inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-full text-[11px] font-medium bg-[#155BD0]/10 text-[#155BD0] dark:text-blue-400 border border-[#155BD0]/20"
                    >
                      <span className="truncate max-w-[8rem]">{opt.label}</span>
                      <button
                        type="button"
                        onClick={() => onToggle(opt.value)}
                        className="p-0.5 rounded-full hover:bg-[#155BD0]/20 cursor-pointer"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>,
          document.body
        )}
    </>
  );
};

export default MultiSelectCombobox;
