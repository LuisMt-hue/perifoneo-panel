import React, { useCallback, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Download, Printer, Compass, Clock, Milestone } from 'lucide-react';
import { obtenerDuracionSegundos } from './api';
import { useDetalleRecorridoBase } from './hooks/useDetalleRecorridoBase';
import { useViajeSeleccionado } from './hooks/useViajeSeleccionado';
import ViajesSidebar from './components/ViajesSidebar';
import RecorridoMap from './components/RecorridoMap';
import ReproductorRuta from '../shared/components/map/ReproductorRuta';
import { formatearFecha, formatearDuracion, hoy } from '../shared/utils/formato';
import { exportarGPX } from '../shared/utils/gpx';
import type { PuntoRecorrido } from '../shared/types/perifoneo.types';
import type { TraccarReportTrip } from './api';

/**
 * Detalle de Recorrido: sidebar con los viajes (trips) del rango seleccionado en la
 * tabla de Historial, mapa que dibuja el viaje elegido (con fitBounds automático),
 * resumen mínimo (tiempo total + km totales del rango) y el reproductor punto-a-punto,
 * que solo carga datos de Traccar cuando se elige un viaje concreto.
 *
 * Todo el contenido cabe en una sola pantalla (sin scroll de página): el `<main>` de
 * `MainLayout` ya está acotado a `100vh - header`, así que aquí se reparte ese alto
 * fijo con flexbox (`flex-1 min-h-0`) en vez de alturas mínimas forzadas. Solo la
 * lista de viajes del sidebar puede scrollear internamente si hay muchos.
 */
export const DetalleRecorridoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const fechaLegacy = queryParams.get('fecha');
  const desde = queryParams.get('desde') || fechaLegacy || hoy();
  const hasta = queryParams.get('hasta') || fechaLegacy || hoy();

  const deviceId = Number(id);

  const [posicionActual, setPosicionActual] = useState<PuntoRecorrido | null>(null);
  const onPosicionCambio = useCallback((p: PuntoRecorrido) => setPosicionActual(p), []);
  const [fitTrigger, setFitTrigger] = useState(0);
  const handleEncuadrar = useCallback(() => setFitTrigger(Date.now()), []);

  const { dispositivo, sectorInfo, sectoresFondo, trips, fromISO, toISO, cargandoTrips, cargandoCatalogos } =
    useDetalleRecorridoBase(deviceId, desde, hasta);

  const { selectedTrip, selectedTripKey, selectTrip, puntos, cargandoRuta } = useViajeSeleccionado(
    deviceId,
    trips,
    sectorInfo.geofenceId,
    fromISO,
    toISO
  );

  const handleSelectTrip = (trip: TraccarReportTrip) => {
    selectTrip(trip);
    setPosicionActual(null);
  };

  const handleClearSelection = () => {
    selectTrip(null);
    setPosicionActual(null);
  };

  // Resumen del rango completo: solo tiempo total y km totales (sobre todos los viajes)
  const resumenRango = useMemo(() => {
    const segundos = trips.reduce((acc, t) => acc + obtenerDuracionSegundos(t), 0);
    const distanciaKm = trips.reduce((acc, t) => acc + (t.distance || 0), 0) / 1000;
    return { minutosTotales: Math.round(segundos / 60), distanciaKm };
  }, [trips]);

  const nombreDispositivo = dispositivo?.name || `Dispositivo #${deviceId}`;
  const rangoLabel = desde === hasta ? formatearFecha(desde) : `${formatearFecha(desde)} – ${formatearFecha(hasta)}`;

  if (cargandoCatalogos || cargandoTrips) {
    return (
      <div className="flex flex-col justify-center items-center h-full p-8 text-zinc-500 dark:text-zinc-400 gap-3 bg-white dark:bg-zinc-950">
        <div className="w-8 h-8 border-2 border-[#155BD0] border-t-transparent rounded-full animate-spin" />
        <span className="text-[13px] font-medium">Cargando viajes desde Traccar...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white dark:bg-zinc-950 font-sans transition-colors p-3 sm:p-4">
      <div className="max-w-7xl mx-auto w-full flex flex-col flex-1 min-h-0 gap-3">
        {/* Barra superior compacta: identidad + resumen + acciones en una sola fila */}
        <div className="flex items-center gap-3 flex-wrap shrink-0">
          <button
            type="button"
            onClick={() => navigate('/historial')}
            className="size-8 rounded-xl flex items-center justify-center bg-zinc-800 hover:bg-zinc-900 active:bg-black text-white transition-all cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-zinc-500 shrink-0"
            title="Regresar al historial"
            aria-label="Regresar al historial de recorridos"
          >
            <ArrowLeft size={15} />
          </button>

          <div className="min-w-0">
            <h1 className="text-[14px] font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-1.5 truncate">
              <Compass size={15} className="text-[#155BD0] dark:text-blue-400 shrink-0" />
              <span className="truncate">{nombreDispositivo}</span>
            </h1>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
              {sectorInfo.sectorNombre || 'Sin sector asignado'} · <span className="font-mono">{rangoLabel}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <div className="flex items-center gap-1.5 px-2.5 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-200/70 dark:border-zinc-700/60">
              <Clock size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-[12px] font-mono font-semibold text-zinc-800 dark:text-zinc-200 tabular-nums">
                {formatearDuracion(resumenRango.minutosTotales)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-200/70 dark:border-zinc-700/60">
              <Milestone size={12} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="text-[12px] font-mono font-semibold text-zinc-800 dark:text-zinc-200 tabular-nums">
                {resumenRango.distanciaKm.toFixed(1)} km
              </span>
            </div>

            <button
              type="button"
              disabled={puntos.length === 0}
              onClick={() => exportarGPX(puntos, `${nombreDispositivo}_${selectedTrip?.startTime || ''}`)}
              className="flex items-center gap-1.5 px-3 h-8 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-[12px] font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              aria-label="Descargar recorrido en formato GPX"
            >
              <Download size={12} />
              <span className="hidden sm:inline">GPX</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 h-8 bg-zinc-800 hover:bg-zinc-900 active:bg-black text-white rounded-lg text-[12px] font-semibold shadow-xs transition-all cursor-pointer no-print focus:outline-none focus:ring-2 focus:ring-zinc-500"
              aria-label="Imprimir informe de recorrido"
            >
              <Printer size={12} />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
          </div>
        </div>

        {/* Área Central: Sidebar de viajes + Mapa — se reparten todo el alto restante */}
        <div className="flex-1 min-h-0 flex gap-3 flex-col lg:flex-row">
          <ViajesSidebar
            trips={trips}
            selectedTripKey={selectedTripKey}
            onSelectTrip={handleSelectTrip}
            onClearSelection={handleClearSelection}
            cargando={cargandoTrips}
          />

          <div className="flex-1 min-h-0 rounded-xl overflow-hidden relative shadow-xs border border-zinc-200/80 dark:border-zinc-800">
            <RecorridoMap
              puntos={puntos}
              sectoresFondo={sectoresFondo}
              posicionActual={posicionActual}
              cargandoRuta={cargandoRuta}
              fitTrigger={fitTrigger}
            />
          </div>
        </div>

        {/* Reproductor: se reinicia (key) al cambiar de viaje */}
        {puntos.length > 0 && (
          <div className="shrink-0">
            <ReproductorRuta
              key={selectedTripKey}
              puntos={puntos}
              onPosicionCambio={onPosicionCambio}
              onEncuadrar={handleEncuadrar}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DetalleRecorridoPage;
