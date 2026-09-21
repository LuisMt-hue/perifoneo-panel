export function generarGPX(puntos, nombre) {
  let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="PerifoneoPanel" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>${nombre}</name>
    <trkseg>\n`;

  puntos.forEach(p => {
    gpx += `      <trkpt lat="${p.lat}" lon="${p.lon}">
        <ele>0</ele>
        <time>${p.device_time}</time>
        ${p.velocidad_kmh !== undefined ? `<desc>Velocidad: ${p.velocidad_kmh} km/h, Batería: ${p.bateria_pct}%</desc>` : ''}
      </trkpt>\n`;
  });

  gpx += `    </trkseg>
  </trk>
</gpx>`;

  return gpx;
}

export function descargarGPX(puntos, nombre) {
  const gpx = generarGPX(puntos, nombre);
  const blob = new Blob([gpx], { type: 'application/gpx+xml' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${nombre.replace(/\\s+/g, '_')}.gpx`;
  document.body.appendChild(a);
  a.click();
  
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const exportarGPX = descargarGPX;
