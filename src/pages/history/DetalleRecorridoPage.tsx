import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Marker, Popup } from 'react-leaflet';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  Compass,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { obtenerRuta, obtenerSesiones } from '../../services/api/endpoints';
import MapaBase, { CENTRO_TACNA } from '../../components/map/MapaBase';
import CapaSectores from '../../components/map/CapaSectores';
import RutaBicolor from '../../components/map/RutaBicolor';
import ReproductorRuta from '../../components/map/ReproductorRuta';
import {
  formatearFecha,
  formatearHora,
  formatearDuracion,
  formatearPorcentaje,
} from '../../utils/formato';
import { exportarGPX } from '../../utils/gpx';
import type {
  PuntoRecorrido,
  SesionRecorrido,
  Sector,
} from '../../types/perifoneo.types';
import type { DetalleRecorridoRespuesta } from '../../types/api.types';

/**
 * Página de Detalle de Recorrido estilo macOS (`DetalleRecorridoPage`).
 *
 * Muestra el recorrido GPS trazado con capa bicolor (verde/rojo),
 * panel de métricas estilo Inspector de macOS y reproductor temporal.
 */
export const DetalleRecorridoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [posicionActual, setPosicionActual] = useState<PuntoRecorrido | null>(null);
  const onPosicionCambio = useCallback((p: PuntoRecorrido) => setPosicionActual(p), []);

  // Consulta de la ruta completa del recorrido
  const { data: recorridoRaw, isLoading } = useQuery<DetalleRecorridoRespuesta>({
    queryKey: ['recorrido', id],
    queryFn: () => obtenerRuta(id as string),
    enabled: Boolean(id),
  });

  const sesion: SesionRecorrido | null = recorridoRaw?.sesion || null;
  const puntos: PuntoRecorrido[] = recorridoRaw?.puntos || [];

  const fecha = sesion?.fecha;
  const dispositivoId = sesion?.dispositivo_id;

  // Consulta de todos los recorridos del mismo perifoneador en la misma fecha (Navegación RF-27)
  const { data: sesionesDelDiaRaw = [] } = useQuery<SesionRecorrido[]>({
    queryKey: ['sesionesDia', dispositivoId, fecha],
    queryFn: () =>
      obtenerSesiones({
        dispositivo: dispositivoId,
        desde: fecha,
        hasta: fecha,
      }),
    enabled: Boolean(dispositivoId && fecha),
  });

  const sesionesDelDia = Array.isArray(sesionesDelDiaRaw) ? sesionesDelDiaRaw : [];

  if (isLoading || !sesion) {
    return (
      <div className="flex flex-col justify-center items-center h-full p-8 text-zinc-500 dark:text-zinc-400 gap-3">
        <Loader2 size={32} className="animate-spin text-blue-600 dark:text-blue-400" />
        <span className="text-xs font-medium">Cargando telemetría del recorrido...</span>
      </div>
    );
  }

  // Índices para navegación entre recorridos del día
  const currentIndex = sesionesDelDia.findIndex((s) => String(s.id) === String(id));
  const prevId = currentIndex > 0 ? sesionesDelDia[currentIndex - 1].id : null;
  const nextId =
    currentIndex >= 0 && currentIndex < sesionesDelDia.length - 1
      ? sesionesDelDia[currentIndex + 1].id
      : null;

  const nombrePerifoneador =
    sesion.perifoneador || sesion.perifoneador_nombre || 'Perifoneador';
  const sectorNombre = sesion.sector || sesion.sector_nombre || 'Sector';
  const inicio = sesion.inicio_at || sesion.hora_inicio;
  const fin = sesion.fin_at || sesion.hora_fin;

  // Preparar sector para la capa de fondo
  const sectoresFondo: Sector[] = sesion.sector_geojson
    ? [
        {
          id: sesion.sector_id || 1,
          nombre: sectorNombre,
          geojson: sesion.sector_geojson,
          color: sesion.sector_color || '#2563eb',
        },
      ]
    : [];

  const centroMapa: [number, number] =
    puntos.length > 0 ? [puntos[0].lat, puntos[0].lon] : CENTRO_TACNA;

  const pctDentro = sesion.pct_dentro ?? sesion.porcentaje_dentro ?? 0;

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col overflow-y-auto bg-zinc-100/60 dark:bg-zinc-950/60 transition-colors">
      {/* Barra Superior con Navegación y Acciones */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/historial')}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white dark:hover:bg-zinc-800 transition-all cursor-pointer shadow-2xs"
            title="Regresar al historial"
          >
            <ArrowLeft size={16} />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
                <Compass size={18} className="text-blue-600 dark:text-blue-400" />
                {nombrePerifoneador}
              </h1>
            </div>
            <p className="text-2xs text-zinc-500 dark:text-zinc-400">
              Sector: <strong className="text-zinc-700 dark:text-zinc-300">{sectorNombre}</strong> | Fecha:{' '}
              <strong className="text-zinc-700 dark:text-zinc-300 font-mono">
                {formatearFecha(sesion.fecha || inicio)}
              </strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Navegación entre recorridos del mismo día (RF-27) */}
          <div className="flex items-center gap-1 bg-white/80 dark:bg-zinc-900/80 px-2 py-1 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs text-xs text-zinc-600 dark:text-zinc-400">
            <button
              type="button"
              disabled={!prevId}
              onClick={() => navigate(`/recorrido/${prevId}`)}
              className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer transition-colors"
              title="Recorrido anterior"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="text-2xs font-mono font-semibold px-1">
              {currentIndex >= 0 ? currentIndex + 1 : 1} / {sesionesDelDia.length || 1}
            </span>
            <button
              type="button"
              disabled={!nextId}
              onClick={() => navigate(`/recorrido/${nextId}`)}
              className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer transition-colors"
              title="Siguiente recorrido"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Exportar a GPX */}
          <button
            type="button"
            onClick={() => exportarGPX(puntos, nombrePerifoneador)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 dark:bg-zinc-900/80 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-800 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <Download size={13} />
            <span>Descargar GPX</span>
          </button>

          {/* Imprimir Informe */}
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 dark:bg-zinc-900/80 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-800 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer no-print"
          >
            <Printer size={13} />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Área Central: Mapa y Panel Inspector */}
      <div className="flex-1 flex gap-4 min-h-[420px] flex-col lg:flex-row mb-4">
        {/* Contenedor del Mapa */}
        <div className="flex-1 rounded-2xl overflow-hidden relative shadow-md border border-zinc-200/80 dark:border-zinc-800 min-h-[350px]">
          <MapaBase centro={centroMapa} zoom={14}>
            {sectoresFondo.length > 0 && <CapaSectores sectores={sectoresFondo} />}
            {puntos.length > 0 && <RutaBicolor puntos={puntos} />}

            {/* Marcador de Telemetría Dinámica en Reproducción */}
            {posicionActual && posicionActual.lat != null && (
              <Marker position={[posicionActual.lat, posicionActual.lon]}>
                <Popup>
                  <div className="text-xs text-zinc-800 dark:text-zinc-200 space-y-1">
                    <p className="font-bold border-b border-zinc-200 dark:border-zinc-700 pb-1">
                      Telemetría en ese instante
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

        {/* Panel Inspector de Métricas macOS */}
        <div className="w-full lg:w-80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl shadow-xs border border-zinc-200/80 dark:border-zinc-800 p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2.5 mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-blue-600 dark:text-blue-400" />
                <span>Métricas de Sesión</span>
              </h2>
              <span
                className={`px-2 py-0.5 rounded-full text-3xs font-bold uppercase tracking-wider ${
                  pctDentro >= 80
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                }`}
              >
                {pctDentro >= 80 ? 'Cumplido' : 'Observado'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-zinc-50/70 dark:bg-zinc-800/40 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/60">
                <p className="text-2xs text-zinc-400 dark:text-zinc-500 font-medium">Hora Inicio</p>
                <p className="font-mono font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
                  {formatearHora(inicio)}
                </p>
              </div>

              <div className="bg-zinc-50/70 dark:bg-zinc-800/40 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/60">
                <p className="text-2xs text-zinc-400 dark:text-zinc-500 font-medium">Hora Fin</p>
                <p className="font-mono font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
                  {fin ? formatearHora(fin) : 'En curso'}
                </p>
              </div>

              <div className="bg-zinc-50/70 dark:bg-zinc-800/40 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/60">
                <p className="text-2xs text-zinc-400 dark:text-zinc-500 font-medium">Duración Total</p>
                <p className="font-mono font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
                  {formatearDuracion(sesion.minutos_totales ?? sesion.duracion_minutos)}
                </p>
              </div>

              <div className="bg-zinc-50/70 dark:bg-zinc-800/40 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/60">
                <p className="text-2xs text-zinc-400 dark:text-zinc-500 font-medium">Distancia Total</p>
                <p className="font-mono font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
                  {Number(sesion.km_totales ?? sesion.distancia_km ?? 0).toFixed(1)} km
                </p>
              </div>

              <div className="bg-emerald-500/5 dark:bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                <p className="text-2xs text-emerald-600 dark:text-emerald-400 font-medium">Min. en Sector</p>
                <p className="font-mono font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
                  {formatearDuracion(sesion.minutos_dentro)}
                </p>
              </div>

              <div className="bg-rose-500/5 dark:bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                <p className="text-2xs text-rose-600 dark:text-rose-400 font-medium">Min. Fuera</p>
                <p className="font-mono font-bold text-rose-700 dark:text-rose-300 mt-0.5">
                  {formatearDuracion(sesion.minutos_fuera)}
                </p>
              </div>

              <div className="bg-blue-500/5 dark:bg-blue-500/10 p-2.5 rounded-xl border border-blue-500/20">
                <p className="text-2xs text-blue-600 dark:text-blue-400 font-medium">% Permanencia</p>
                <p className="font-mono font-bold text-blue-700 dark:text-blue-300 mt-0.5">
                  {formatearPorcentaje(pctDentro)}
                </p>
              </div>

              <div className="bg-amber-500/5 dark:bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                <p className="text-2xs text-amber-600 dark:text-amber-400 font-medium">Tiempo Detenido</p>
                <p className="font-mono font-bold text-amber-700 dark:text-amber-300 mt-0.5">
                  {formatearDuracion(sesion.minutos_detenido)}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-2xs font-mono text-zinc-400 dark:text-zinc-500 flex items-center justify-between">
            <span>Puntos GPS:</span>
            <span className="font-bold">{puntos.length} puntos</span>
          </div>
        </div>
      </div>

      {/* Control de Reproducción */}
      <div>
        <ReproductorRuta puntos={puntos} onPosicionCambio={onPosicionCambio} />
      </div>
    </div>
  );
};

export default DetalleRecorridoPage;
