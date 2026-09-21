import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Marker, Popup, useMap } from 'react-leaflet';
import L, { type LatLngExpression } from 'leaflet';
import {
  Battery,
  BatteryCharging,
  BatteryLow,
  Clock,
  Gauge,
  Phone,
  MapPin,
  Radio,
  Search,
  Filter,
  List,
  Map as MapIcon,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock3,
} from 'lucide-react';
import { obtenerEnVivo, obtenerSectores } from '../../services/api/endpoints';
import MapaBase, { CENTRO_TACNA } from '../../components/map/MapaBase';
import CapaSectores from '../../components/map/CapaSectores';
import { formatearFechaHora, formatearDuracionDesde } from '../../utils/formato';
import type { PerifoneadorVivo, Sector } from '../../types/perifoneo.types';

/**
 * Traslada suavemente la cámara del mapa hacia una posición seleccionada.
 */
const FlyToMarker: React.FC<{ position: LatLngExpression | null }> = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 16, { duration: 1.2 });
    }
  }, [position, map]);
  return null;
};

/**
 * Crea un icono HTML personalizado con semáforo pulsante para el perifoneador.
 */
const getMarkerIcon = (estado: string) => {
  let colorClass = 'bg-zinc-400 border-zinc-200';
  let pingClass = 'bg-zinc-400';
  if (estado === 'ACTIVO') {
    colorClass = 'bg-emerald-500 border-white dark:border-zinc-900';
    pingClass = 'bg-emerald-500';
  } else if (estado === 'DEMORADO') {
    colorClass = 'bg-amber-500 border-white dark:border-zinc-900';
    pingClass = 'bg-amber-500';
  } else if (estado === 'SIN_SENAL') {
    colorClass = 'bg-rose-500 border-white dark:border-zinc-900';
    pingClass = 'bg-rose-500';
  }

  return L.divIcon({
    className: 'custom-live-marker',
    html: `<div class="relative flex items-center justify-center">
             <span class="animate-ping absolute inline-flex h-5 w-5 rounded-full ${pingClass} opacity-60"></span>
             <div class="w-4 h-4 rounded-full border-2 ${colorClass} shadow-md relative z-10"></div>
           </div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

/**
 * Normaliza campos de la API para soportar posibles variantes de atributos.
 */
const normalizarPerifoneador = (d: PerifoneadorVivo): PerifoneadorVivo => ({
  ...d,
  lat: d.lat ?? d.latitud ?? 0,
  lon: d.lon ?? d.longitud ?? 0,
  velocidad: d.velocidad_kmh ?? d.velocidad ?? 0,
  bateria: d.bateria_pct ?? d.bateria,
  hora: d.hora ?? d.ultimo_reporte,
  sectorNombre: d.sector ?? d.sector_nombre ?? d.sectorNombre,
});

/**
 * Página de Monitoreo en Tiempo Real estilo macOS (`MonitoreoEnVivoPage`).
 *
 * Incluye:
 * - Panel lateral estilo Finder con búsqueda rápida y filtros.
 * - Modo móvil con alternador flotante entre Mapa y Lista.
 * - Soporte total de modo oscuro con semaforización luminosa.
 */
export const MonitoreoEnVivoPage: React.FC = () => {
  const [sectorFilter, setSectorFilter] = useState<string>('');
  const [busqueda, setBusqueda] = useState<string>('');
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null);
  const [vistaMovil, setVistaMovil] = useState<'mapa' | 'lista'>('mapa');

  // Consulta de sectores geográficos
  const { data: sectores = [] } = useQuery<Sector[]>({
    queryKey: ['sectores'],
    queryFn: obtenerSectores,
  });

  // Consulta de posiciones en vivo con sondeo automático cada 30 segundos
  const { data: enVivoRaw = [] } = useQuery<PerifoneadorVivo[]>({
    queryKey: ['envivo'],
    queryFn: obtenerEnVivo,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });

  // Procesamiento y filtrado de datos
  const enVivo = (Array.isArray(enVivoRaw) ? enVivoRaw : [])
    .map(normalizarPerifoneador)
    .filter((d) => d.lat != null && d.lon != null && d.lat !== 0 && d.lon !== 0);

  const filteredData = enVivo.filter((d) => {
    const coincideSector = !sectorFilter || String(d.sector_id) === String(sectorFilter);
    const coincideBusqueda =
      !busqueda ||
      d.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      d.dni?.toLowerCase().includes(busqueda.toLowerCase()) ||
      d.sectorNombre?.toLowerCase().includes(busqueda.toLowerCase());
    return coincideSector && coincideBusqueda;
  });

  // Prioridad: SIN_SENAL -> DEMORADO -> ACTIVO
  const sortedData = [...filteredData].sort((a, b) => {
    const ordenPrioridad: Record<string, number> = { SIN_SENAL: 1, DEMORADO: 2, ACTIVO: 3 };
    return (ordenPrioridad[a.estado] || 4) - (ordenPrioridad[b.estado] || 4);
  });

  // Conteo de estados
  const activos = enVivo.filter((d) => d.estado === 'ACTIVO').length;
  const demorados = enVivo.filter((d) => d.estado === 'DEMORADO').length;
  const sinSenal = enVivo.filter((d) => d.estado === 'SIN_SENAL').length;

  const handleSeleccionarPerifoneador = (lat: number, lon: number) => {
    setSelectedPosition([lat, lon]);
    setVistaMovil('mapa');
  };

  return (
    <div className="flex h-full w-full relative overflow-hidden bg-zinc-100 dark:bg-zinc-950">
      {/* Botón flotante para alternar vista en Móviles */}
      <div className="md:hidden absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl p-1 rounded-2xl shadow-xl border border-zinc-200/80 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setVistaMovil('mapa')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            vistaMovil === 'mapa'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
          }`}
        >
          <MapIcon size={14} />
          <span>Mapa</span>
        </button>
        <button
          type="button"
          onClick={() => setVistaMovil('lista')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            vistaMovil === 'lista'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
          }`}
        >
          <List size={14} />
          <span>Lista ({sortedData.length})</span>
        </button>
      </div>

      {/* Panel Lateral Izquierdo estilo macOS Finder */}
      <aside
        className={`w-full md:w-88 lg:w-96 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl border-r border-zinc-200/80 dark:border-zinc-800 flex flex-col z-20 transition-all duration-200 ${
          vistaMovil === 'mapa' ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Cabecera del Panel */}
        <div className="p-3.5 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/40">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-600/10 dark:bg-blue-400/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Radio size={14} className="animate-pulse" />
              </div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                Monitoreo en Vivo
              </h2>
            </div>
            <span className="text-2xs font-mono font-medium px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
              Sondeo 30s
            </span>
          </div>

          {/* Semáforo Consolidado macOS Pills */}
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-1.5 rounded-lg text-2xs font-semibold">
              <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="truncate">{activos} Activos</span>
            </div>

            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 px-2 py-1.5 rounded-lg text-2xs font-semibold">
              <Clock3 size={12} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="truncate">{demorados} Demora</span>
            </div>

            <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 px-2 py-1.5 rounded-lg text-2xs font-semibold">
              <AlertCircle size={12} className="text-rose-600 dark:text-rose-400 shrink-0" />
              <span className="truncate">{sinSenal} Alerta</span>
            </div>
          </div>

          {/* Filtros de Búsqueda y Sector */}
          <div className="space-y-2">
            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
              />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, DNI..."
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 shadow-2xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="relative">
              <Filter
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
              />
              <select
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 rounded-lg text-xs font-medium text-zinc-800 dark:text-zinc-200 shadow-2xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors cursor-pointer"
              >
                <option value="">Todos los sectores ({sectores.length})</option>
                {sectores.map((s) => (
                  <option key={s.id} value={s.id} className="dark:bg-zinc-900">
                    {s.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Listado de Perifoneadores */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y-0">
          {sortedData.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-400 dark:text-zinc-500">
              No hay perifoneadores activos en los filtros seleccionados.
            </div>
          ) : (
            sortedData.map((d) => {
              const esActivo = d.estado === 'ACTIVO';
              const esDemorado = d.estado === 'DEMORADO';
              const estadoColor = esActivo
                ? 'bg-emerald-500 ring-emerald-500/30'
                : esDemorado
                ? 'bg-amber-500 ring-amber-500/30'
                : 'bg-rose-500 ring-rose-500/30';

              return (
                <div
                  key={d.id}
                  onClick={() => handleSeleccionarPerifoneador(d.lat, d.lon)}
                  className="p-3 rounded-xl hover:bg-zinc-100/90 dark:hover:bg-zinc-800/70 border border-transparent hover:border-zinc-200/60 dark:hover:border-zinc-700/60 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${estadoColor} ring-4 shrink-0`}
                        title={d.estado}
                      />
                      <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {d.nombre}
                      </span>
                    </div>

                    <ChevronRight
                      size={14}
                      className="text-zinc-300 dark:text-zinc-600 group-hover:text-blue-500 transition-colors shrink-0"
                    />
                  </div>

                  <div className="flex items-center gap-1 text-2xs text-zinc-500 dark:text-zinc-400 mb-2 pl-4.5">
                    <MapPin size={11} className="text-zinc-400 shrink-0" />
                    <span className="truncate">{d.sectorNombre || 'Sin sector asignado'}</span>
                  </div>

                  <div className="flex items-center justify-between text-2xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/40 px-2.5 py-1.5 rounded-lg border border-zinc-100 dark:border-zinc-800/60">
                    <span className="flex items-center gap-1">
                      <Clock size={11} className="text-zinc-400" />
                      <span>{formatearDuracionDesde(d.hora)}</span>
                    </span>

                    <span className="flex items-center gap-1 font-mono font-medium">
                      <Gauge size={11} className="text-emerald-500" />
                      <span>{Math.round(d.velocidad || 0)} km/h</span>
                    </span>

                    {d.bateria != null && (
                      <span className="flex items-center gap-1 font-mono font-medium">
                        {d.bateria > 50 ? (
                          <BatteryCharging size={12} className="text-emerald-500" />
                        ) : d.bateria > 20 ? (
                          <Battery size={12} className="text-amber-500" />
                        ) : (
                          <BatteryLow size={12} className="text-rose-500 animate-pulse" />
                        )}
                        <span>{d.bateria}%</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Contenedor del Mapa Central */}
      <div
        className={`flex-1 h-full relative transition-all duration-200 ${
          vistaMovil === 'lista' ? 'hidden md:block' : 'block'
        }`}
      >
        <MapaBase centro={CENTRO_TACNA} zoom={13}>
          <CapaSectores sectores={sectores} />

          {filteredData.map((d) => (
            <Marker
              key={d.id}
              position={[d.lat, d.lon]}
              icon={getMarkerIcon(d.estado)}
            >
              <Popup>
                <div className="p-1 min-w-[210px] text-xs">
                  <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700/80 pb-1.5 mb-2">
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100 truncate pr-2">
                      {d.nombre}
                    </h3>
                    <span
                      className={`text-3xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        d.estado === 'ACTIVO'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : d.estado === 'DEMORADO'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {d.estado}
                    </span>
                  </div>

                  <div className="text-zinc-600 dark:text-zinc-300 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">DNI:</span>
                      <span className="font-mono font-medium">{d.dni || 'N/A'}</span>
                    </div>

                    {d.telefono && (
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">Teléfono:</span>
                        <a
                          href={`tel:${d.telefono}`}
                          className="text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
                        >
                          <Phone size={11} />
                          <span>{d.telefono}</span>
                        </a>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Sector:</span>
                      <span className="font-medium truncate max-w-[130px]">
                        {d.sectorNombre || 'Sin sector'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Último reporte:</span>
                      <span className="font-mono">{formatearFechaHora(d.hora)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Velocidad:</span>
                      <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        {Math.round(d.velocidad || 0)} km/h
                      </span>
                    </div>

                    {d.bateria != null && (
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">Batería:</span>
                        <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                          {d.bateria}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          <FlyToMarker position={selectedPosition} />
        </MapaBase>
      </div>
    </div>
  );
};

export default MonitoreoEnVivoPage;
