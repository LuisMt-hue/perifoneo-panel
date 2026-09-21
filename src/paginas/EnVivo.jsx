import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { obtenerEnVivo, obtenerSectores } from '../api/endpoints';
import MapaBase from '../componentes/MapaBase';
import CapaSectores from '../componentes/CapaSectores';
import { MapContainer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Battery, Clock, Navigation } from 'lucide-react';
import { formatearFechaHora, formatearDuracionDesde } from '../utilidades/formato';

const FlyToMarker = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 16);
    }
  }, [position, map]);
  return null;
};

const getIcon = (estado) => {
  let color = 'bg-gray-500';
  if (estado === 'ACTIVO') color = 'bg-green-500';
  if (estado === 'DEMORADO') color = 'bg-yellow-500';
  if (estado === 'SIN_SENAL') color = 'bg-red-500';

  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="w-4 h-4 rounded-full border-2 border-white shadow-md ${color}"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

export default function EnVivo() {
  const [sectorFilter, setSectorFilter] = useState('');
  const [selectedPosition, setSelectedPosition] = useState(null);

  const { data: sectores = [] } = useQuery({
    queryKey: ['sectores'],
    queryFn: obtenerSectores
  });

  const { data: enVivo = [] } = useQuery({
    queryKey: ['envivo'],
    queryFn: obtenerEnVivo,
    refetchInterval: 30000,
    refetchIntervalInBackground: false
  });

  const filteredData = enVivo.filter(d => !sectorFilter || d.sector_id === parseInt(sectorFilter, 10));

  const sortedData = [...filteredData].sort((a, b) => {
    const order = { 'SIN_SENAL': 1, 'DEMORADO': 2, 'ACTIVO': 3 };
    return (order[a.estado] || 4) - (order[b.estado] || 4);
  });

  const activos = enVivo.filter(d => d.estado === 'ACTIVO').length;
  const demorados = enVivo.filter(d => d.estado === 'DEMORADO').length;
  const sinSenal = enVivo.filter(d => d.estado === 'SIN_SENAL').length;

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <div className="w-80 bg-white shadow-md flex flex-col z-10">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold mb-2">Estado en Vivo</h2>
          <div className="text-sm text-gray-600 mb-4">
            <span className="text-green-600 font-bold">{activos} activos</span> ·{' '}
            <span className="text-yellow-600 font-bold">{demorados} demorados</span> ·{' '}
            <span className="text-red-600 font-bold">{sinSenal} sin señal</span>
          </div>
          <select
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={sectorFilter}
            onChange={e => setSectorFilter(e.target.value)}
          >
            <option value="">Todos los sectores</option>
            {sectores.map(s => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 overflow-y-auto">
          {sortedData.map(d => (
            <div
              key={d.id}
              onClick={() => setSelectedPosition([d.latitud, d.longitud])}
              className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-900 truncate">{d.nombre}</span>
                <span className={`w-3 h-3 rounded-full ${d.estado === 'ACTIVO' ? 'bg-green-500' : d.estado === 'DEMORADO' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
              </div>
              <div className="text-sm text-gray-500">{d.sector_nombre || 'Sin sector'}</div>
              <div className="flex items-center text-xs text-gray-400 mt-2 space-x-3">
                <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {formatearDuracionDesde(d.ultimo_reporte)}</span>
                <span className="flex items-center"><Navigation className="w-3 h-3 mr-1" /> {Math.round(d.velocidad)} km/h</span>
                <span className="flex items-center"><Battery className="w-3 h-3 mr-1" /> {d.bateria}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1">
        <MapaBase center={[-18.0146, -70.2536]} zoom={13}>
          <CapaSectores />
          {filteredData.map(d => (
            <Marker key={d.id} position={[d.latitud, d.longitud]} icon={getIcon(d.estado)}>
              <Popup>
                <div className="p-1">
                  <h3 className="font-bold">{d.nombre}</h3>
                  <div className="text-sm">
                    <p>DNI: {d.dni}</p>
                    <p>Tel: <a href={`tel:${d.telefono}`} className="text-blue-600">{d.telefono}</a></p>
                    <p>Sector: {d.sector_nombre || 'Ninguno'}</p>
                    <p>Último: {formatearFechaHora(d.ultimo_reporte)}</p>
                    <p>Velocidad: {Math.round(d.velocidad)} km/h</p>
                    <p>Batería: {d.bateria}%</p>
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
}
