import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, FastForward, Clock, Maximize2 } from 'lucide-react';
import type { PuntoRecorrido } from '../../types/perifoneo.types';
import { formatearHora } from '../../utils/formato';

/**
 * Constantes de reproducción temporal de rutas
 */
export const PLAYBACK_SPEED_OPTIONS = [1, 10, 30, 60] as const;

export interface ReproductorRutaProps {
  puntos?: PuntoRecorrido[];
  onPosicionCambio?: (punto: PuntoRecorrido) => void;
  /** Si se provee, muestra un botón para volver a encuadrar el mapa en todo el recorrido. */
  onEncuadrar?: () => void;
}

/**
 * Reproductor de Recorridos GPS estilo macOS (`ReproductorRuta`).
 *
 * Simula la reproducción temporal del trayecto GPS con controles translúcidos,
 * ajuste de velocidad, slider interactivo y barra de telemetría instantánea con iconos.
 */
export const ReproductorRuta: React.FC<ReproductorRutaProps> = ({
  puntos = [],
  onPosicionCambio,
  onEncuadrar,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [progress, setProgress] = useState(0); // 0 a 100%

  const requestRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number | undefined>(undefined);

  // Duración total en milisegundos reales entre el primer y el último punto
  const totalRealTime =
    puntos.length > 1
      ? new Date(puntos[puntos.length - 1].device_time).getTime() -
        new Date(puntos[0].device_time).getTime()
      : 0;

  useEffect(() => {
    if (!isPlaying) return;

    lastTimeRef.current = performance.now();

    const animate = (time: number) => {
      if (lastTimeRef.current != null) {
        const deltaTime = time - lastTimeRef.current;
        if (totalRealTime > 0) {
          const percentDelta = ((deltaTime * speed) / totalRealTime) * 100;
          setProgress((p) => {
            const nextProgress = p + percentDelta;
            if (nextProgress >= 100) {
              setIsPlaying(false);
              return 100;
            }
            return nextProgress;
          });
        } else {
          setProgress(100);
          setIsPlaying(false);
        }
      }
      lastTimeRef.current = time;
      if (isPlaying) {
        requestRef.current = requestAnimationFrame(animate);
      }
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, speed, totalRealTime]);

  // Sincronización del punto actual según el progreso porcentual usando búsqueda binaria
  useEffect(() => {
    if (!puntos || puntos.length === 0) return;

    if (puntos.length === 1) {
      onPosicionCambio?.(puntos[0]);
      return;
    }

    const startTime = new Date(puntos[0].device_time).getTime();
    const targetTime = startTime + totalRealTime * (progress / 100);

    let left = 0;
    let right = puntos.length - 1;
    let nearest = puntos[0];

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const midTime = new Date(puntos[mid].device_time).getTime();

      if (midTime === targetTime) {
        nearest = puntos[mid];
        break;
      }

      const diffActual = Math.abs(midTime - targetTime);
      const diffMejor = Math.abs(new Date(nearest.device_time).getTime() - targetTime);
      if (diffActual < diffMejor) {
        nearest = puntos[mid];
      }

      if (midTime < targetTime) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    onPosicionCambio?.(nearest);
  }, [progress, puntos, onPosicionCambio, totalRealTime]);

  if (!puntos || puntos.length === 0) return null;

  const currentPointIndex = Math.min(
    Math.floor((progress / 100) * puntos.length),
    puntos.length - 1
  );
  const currentPoint = puntos[currentPointIndex] || puntos[0];

  return (
    <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl shadow-lg border border-zinc-200/80 dark:border-zinc-800 transition-colors">
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => {
            if (progress >= 100) setProgress(0);
            setIsPlaying(!isPlaying);
          }}
          className="w-8 h-8 shrink-0 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-all shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer"
          title={isPlaying ? 'Pausar recorrido' : 'Reproducir recorrido'}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
        </button>

        {/* Selector de Velocidad */}
        <div className="hidden sm:flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-1 rounded-lg border border-zinc-200/60 dark:border-zinc-700/60 shrink-0">
          <FastForward size={12} className="text-zinc-500 dark:text-zinc-400" />
          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="bg-transparent text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 border-none focus:outline-hidden cursor-pointer"
          >
            {PLAYBACK_SPEED_OPTIONS.map((opt) => (
              <option key={opt} value={opt} className="bg-white dark:bg-zinc-900">
                {opt}x
              </option>
            ))}
          </select>
        </div>

        {/* Barra de Progreso Deslizante */}
        <input
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={progress}
          onChange={(e) => setProgress(Number(e.target.value))}
          className="flex-1 min-w-0 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />

        {/* Hora del instante actual */}
        {currentPoint && (
          <div className="shrink-0 flex items-center gap-1 text-[11px] font-mono font-semibold text-zinc-600 dark:text-zinc-400">
            <Clock size={11} className="hidden sm:block text-blue-600 dark:text-blue-400" />
            <span className="text-zinc-900 dark:text-zinc-100">{formatearHora(currentPoint.device_time)}</span>
            <span className="hidden sm:inline tabular-nums">({Math.round(progress)}%)</span>
          </div>
        )}

        {/* Encuadrar todo el recorrido en el mapa */}
        {onEncuadrar && (
          <button
            type="button"
            onClick={onEncuadrar}
            title="Ver todo el recorrido en el mapa"
            className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
          >
            <Maximize2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ReproductorRuta;
