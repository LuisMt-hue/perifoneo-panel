import { useState, useEffect, useRef } from 'react';
import { Play, Pause, FastForward } from 'lucide-react';
import { formatearHora } from '../utilidades/formato.js';

export default function Reproductor({ puntos = [], onPosicionCambio }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [progress, setProgress] = useState(0); // 0 to 100
  
  const requestRef = useRef();
  const lastTimeRef = useRef();
  
  const totalRealTime = puntos.length > 1 ? 
    new Date(puntos[puntos.length - 1].device_time).getTime() - new Date(puntos[0].device_time).getTime() 
    : 0;

  useEffect(() => {
    if (!isPlaying) return;
    
    lastTimeRef.current = performance.now();
    
    const animate = (time) => {
      if (lastTimeRef.current != null) {
        const deltaTime = time - lastTimeRef.current; // ms
        if (totalRealTime > 0) {
           const percentDelta = ((deltaTime * speed) / totalRealTime) * 100;
           setProgress(p => {
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
    return () => cancelAnimationFrame(requestRef.current);
  }, [isPlaying, speed, totalRealTime]);

  useEffect(() => {
    if (!puntos || puntos.length === 0) return;
    
    if (puntos.length === 1) {
      onPosicionCambio?.(puntos[0]);
      return;
    }
    
    const targetTime = new Date(puntos[0].device_time).getTime() + (totalRealTime * (progress / 100));
    
    // Binary search
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
      
      if (Math.abs(midTime - targetTime) < Math.abs(new Date(nearest.device_time).getTime() - targetTime)) {
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
  const currentPointIndex = Math.min(Math.floor((progress / 100) * puntos.length), puntos.length - 1);
  const currentPoint = puntos[currentPointIndex] || puntos[0];

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
      <div className="flex flex-col md:flex-row items-center gap-4">
        <button
          onClick={() => {
            if (progress >= 100) setProgress(0);
            setIsPlaying(!isPlaying);
          }}
          className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </button>
        
        <div className="flex items-center gap-2">
          <FastForward size={20} className="text-gray-500" />
          <select 
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={1}>1x</option>
            <option value={10}>10x</option>
            <option value={30}>30x</option>
            <option value={60}>60x</option>
          </select>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={progress}
          onChange={(e) => {
            setProgress(Number(e.target.value));
          }}
          className="flex-1 w-full accent-blue-600"
        />
        
        {currentPoint && (
          <div className="text-sm text-gray-700 min-w-[150px]">
            <div><span className="font-semibold">Hora:</span> {formatearHora(currentPoint.device_time)}</div>
            <div><span className="font-semibold">Vel:</span> {currentPoint.velocidad_kmh || 0} km/h</div>
            {currentPoint.bateria_pct !== undefined && <div><span className="font-semibold">Bat:</span> {currentPoint.bateria_pct}%</div>}
          </div>
        )}
      </div>
    </div>
  );
}
