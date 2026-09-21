import { formatInTimeZone } from 'date-fns-tz';

/**
 * Módulo de Formateo y Conversión de Tiempos y Métricas.
 *
 * Configurado específicamente para la zona horaria oficial del Perú (America/Lima, UTC-5).
 * Todas las horas enviadas por la API en UTC ('Z') se convierten adecuadamente aquí.
 */

export const ZONA_LIMA = 'America/Lima';

/**
 * Formatea una fecha ISO a hora local 'HH:mm'.
 */
export function formatearHora(fechaISO?: string | null): string {
  if (!fechaISO) return '-';
  try {
    return formatInTimeZone(fechaISO, ZONA_LIMA, 'HH:mm');
  } catch {
    return '-';
  }
}

/**
 * Formatea una fecha ISO a formato 'dd/MM/yyyy'.
 */
export function formatearFecha(fechaISO?: string | null): string {
  if (!fechaISO) return '-';
  try {
    return formatInTimeZone(fechaISO, ZONA_LIMA, 'dd/MM/yyyy');
  } catch {
    return '-';
  }
}

/**
 * Formatea una fecha ISO completa a 'dd/MM/yyyy HH:mm'.
 */
export function formatearFechaHora(fechaISO?: string | null): string {
  if (!fechaISO) return '-';
  try {
    return formatInTimeZone(fechaISO, ZONA_LIMA, 'dd/MM/yyyy HH:mm');
  } catch {
    return '-';
  }
}

/**
 * Convierte una cantidad de minutos a una cadena legible (ej. '2h 15min' o '45min').
 */
export function formatearDuracion(minutos?: number | null): string {
  if (minutos === undefined || minutos === null || Number.isNaN(minutos)) return '-';
  const mins = Math.max(0, Math.round(minutos));
  const h = Math.floor(mins / 60);
  const m = mins % 60;

  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

/**
 * Formatea una distancia en kilómetros con un decimal (ej. '12.4 km').
 */
export function formatearKm(km?: number | string | null): string {
  if (km === undefined || km === null || km === '') return '-';
  const num = typeof km === 'string' ? parseFloat(km) : km;
  if (Number.isNaN(num)) return '-';
  return `${num.toFixed(1)} km`;
}

/**
 * Formatea una velocidad en km/h redondeada a entero.
 */
export function formatearVelocidad(vel?: number | null): string {
  if (vel === undefined || vel === null || Number.isNaN(vel)) return '-';
  return `${Math.round(vel)} km/h`;
}

/**
 * Formatea un valor numérico a porcentaje con símbolo '%' (ej. '88%').
 */
export function formatearPorcentaje(pct?: number | null): string {
  if (pct === undefined || pct === null || Number.isNaN(pct)) return '-';
  return `${Math.round(pct)}%`;
}

/** Alias para compatibilidad */
export const formatPorcentaje = formatearPorcentaje;

/**
 * Convierte un objeto Date a formato estándar de API 'yyyy-MM-dd' en hora de Lima.
 */
export function fechaParaApi(date?: Date | null): string {
  if (!date) return '';
  return formatInTimeZone(date, ZONA_LIMA, 'yyyy-MM-dd');
}

/**
 * Retorna la fecha de hoy en formato 'yyyy-MM-dd' en la zona horaria de Tacna/Lima.
 */
export function hoy(): string {
  return formatInTimeZone(new Date(), ZONA_LIMA, 'yyyy-MM-dd');
}

/**
 * Calcula y expresa el tiempo transcurrido desde una fecha dada (ej. 'Hace 3 min', 'Ahora').
 */
export function formatearDuracionDesde(fechaISO?: string | null): string {
  if (!fechaISO) return '-';
  const diffMs = Date.now() - new Date(fechaISO).getTime();
  if (Number.isNaN(diffMs) || diffMs < 0) return 'Ahora';

  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'Ahora';
  if (min < 60) return `Hace ${min} min`;

  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `Hace ${h}h` : `Hace ${h}h ${m}min`;
}
