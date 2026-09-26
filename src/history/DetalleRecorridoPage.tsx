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

  const { dispositivo, sectorInfo, sectoresFondo, trips, cargandoTrips, cargandoCatalogos } =
    useDetalleRecorridoBase(deviceId, desde, hasta);

  const { selectedTrip, selectedTripKey, selectTrip, puntos, cargandoRuta } = useViajeSeleccionado(
    deviceId,
    trips,
    sectorInfo.geofenceId
  );

  const handleSelectTrip = (trip: TraccarReportTrip) => {
    selectTrip(trip);
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
        <span className="text-xs font-medium">Cargando viajes desde Traccar...</span>
      </div>
    );
  }

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
              <h1 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
                <Compass size={18} className="text-[#155BD0] dark:text-blue-400" />
                <span>{nombreDispositivo}</span>
              </h1>
              <p className="text-2xs text-zinc-500 dark:text-zinc-400">
                Sector:{' '}
                <strong className="text-zinc-700 dark:text-zinc-300">
                  {sectorInfo.sectorNombre || 'Sin sector asignado'}
                </strong>{' '}
                | Rango:{' '}
                <strong className="text-zinc-700 dark:text-zinc-300 font-mono">{rangoLabel}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              disabled={puntos.length === 0}
              onClick={() => exportarGPX(puntos, `${nombreDispositivo}_${selectedTrip?.startTime || ''}`)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-[21px] text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              aria-label="Descargar recorrido en formato GPX"
            >
              <Download size={13} />
              <span>Descargar GPX</span>
            </button>

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

        {/* Resumen mínimo: tiempo total + km totales */}
        <div className="grid grid-cols-2 gap-4 sm:max-w-md">
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-[21px] border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium mb-1">
              <span>Tiempo total</span>
              <Clock size={14} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
              {formatearDuracion(resumenRango.minutosTotales)}
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-4 rounded-[21px] border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium mb-1">
              <span>Km totales</span>
              <Milestone size={14} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
              {resumenRango.distanciaKm.toFixed(1)} km
            </div>
          </div>
        </div>

        {/* Área Central: Sidebar de viajes + Mapa */}
        <div className="flex-1 flex gap-4 min-h-[420px] flex-col lg:flex-row">
          <ViajesSidebar
            trips={trips}
            selectedTripKey={selectedTripKey}
            onSelectTrip={handleSelectTrip}
            cargando={cargandoTrips}
          />

          <div className="flex-1 rounded-[21px] overflow-hidden relative shadow-xs border border-zinc-200/80 dark:border-zinc-800 min-h-[360px]">
            <RecorridoMap
              puntos={puntos}
              sectoresFondo={sectoresFondo}
              posicionActual={posicionActual}
              hayTripSeleccionado={Boolean(selectedTrip)}
              cargandoRuta={cargandoRuta}
            />
          </div>
        </div>

        {/* Reproductor: se reinicia (key) al cambiar de viaje */}
        {puntos.length > 0 && (
          <div>
            <ReproductorRuta key={selectedTripKey} puntos={puntos} onPosicionCambio={onPosicionCambio} />
          </div>
        )}
      </div>
    </div>
  );
};

export default DetalleRecorridoPage;
