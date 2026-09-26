import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';

export interface ComboboxOption {
  value: string;
  label: string;
  /** Texto secundario mostrado a la derecha en la sugerencia (ej. DNI), no afecta el valor confirmado. */
  sublabel?: string;
  /** Texto adicional (no visible) que también se compara al buscar, ej. un DNI o alias. */
  keywords?: string;
}

interface SearchSelectComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyOptionLabel?: string;
  /** Si es true (default), un texto que no coincide con ninguna opción se acepta como valor nuevo. */
  allowCustomValue?: boolean;
  maxSuggestions?: number;
  disabled?: boolean;
  className?: string;
}

/**
 * Combo box estilo macOS: campo de texto con búsqueda + botón desplegable,
 * mostrando como máximo `maxSuggestions` opciones a la vez (HIG `combo-boxes.md`:
 * "combines a text field with a pull-down button in a single control").
 *
 * Con `allowCustomValue` (Base) el texto tipeado se acepta aunque no exista en la
 * lista. Sin él (Grupo, Sector) solo se puede confirmar un valor de la lista;
 * si el texto no coincide con nada al cerrar, vuelve al último valor válido.
 */
export const SearchSelectCombobox: React.FC<SearchSelectComboboxProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Buscar...',
  emptyOptionLabel = 'Sin asignar',
  allowCustomValue = true,
  maxSuggestions = 3,
  disabled = false,
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);

  const opcionActual = useMemo(() => options.find((o) => o.value === value) || null, [options, value]);

  useEffect(() => {
    if (!abierto) {
      setQuery(opcionActual ? opcionActual.label : value || '');
    }
  }, [opcionActual, value, abierto]);

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

  const sugerencias = useMemo(() => {
    const q = query.trim().toLowerCase();
    const lista = q
      ? options.filter((o) => `${o.label} ${o.keywords || ''}`.toLowerCase().includes(q))
      : options;
    return lista.slice(0, maxSuggestions);
  }, [options, query, maxSuggestions]);

  const handleSelect = (opt: ComboboxOption) => {
    onChange(opt.value);
    setQuery(opt.label);
    setAbierto(false);
  };

  const handleClear = () => {
    onChange('');
    setQuery('');
    setAbierto(false);
  };

  const handleBlurCommit = () => {
    const trimmed = query.trim();
    if (!trimmed) {
      onChange('');
      return;
    }
    const match = options.find((o) => o.label.toLowerCase() === trimmed.toLowerCase());
    if (match) {
      onChange(match.value);
      setQuery(match.label);
      return;
    }
    if (allowCustomValue) {
      onChange(trimmed);
    } else {
      // Sin coincidencia y sin permitir valores libres: revertir al último valor confirmado
      setQuery(opcionActual ? opcionActual.label : '');
    }
  };

  return (
    <div className={`relative ${className}`} ref={contenedorRef}>
      <div className="relative h-9 flex items-center">
        <Search size={13} className="absolute left-3 text-zinc-400 pointer-events-none" />
        <input
          type="text"
          disabled={disabled}
          value={query}
          onFocus={() => setAbierto(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setAbierto(true);
          }}
          onBlur={handleBlurCommit}
          placeholder={placeholder}
          className="w-full h-9 pl-8 pr-14 text-[13px] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#155BD0]/20 focus:border-[#155BD0] transition-all disabled:opacity-50"
        />
        <div className="absolute right-1.5 flex items-center gap-0.5">
          {value && (
            <button
              type="button"
              tabIndex={-1}
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleClear}
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              title="Limpiar"
            >
              <X size={12} />
            </button>
          )}
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setAbierto((prev) => !prev)}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer disabled:opacity-50"
            title="Mostrar opciones"
          >
            <ChevronDown size={13} className={`transition-transform ${abierto ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {abierto && (
        <div className="absolute left-0 top-full mt-1.5 w-full min-w-[180px] rounded-xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md shadow-xl border border-zinc-200/80 dark:border-zinc-800 z-50 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-150">
          {!query.trim() && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleClear}
              className="w-full text-left px-3 py-1.5 text-[13px] italic text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
            >
              {emptyOptionLabel}
            </button>
          )}
          {sugerencias.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(opt)}
              className={`w-full flex items-center justify-between gap-2 text-left px-3 py-1.5 text-[13px] transition-colors cursor-pointer ${
                opt.value === value
                  ? 'bg-[#155BD0]/10 text-[#155BD0] dark:text-blue-400 font-medium'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
              }`}
            >
              <span className="truncate">{opt.label}</span>
              {opt.sublabel && (
                <span className="text-[11px] font-mono text-zinc-400 shrink-0">{opt.sublabel}</span>
              )}
            </button>
          ))}
          {sugerencias.length === 0 && query.trim() && (
            <div className="px-3 py-2 text-[13px] text-zinc-400">
              {allowCustomValue ? `Usar "${query.trim()}"` : 'Sin coincidencias'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchSelectCombobox;
