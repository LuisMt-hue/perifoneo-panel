import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { obtenerRuta, obtenerSesiones } from '../api/endpoints';
import MapaBase from '../componentes/MapaBase';
import CapaSectores from '../componentes/CapaSectores';
import RutaBicolor from '../componentes/RutaBicolor';
import Reproductor from '../componentes/Reproductor';
import { formatearFecha, formatearHora, formatearDuracion, formatPorcentaje } from '../utilidades/formato';
import { exportarGPX } from '../utilidades/gpx';
import { ArrowLeft, ChevronLeft, ChevronRight, Download, Printer } from 'lucide-react';

export default function DetalleRecorrido() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: recorrido, isLoading } = useQuery({
    queryKey: ['recorrido', id],
    queryFn: () => obtenerRuta(id)
  });

  const { data: sesionesDelDia = [] } = useQuery({
    queryKey: ['sesionesDia', recorrido?.dispositivo_id, recorrido?.fecha],
    queryFn: () => obtenerSesiones({ 
      dispositivo_id: recorrido.dispositivo_id, 
      inicio: recorrido.fecha, 
      fin: recorrido.fecha 
    }),
    enabled: !!recorrido
  });

  if (isLoading || !recorrido) return <div className="p-8">Cargando...</div>;

  const currentIndex = sesionesDelDia.findIndex(s => s.id === parseInt(id, 10));
  const prevId = currentIndex > 0 ? sesionesDelDia[currentIndex - 1].id : null;
  const nextId = currentIndex < sesionesDelDia.length - 1 && currentIndex !== -1 ? sesionesDelDia[currentIndex + 1].id : null;

  return (
    <div className="p-6 h-[calc(100vh-64px)] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/historial')} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{recorrido.perifoneador_nombre}</h1>
            <p className="text-gray-600">Sector: {recorrido.sector_nombre} | {formatearFecha(recorrido.fecha)}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <button 
              disabled={!prevId} 
              onClick={() => navigate(`/recorrido/${prevId}`)}
              className="p-1 rounded hover:bg-gray-200 disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span>Recorrido {currentIndex + 1} de {sesionesDelDia.length || 1}</span>
            <button 
              disabled={!nextId} 
              onClick={() => navigate(`/recorrido/${nextId}`)}
              className="p-1 rounded hover:bg-gray-200 disabled:opacity-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button onClick={() => exportarGPX(recorrido.ruta, recorrido.perifoneador_nombre)} className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
            <Download className="w-4 h-4 mr-2" /> GPX
          </button>
          <button onClick={() => window.print()} className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
            <Printer className="w-4 h-4 mr-2" /> Imprimir
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        <div className="flex-1 bg-gray-200 rounded-lg overflow-hidden relative">
          <MapaBase center={[-18.0146, -70.2536]} zoom={13}>
            <CapaSectores />
            {recorrido.ruta && <RutaBicolor puntos={recorrido.ruta} />}
            <Reproductor ruta={recorrido.ruta} />
          </MapaBase>
        </div>
        <div className="w-80 bg-white rounded-lg shadow p-4 flex flex-col">
          <h2 className="text-lg font-bold mb-4">Métricas</h2>
          <div className="space-y-4 flex-1">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-gray-500">Inicio</p><p className="font-medium">{formatearHora(recorrido.hora_inicio)}</p></div>
              <div><p className="text-sm text-gray-500">Fin</p><p className="font-medium">{recorrido.hora_fin ? formatearHora(recorrido.hora_fin) : 'En curso'}</p></div>
              <div><p className="text-sm text-gray-500">Duración</p><p className="font-medium">{formatearDuracion(recorrido.duracion_minutos)}</p></div>
              <div><p className="text-sm text-gray-500">Distancia</p><p className="font-medium">{Number(recorrido.distancia_km || 0).toFixed(2)} km</p></div>
              <div><p className="text-sm text-gray-500">Min. Dentro</p><p className="font-medium text-green-600">{formatearDuracion(recorrido.minutos_dentro)}</p></div>
              <div><p className="text-sm text-gray-500">Min. Fuera</p><p className="font-medium text-red-600">{formatearDuracion(recorrido.minutos_fuera)}</p></div>
              <div><p className="text-sm text-gray-500">% Dentro</p><p className="font-medium">{formatPorcentaje(recorrido.porcentaje_dentro)}</p></div>
              <div><p className="text-sm text-gray-500">Detenido</p><p className="font-medium text-yellow-600">{formatearDuracion(recorrido.minutos_detenido)}</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
