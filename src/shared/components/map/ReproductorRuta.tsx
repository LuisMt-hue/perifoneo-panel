import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, FastForward, Clock, Gauge, Battery } from 'lucide-react';
import type { PuntoRecorrido } from '../../types/perifoneo.types';
import { formatearHora } from '../../utils/formato';

/**
 * Constantes de reproducción temporal de rutas
 */
export const PLAYBACK_SPEED_OPTIONS = [1, 10, 30, 60] as const;

export interface ReproductorRutaProps {
  puntos?: PuntoRecorrido[];
  onPosicionCambio?: (punto: PuntoRecorrido) => void;
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
    <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl p-3 sm:p-4 rounded-2xl shadow-lg border border-zinc-200/80 dark:border-zinc-800 transition-colors">
      <div className="flex flex-col md:flex-row items-center gap-3 sm:gap-4">
        {/* Controles de Reproducción y Velocidad */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <button
            type="button"
            onClick={() => {
              if (progress >= 100) setProgress(0);
              setIsPlaying(!isPlaying);
            }}
            className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-all shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer"
            title={isPlaying ? 'Pausar recorrido' : 'Reproducir recorrido'}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
          </button>

          {/* Selector de Velocidad */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1.5 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60">
            <FastForward size={14} className="text-zinc-500 dark:text-zinc-400" />
            <select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="bg-transparent text-xs font-semibold text-zinc-800 dark:text-zinc-200 border-none focus:outline-hidden cursor-pointer"
            >
              {PLAYBACK_SPEED_OPTIONS.map((opt) => (
                <option key={opt} value={opt} className="bg-white dark:bg-zinc-900">
                  {opt}x
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Barra de Progreso Deslizante */}
        <div className="flex-1 w-full flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            className="flex-1 w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 w-10 text-right tabular-nums font-semibold">
            {Math.round(progress)}%
          </span>
        </div>

        {/* Telemetría Instantánea */}
        {currentPoint && (
          <div className="w-full md:w-auto text-xs bg-zinc-100/80 dark:bg-zinc-800/60 px-3 py-1.5 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 flex items-center justify-around sm:justify-start gap-3">
            <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
              <Clock size={12} className="text-blue-600 dark:text-blue-400" />
              <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                {formatearHora(currentPoint.device_time)}
              </span>
            </div>

            <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
              <Gauge size={12} className="text-emerald-600 dark:text-emerald-400" />
              <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                {Math.round(currentPoint.velocidad_kmh || 0)} km/h
              </span>
            </div>

            {currentPoint.bateria_pct !== undefined && (
              <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
                <Battery size={12} className="text-amber-500" />
                <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  {currentPoint.bateria_pct}%
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReproductorRuta;
