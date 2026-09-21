import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { obtenerRuta, obtenerSesiones } from '../api/endpoints';
import MapaBase from '../componentes/MapaBase';
import CapaSectores from '../componentes/CapaSectores';
import RutaBicolor from '../componentes/RutaBicolor';
import Reproductor from '../componentes/Reproductor';
import { Marker, Popup } from 'react-leaflet';
import { formatearFecha, formatearHora, formatearDuracion, formatearPorcentaje } from '../utilidades/formato';
import { exportarGPX } from '../utilidades/gpx';
import { ArrowLeft, ChevronLeft, ChevronRight, Download, Printer } from 'lucide-react';

export default function DetalleRecorrido() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [posicionActual, setPosicionActual] = useState(null);
  const onPosicionCambio = useCallback((p) => setPosicionActual(p), []);

  const { data: recorridoRaw, isLoading } = useQuery({
    queryKey: ['recorrido', id],
    queryFn: () => obtenerRuta(id)
  });

  // API §2.6: { sesion: {...}, puntos: [...] }
  const sesion = recorridoRaw?.sesion || recorridoRaw || null;
  const puntos = recorridoRaw?.puntos || recorridoRaw?.ruta || [];

  const fecha = sesion?.fecha;
  const dispositivoId = sesion?.dispositivo_id;

  const { data: sesionesDelDiaRaw = [] } = useQuery({
    queryKey: ['sesionesDia', dispositivoId, fecha],
    queryFn: () => obtenerSesiones({ dispositivo: dispositivoId, desde: fecha, hasta: fecha }),
    enabled: !!dispositivoId && !!fecha
  });
  const sesionesDelDia = Array.isArray(sesionesDelDiaRaw) ? sesionesDelDiaRaw : [];

  if (isLoading || !sesion) return <div className="p-8">Cargando...</div>;

  const currentIndex = sesionesDelDia.findIndex(s => String(s.id) === String(id));
  const prevId = currentIndex > 0 ? sesionesDelDia[currentIndex - 1].id : null;
  const nextId = currentIndex >= 0 && currentIndex < sesionesDelDia.length - 1 ? sesionesDelDia[currentIndex + 1].id : null;

  const nombre = sesion.perifoneador || sesion.perifoneador_nombre || '-';
  const sectorNombre = sesion.sector || sesion.sector_nombre || '-';
  const inicio = sesion.inicio_at || sesion.hora_inicio;
  const fin = sesion.fin_at || sesion.hora_fin;

  return (
    <div className="p-6 h-[calc(100vh-64px)] flex flex-col overflow-auto">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/historial')} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{nombre}</h1>
            <p className="text-gray-600">Sector: {sectorNombre} | {formatearFecha(sesion.fecha || inicio)}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4 flex-wrap">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <button
              disabled={!prevId}
              onClick={() => navigate(`/recorrido/${prevId}`)}
              className="p-1 rounded hover:bg-gray-200 disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span>Recorrido {currentIndex >= 0 ? currentIndex + 1 : 1} de {sesionesDelDia.length || 1}</span>
            <button
              disabled={!nextId}
              onClick={() => navigate(`/recorrido/${nextId}`)}
              className="p-1 rounded hover:bg-gray-200 disabled:opacity-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button onClick={() => exportarGPX(puntos, nombre)} className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
            <Download className="w-4 h-4 mr-2" /> GPX
          </button>
          <button onClick={() => window.print()} className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
            <Printer className="w-4 h-4 mr-2" /> Imprimir
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0 flex-col lg:flex-row">
        <div className="flex-1 bg-gray-200 rounded-lg overflow-hidden relative min-h-[400px]">
          <MapaBase center={puntos.length ? [puntos[0].lat, puntos[0].lon] : [-18.0146, -70.2536]} zoom={14}>
            {sesion.sector_geojson && <CapaSectores sectores={[{ id: 's', nombre: sectorNombre, geojson: sesion.sector_geojson, color: sesion.sector_color }]} />}
            {puntos.length > 0 && <RutaBicolor puntos={puntos} />}
            {posicionActual && posicionActual.lat != null && (
              <Marker position={[posicionActual.lat, posicionActual.lon]}>
                <Popup>{formatearHora(posicionActual.device_time)} · {posicionActual.velocidad_kmh || 0} km/h</Popup>
              </Marker>
            )}
          </MapaBase>
        </div>
        <div className="w-full lg:w-80 bg-white rounded-lg shadow p-4 flex flex-col">
          <h2 className="text-lg font-bold mb-4">Métricas</h2>
          <div className="space-y-4 flex-1">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-gray-500">Inicio</p><p className="font-medium">{formatearHora(inicio)}</p></div>
              <div><p className="text-sm text-gray-500">Fin</p><p className="font-medium">{fin ? formatearHora(fin) : 'En curso'}</p></div>
              <div><p className="text-sm text-gray-500">Duración</p><p className="font-medium">{formatearDuracion(sesion.minutos_totales ?? sesion.duracion_minutos)}</p></div>
              <div><p className="text-sm text-gray-500">Distancia</p><p className="font-medium">{Number(sesion.km_totales ?? sesion.distancia_km ?? 0).toFixed(1)} km</p></div>
              <div><p className="text-sm text-gray-500">Min. Dentro</p><p className="font-medium text-green-600">{formatearDuracion(sesion.minutos_dentro)}</p></div>
              <div><p className="text-sm text-gray-500">Min. Fuera</p><p className="font-medium text-red-600">{formatearDuracion(sesion.minutos_fuera)}</p></div>
              <div><p className="text-sm text-gray-500">% Dentro</p><p className="font-medium">{formatearPorcentaje(sesion.pct_dentro ?? sesion.porcentaje_dentro)}</p></div>
              <div><p className="text-sm text-gray-500">Detenido</p><p className="font-medium text-yellow-600">{formatearDuracion(sesion.minutos_detenido)}</p></div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <Reproductor puntos={puntos} onPosicionCambio={onPosicionCambio} />
      </div>
    </div>
  );
}
