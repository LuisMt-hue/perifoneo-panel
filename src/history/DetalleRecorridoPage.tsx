import React, { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Marker, Popup } from 'react-leaflet';
import {
  ArrowLeft,
  Download,
  Printer,
  Compass,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import {
  obtenerDispositivosTraccar,
  obtenerGeocercasTraccar,
  obtenerRutaDetalladaTraccar,
  obtenerTripsTraccar,
  obtenerStopsTraccar,
  obtenerGeofenceReportsTraccar,
  resolverSectorDispositivo,
  obtenerDuracionSegundos,
} from './api';
import { parseTraccarGeofence } from '../live/utils/geofenceParser';
import MapaBase, { CENTRO_TACNA } from '../shared/components/map/MapaBase';
import CapaSectores from '../shared/components/map/CapaSectores';
import RutaBicolor from '../shared/components/map/RutaBicolor';
import ReproductorRuta from '../shared/components/map/ReproductorRuta';
import {
  formatearFecha,
  formatearHora,
  formatearDuracion,
  formatearPorcentaje,
  hoy,
} from '../shared/utils/formato';
import { exportarGPX } from '../shared/utils/gpx';
import type { PuntoRecorrido, Sector } from '../shared/types/perifoneo.types';

/**
 * Constantes de telemetría y estilos para el Detalle de Recorrido
 */
export const KNOTS_TO_KMH = 1.852;
export const DEFAULT_SECTOR_COLOR = '#155BD0';

/**
 * Página de Detalle de Recorrido con diseño Apple UI System (Inter, 4px grid, #155BD0, rounded-[21px]).
 *
 * Muestra el trazado GPS con capa bicolor (verde en sector / rojo fuera),
 * polígonos de geocerca Traccar (A1, A2, etc.) y panel inspector con métricas exactas.
 */
export const DetalleRecorridoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const fecha = queryParams.get('fecha') || hoy();

  const [posicionActual, setPosicionActual] = useState<PuntoRecorrido | null>(null);
  const onPosicionCambio = useCallback((p: PuntoRecorrido) => setPosicionActual(p), []);

  const deviceId = Number(id);

  // 1. Obtener catálogo de dispositivos
  const { data: dispositivos = [] } = useQuery({
    queryKey: ['traccarDevices'],
    queryFn: obtenerDispositivosTraccar,
  });

  // 2. Obtener catálogo de geocercas
  const { data: geocercas = [] } = useQuery({
    queryKey: ['traccarGeofences'],
    queryFn: obtenerGeocercasTraccar,
  });

  const dispositivo = useMemo(
    () => dispositivos.find((d) => d.id === deviceId),
    [dispositivos, deviceId]
  );

  const sectorInfo = useMemo(() => {
    if (!dispositivo) return { sectorNombre: null, geofenceId: null };
    return resolverSectorDispositivo(dispositivo, geocercas);
  }, [dispositivo, geocercas]);

  // Rango de fechas ISO en hora peruana
  const fromISO = useMemo(() => new Date(`${fecha}T00:00:00-05:00`).toISOString(), [fecha]);
  const toISO = useMemo(() => new Date(`${fecha}T23:59:59.999-05:00`).toISOString(), [fecha]);

  // 3. Consulta de puntos de ruta detallados de Traccar
  const { data: puntosRaw = [], isLoading: cargandoPuntos } = useQuery({
    queryKey: ['traccarRutaDetalle', deviceId, fecha],
    enabled: Boolean(deviceId),
    queryFn: () => obtenerRutaDetalladaTraccar(deviceId, fromISO, toISO),
  });

  // 4. Consulta de viajes del dispositivo en la fecha
  const { data: trips = [] } = useQuery({
    queryKey: ['traccarDeviceTrips', deviceId, fecha],
    enabled: Boolean(deviceId),
    queryFn: () => obtenerTripsTraccar({ deviceIds: [deviceId], from: fromISO, to: toISO }),
  });

  // 5. Consulta de paradas del dispositivo en la fecha
  const { data: stops = [] } = useQuery({
    queryKey: ['traccarDeviceStops', deviceId, fecha],
    enabled: Boolean(deviceId),
    queryFn: () => obtenerStopsTraccar({ deviceIds: [deviceId], from: fromISO, to: toISO }),
  });

  // 6. Consulta de permanencia en geocercas
  const { data: geofenceIntervals = [] } = useQuery({
    queryKey: ['traccarDeviceGeofenceIntervals', deviceId, fecha],
    enabled: Boolean(deviceId),
    queryFn: () =>
      obtenerGeofenceReportsTraccar({ deviceIds: [deviceId], from: fromISO, to: toISO }),
  });

  // Mapear puntos GPS a formato PuntoRecorrido
  const puntos: PuntoRecorrido[] = useMemo(() => {
    return puntosRaw.map((pt) => {
      let dentro = true;
      if (sectorInfo.geofenceId) {
        dentro = (pt.geofenceIds || []).includes(sectorInfo.geofenceId);
      }

      return {
        device_time: pt.fixTime,
        lat: pt.latitude,
        lon: pt.longitude,
        velocidad_kmh: Math.round((pt.speed || 0) * KNOTS_TO_KMH),
        dentro_sector: dentro ? 1 : 0,
        bateria_pct: pt.attributes?.batteryLevel ?? pt.attributes?.battery,
        precision_m: pt.attributes?.accuracy,
      };
    });
  }, [puntosRaw, sectorInfo]);

  // Preparar polígono del sector para el mapa
  const sectoresFondo: Sector[] = useMemo(() => {
    if (!sectorInfo.geofenceId) return [];
    const g = geocercas.find((geo) => geo.id === sectorInfo.geofenceId);
    if (!g) return [];
    const feat = parseTraccarGeofence(g);
    if (!feat) return [];

    return [
      {
        id: g.id,
        nombre: g.name,
        geojson: feat.geometry,
        color: g.attributes?.color || DEFAULT_SECTOR_COLOR,
      },
    ];
  }, [sectorInfo, geocercas]);

  // Métricas acumuladas del dispositivo en el día (con cálculo preciso de duración)
  const metricas = useMemo(() => {
    const duracionSegundosTrips = trips.reduce(
      (acc, t) => acc + obtenerDuracionSegundos(t),
      0
    );
    const duracionMinutos = Math.round(duracionSegundosTrips / 60);

    const duracionSegundosStops = stops.reduce(
      (acc, s) => acc + obtenerDuracionSegundos(s),
      0
    );
    const minutosDetenido = Math.round(duracionSegundosStops / 60);

    const distanciaMetros = trips.reduce((acc, t) => acc + (t.distance || 0), 0);
    const distanciaKm = distanciaMetros / 1000;

    let inicio: string | null = null;
    let fin: string | null = null;

    if (trips.length > 0) {
      trips.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      inicio = trips[0].startTime;
      fin = trips[trips.length - 1].endTime;
    } else if (puntos.length > 0) {
      inicio = puntos[0].device_time;
      fin = puntos[puntos.length - 1].device_time;
    }

    let minutosDentro: number | null = null;
    let minutosFuera: number | null = null;
    let pctDentro = 100;

    if (sectorInfo.sectorNombre) {
      let totalSegundosDentro = 0;
      for (const interval of geofenceIntervals) {
        if (sectorInfo.geofenceId && interval.geofenceId === sectorInfo.geofenceId) {
          totalSegundosDentro += obtenerDuracionSegundos(interval);
        }
      }
      minutosDentro = Math.round(totalSegundosDentro / 60);
      minutosFuera = Math.max(0, duracionMinutos - minutosDentro);
      pctDentro = duracionMinutos > 0 ? Math.round((minutosDentro / duracionMinutos) * 100) : 100;
    }

    return {
      inicio,
      fin,
      duracionMinutos,
      minutosDetenido,
      distanciaKm,
      minutosDentro,
      minutosFuera,
      pctDentro,
    };
  }, [trips, stops, geofenceIntervals, puntos, sectorInfo]);

  if (cargandoPuntos) {
    return (
      <div className="flex flex-col justify-center items-center h-full p-8 text-zinc-500 dark:text-zinc-400 gap-3 bg-white dark:bg-zinc-950">
        <Loader2 size={32} className="animate-spin text-[#155BD0] dark:text-blue-400" />
        <span className="text-xs font-medium">Cargando telemetría de ruta desde Traccar...</span>
      </div>
    );
  }

  const nombreDispositivo = dispositivo?.name || `Dispositivo #${deviceId}`;
  const centroMapa: [number, number] =
    puntos.length > 0 ? [puntos[0].lat, puntos[0].lon] : CENTRO_TACNA;

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col overflow-y-auto bg-white dark:bg-zinc-950 font-sans transition-colors">
      <div className="max-w-7xl mx-auto w-full flex flex-col flex-1 gap-4">
        {/* Barra Superior estilo Apple */}
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/historial')}
              className="size-9 rounded-[21px] flex items-center justify-center bg-zinc-800 hover:bg-zinc-900 active:bg-black text-white transition-all cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-zinc-500"
              title="Regresar al historial"
              aria-label="Regresar al historial de recorridos"
            >
              <ArrowLeft size={16} />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
                  <Compass size={18} className="text-[#155BD0] dark:text-blue-400" />
                  <span>{nombreDispositivo}</span>
                </h1>
              </div>
              <p className="text-2xs text-zinc-500 dark:text-zinc-400">
                Sector:{' '}
                <strong className="text-zinc-700 dark:text-zinc-300">
                  {sectorInfo.sectorNombre || 'Sin sector asignado'}
                </strong>{' '}
                | Fecha:{' '}
                <strong className="text-zinc-700 dark:text-zinc-300 font-mono">
                  {formatearFecha(fecha)}
                </strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Exportar a GPX - Sólido Esmeralda */}
            <button
              type="button"
              disabled={puntos.length === 0}
              onClick={() => exportarGPX(puntos, nombreDispositivo)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-[21px] text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              aria-label="Descargar recorrido en formato GPX"
            >
              <Download size={13} />
              <span>Descargar GPX</span>
            </button>

            {/* Imprimir Informe - Sólido Neutro */}
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-900 active:bg-black text-white rounded-[21px] text-xs font-semibold shadow-xs transition-all cursor-pointer no-print focus:outline-none focus:ring-2 focus:ring-zinc-500"
              aria-label="Imprimir informe de recorrido"
            >
              <Printer size={13} />
              <span>Imprimir</span>
            </button>
          </div>
        </div>

        {/* Área Central: Mapa y Panel Inspector Apple */}
        <div className="flex-1 flex gap-4 min-h-[420px] flex-col lg:flex-row">
          {/* Contenedor del Mapa con borde sutil Apple */}
          <div className="flex-1 rounded-[21px] overflow-hidden relative shadow-xs border border-zinc-200/80 dark:border-zinc-800 min-h-[360px]">
            <MapaBase centro={centroMapa} zoom={14}>
              {sectoresFondo.length > 0 && <CapaSectores sectores={sectoresFondo} />}
              {puntos.length > 0 && <RutaBicolor puntos={puntos} />}

              {/* Marcador de Telemetría Dinámica en Reproducción */}
              {posicionActual && posicionActual.lat != null && (
                <Marker position={[posicionActual.lat, posicionActual.lon]}>
                  <Popup>
                    <div className="text-xs text-zinc-800 dark:text-zinc-200 space-y-1">
                      <p className="font-bold border-b border-zinc-200 dark:border-zinc-700 pb-1">
                        Telemetría en instante
                      </p>
                      <p className="font-mono">Hora: {formatearHora(posicionActual.device_time)}</p>
                      <p className="font-mono">Velocidad: {posicionActual.velocidad_kmh || 0} km/h</p>
                      {posicionActual.bateria_pct !== undefined && (
                        <p className="font-mono">Batería: {posicionActual.bateria_pct}%</p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapaBase>
          </div>

          {/* Panel Inspector de Métricas estilo Apple Card */}
          <div className="w-full lg:w-80 bg-white dark:bg-zinc-900 rounded-[21px] shadow-xs border border-zinc-200/80 dark:border-zinc-800 p-4 sm:p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2.5 mb-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <ShieldCheck size={15} className="text-[#155BD0] dark:text-blue-400" />
                  <span>Auditoría de Jornada</span>
                </h2>
                {sectorInfo.sectorNombre && (
                  <span
                    className={`px-2.5 py-0.5 rounded-[21px] text-3xs font-bold uppercase tracking-wider ${
                      metricas.pctDentro >= 80
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {metricas.pctDentro >= 80 ? 'Cumplido' : 'Observado'}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-zinc-50/70 dark:bg-zinc-800/40 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/60">
                  <p className="text-2xs text-zinc-400 dark:text-zinc-500 font-medium">Hora Inicio</p>
                  <p className="font-mono font-bold text-zinc-800 dark:text-zinc-200 mt-0.5 tabular-nums">
                    {formatearHora(metricas.inicio)}
                  </p>
                </div>

                <div className="bg-zinc-50/70 dark:bg-zinc-800/40 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/60">
                  <p className="text-2xs text-zinc-400 dark:text-zinc-500 font-medium">Hora Fin</p>
                  <p className="font-mono font-bold text-zinc-800 dark:text-zinc-200 mt-0.5 tabular-nums">
                    {formatearHora(metricas.fin)}
                  </p>
                </div>

                <div className="bg-zinc-50/70 dark:bg-zinc-800/40 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/60">
                  <p className="text-2xs text-zinc-400 dark:text-zinc-500 font-medium">Duración Activa</p>
                  <p className="font-mono font-bold text-zinc-800 dark:text-zinc-200 mt-0.5 tabular-nums">
                    {formatearDuracion(metricas.duracionMinutos)}
                  </p>
                </div>

                <div className="bg-zinc-50/70 dark:bg-zinc-800/40 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/60">
                  <p className="text-2xs text-zinc-400 dark:text-zinc-500 font-medium">Distancia Total</p>
                  <p className="font-mono font-bold text-zinc-800 dark:text-zinc-200 mt-0.5 tabular-nums">
                    {metricas.distanciaKm.toFixed(1)} km
                  </p>
                </div>

                <div className="bg-emerald-500/5 dark:bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                  <p className="text-2xs text-emerald-600 dark:text-emerald-400 font-medium">Min. en Sector</p>
                  <p className="font-mono font-bold text-emerald-700 dark:text-emerald-300 mt-0.5 tabular-nums">
                    {metricas.minutosDentro !== null ? `${metricas.minutosDentro} min` : '—'}
                  </p>
                </div>

                <div className="bg-rose-500/5 dark:bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                  <p className="text-2xs text-rose-600 dark:text-rose-400 font-medium">Min. Fuera</p>
                  <p className="font-mono font-bold text-rose-700 dark:text-rose-300 mt-0.5 tabular-nums">
                    {metricas.minutosFuera !== null ? `${metricas.minutosFuera} min` : '—'}
                  </p>
                </div>

                <div className="bg-blue-500/5 dark:bg-blue-500/10 p-2.5 rounded-xl border border-blue-500/20">
                  <p className="text-2xs text-blue-600 dark:text-blue-400 font-medium">% Permanencia</p>
                  <p className="font-mono font-bold text-[#155BD0] dark:text-blue-300 mt-0.5 tabular-nums">
                    {sectorInfo.sectorNombre ? formatearPorcentaje(metricas.pctDentro) : '100%'}
                  </p>
                </div>

                <div className="bg-amber-500/5 dark:bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                  <p className="text-2xs text-amber-600 dark:text-amber-400 font-medium">Tiempo Detenido</p>
                  <p className="font-mono font-bold text-amber-700 dark:text-amber-300 mt-0.5 tabular-nums">
                    {formatearDuracion(metricas.minutosDetenido)}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-2xs font-mono text-zinc-400 dark:text-zinc-500 flex items-center justify-between">
              <span>Puntos GPS auditados:</span>
              <span className="font-bold tabular-nums">{puntos.length} puntos</span>
            </div>
          </div>
        </div>

        {/* Control de Reproducción */}
        <div>
          <ReproductorRuta puntos={puntos} onPosicionCambio={onPosicionCambio} />
        </div>
      </div>
    </div>
  );
};

export default DetalleRecorridoPage;
