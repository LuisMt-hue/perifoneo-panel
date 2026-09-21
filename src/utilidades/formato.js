import { formatInTimeZone } from 'date-fns-tz';
import { parseISO } from 'date-fns';

export const ZONA_LIMA = 'America/Lima';

export function formatearHora(fechaISO) {
  if (!fechaISO) return '-';
  return formatInTimeZone(fechaISO, ZONA_LIMA, 'HH:mm');
}

export function formatearFecha(fechaISO) {
  if (!fechaISO) return '-';
  return formatInTimeZone(fechaISO, ZONA_LIMA, 'dd/MM/yyyy');
}

export function formatearFechaHora(fechaISO) {
  if (!fechaISO) return '-';
  return formatInTimeZone(fechaISO, ZONA_LIMA, 'dd/MM/yyyy HH:mm');
}

export function formatearDuracion(minutos) {
  if (minutos === undefined || minutos === null) return '-';
  const h = Math.floor(minutos / 60);
  const m = Math.floor(minutos % 60);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

export function formatearKm(km) {
  if (km === undefined || km === null) return '-';
  return `${Number(km).toFixed(1)} km`;
}

export function formatearVelocidad(vel) {
  if (vel === undefined || vel === null) return '-';
  return `${Math.round(vel)} km/h`;
}

export function formatearPorcentaje(pct) {
  if (pct === undefined || pct === null) return '-';
  return `${Math.round(pct)}%`;
}

export function fechaParaApi(date) {
  if (!date) return '';
  return formatInTimeZone(date, ZONA_LIMA, 'yyyy-MM-dd');
}

export function hoy() {
  return formatInTimeZone(new Date(), ZONA_LIMA, 'yyyy-MM-dd');
}
