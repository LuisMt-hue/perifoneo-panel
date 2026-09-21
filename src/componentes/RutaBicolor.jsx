import { Polyline, CircleMarker, Popup } from 'react-leaflet';
import { formatearHora } from '../utilidades/formato.js';

function agruparTramos(puntos) {
  const tramos = [];
  let actual = null;
  if (!puntos || puntos.length === 0) return tramos;
  
  if (puntos.length === 1) {
    tramos.push({
      dentro: puntos[0].dentro_sector === 1,
      coords: [[puntos[0].lat, puntos[0].lon]]
    });
    return tramos;
  }

  for (let i = 1; i < puntos.length; i++) {
    const a = puntos[i - 1], b = puntos[i];
    const dentro = a.dentro_sector === 1 && b.dentro_sector === 1;
    if (!actual || actual.dentro !== dentro) {
      actual = { dentro, coords: [[a.lat, a.lon]] };
      tramos.push(actual);
    }
    actual.coords.push([b.lat, b.lon]);
  }
  return tramos;
}

export default function RutaBicolor({ puntos = [] }) {
  if (!puntos || puntos.length === 0) return null;
  
  const tramos = agruparTramos(puntos);
  const inicio = puntos[0];
  const fin = puntos[puntos.length - 1];

  return (
    <>
      {tramos.map((tramo, i) => (
        <Polyline
          key={i}
          positions={tramo.coords}
          color={tramo.dentro ? '#22c55e' : '#ef4444'}
          weight={4}
        />
      ))}
      
      {/* Marcador Inicio (Verde) */}
      <CircleMarker 
        center={[inicio.lat, inicio.lon]} 
        radius={6} 
        pathOptions={{ color: 'white', fillColor: '#22c55e', fillOpacity: 1, weight: 2 }}
      >
        <Popup>Inicio: {formatearHora(inicio.device_time)}</Popup>
      </CircleMarker>
      
      {/* Marcador Fin (Rojo) */}
      <CircleMarker 
        center={[fin.lat, fin.lon]} 
        radius={6} 
        pathOptions={{ color: 'white', fillColor: '#ef4444', fillOpacity: 1, weight: 2 }}
      >
        <Popup>Fin: {formatearHora(fin.device_time)}</Popup>
      </CircleMarker>
    </>
  );
}
