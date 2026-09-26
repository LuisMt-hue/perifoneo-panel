/**
 * Calcula el centroide de un polígono GeoJSON para posicionar la insignia de la zona.
 */
export function calcularCentroideGeocerca(coords: any): [number, number] | null {
  if (!Array.isArray(coords) || coords.length === 0) return null;
  let sumLat = 0;
  let sumLon = 0;
  let count = 0;
  for (const pt of coords) {
    if (Array.isArray(pt) && pt.length >= 2) {
      sumLon += pt[0]; // [lon, lat]
      sumLat += pt[1];
      count++;
    }
  }
  return count > 0 ? [sumLat / count, sumLon / count] : null;
}

/**
 * Configuración visual de la etiqueta de zona según el nivel de zoom:
 * - Zoom < 13: Oculto completamente (-zoom) para no saturar la vista distrital.
 * - Zoom 13: Sutil, menor tamaño y opacidad suave.
 * - Zoom >= 14: Más visible y legible (+zoom).
 * - Zoom >= 16: Grande, prominente y nítido.
 */
export function obtenerEstiloEtiquetaZona(zoom: number) {
  if (zoom >= 16) {
    return {
      fontSize: '16px',
      opacity: 1,
      letterSpacing: '0.08em',
      size: [80, 26] as [number, number],
      anchor: [40, 13] as [number, number],
    };
  }
  if (zoom >= 14) {
    return {
      fontSize: '13px',
      opacity: 0.95,
      letterSpacing: '0.05em',
      size: [60, 20] as [number, number],
      anchor: [30, 10] as [number, number],
    };
  }
  // Zoom 13 (sutil cuando se empieza a alejar)
  return {
    fontSize: '11px',
    opacity: 0.65,
    letterSpacing: '0.03em',
    size: [50, 18] as [number, number],
    anchor: [25, 9] as [number, number],
  };
}
