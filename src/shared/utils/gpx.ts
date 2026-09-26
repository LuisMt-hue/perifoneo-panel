import type { PuntoRecorrido } from '../types/perifoneo.types';

/**
 * Módulo de Exportación a Formato GPX (GPS Exchange Format v1.1).
 *
 * Permite visualizar el recorrido grabado en aplicaciones GIS, Google Earth,
 * dispositivos Garmin o herramientas de auditoría externa.
 */

/**
 * Construye el documento XML en formato GPX v1.1 para los puntos GPS de un recorrido.
 */
export function generarGPX(puntos: PuntoRecorrido[], nombre: string): string {
  const nombreLimpio = (nombre || 'Recorrido')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="PerifoneoPanel" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>${nombreLimpio}</name>
    <trkseg>\n`;

  puntos.forEach((p) => {
    const velText = p.velocidad_kmh !== undefined ? `Velocidad: ${p.velocidad_kmh} km/h` : '';
    const batText = p.bateria_pct !== undefined ? `Batería: ${p.bateria_pct}%` : '';
    const sectorText = p.dentro_sector ? 'Dentro del sector' : 'Fuera del sector';
    const desc = [velText, batText, sectorText].filter(Boolean).join(', ');

    gpx += `      <trkpt lat="${p.lat}" lon="${p.lon}">
        <ele>0</ele>
        <time>${p.device_time}</time>
        ${desc ? `<desc>${desc}</desc>` : ''}
      </trkpt>\n`;
  });

  gpx += `    </trkseg>
  </trk>
</gpx>`;

  return gpx;
}

/**
 * Genera y descarga el archivo .gpx en el equipo del usuario.
 */
export function descargarGPX(puntos: PuntoRecorrido[], nombre: string): void {
  if (!puntos || puntos.length === 0) {
    alert('No hay puntos GPS para exportar en este recorrido.');
    return;
  }

  const gpx = generarGPX(puntos, nombre);
  const blob = new Blob([gpx], { type: 'application/gpx+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  const nombreArchivo = (nombre || 'recorrido').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
  a.download = `${nombreArchivo}.gpx`;
  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Alias de exportación */
export const exportarGPX = descargarGPX;
