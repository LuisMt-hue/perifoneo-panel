import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { TraccarDevice } from '../../live/types';

interface PerifoneadorComboboxProps {
  dispositivos: TraccarDevice[];
  value: string; // deviceId como string, '' = todos
  onChange: (deviceId: string) => void;
}

const MAX_SUGERENCIAS = 8;

/**
 * Buscador de perifoneador con sugerencias filtrables por nombre o DNI,
 * reemplaza el <select> largo por un combobox tipo Apple.
 */
export const PerifoneadorCombobox: React.FC<PerifoneadorComboboxProps> = ({
  dispositivos,
  value,
  onChange,
}) => {
  const [query, setQuery] = useState('');
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);

  const dispositivoSeleccionado = useMemo(
    () => dispositivos.find((d) => String(d.id) === value) || null,
    [dispositivos, value]
  );

  // Sincronizar el texto mostrado con el dispositivo seleccionado externamente
  useEffect(() => {
    if (!abierto) {
      setQuery(dispositivoSeleccionado ? dispositivoSeleccionado.name : '');
    }
  }, [dispositivoSeleccionado, abierto]);

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
    if (!q) return dispositivos.slice(0, MAX_SUGERENCIAS);
    return dispositivos
      .filter((d) => d.name.toLowerCase().includes(q) || d.uniqueId?.toLowerCase().includes(q))
      .slice(0, MAX_SUGERENCIAS);
  }, [dispositivos, query]);

  const handleSelect = (d: TraccarDevice) => {
    onChange(String(d.id));
    setQuery(d.name);
    setAbierto(false);
  };

  const handleClear = () => {
    onChange('');
    setQuery('');
  };

  return (
    <div className="relative" ref={contenedorRef}>
      <div className="relative w-52 h-8 flex items-center">
        <Search size={13} className="absolute left-2.5 text-zinc-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onFocus={() => setAbierto(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setAbierto(true);
          }}
          placeholder="Buscar perifoneador..."
          className="w-full h-8 pl-7 pr-7 text-xs font-medium bg-white dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700/80 rounded-[21px] text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#155BD0]/20 focus:border-[#155BD0]"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {abierto && sugerencias.length > 0 && (
        <div className="absolute left-0 top-full mt-1.5 w-64 max-h-64 overflow-y-auto rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md shadow-xl border border-zinc-200/80 dark:border-zinc-800 z-50 py-1 animate-in fade-in zoom-in-95 duration-150">
          {sugerencias.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => handleSelect(d)}
              className="w-full flex items-center justify-between gap-2 px-3 py-1.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
            >
              <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                {d.name}
              </span>
              {d.uniqueId && (
                <span className="text-2xs font-mono text-zinc-400 shrink-0">{d.uniqueId}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {abierto && query.trim() && sugerencias.length === 0 && (
        <div className="absolute left-0 top-full mt-1.5 w-64 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md shadow-xl border border-zinc-200/80 dark:border-zinc-800 z-50 px-3 py-2.5 text-xs text-zinc-400">
          Sin coincidencias
        </div>
      )}
    </div>
  );
};

export default PerifoneadorCombobox;
