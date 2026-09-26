import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import {
  formatearFecha,
  formatearHora,
  formatearDuracion,
} from './formato';

/**
 * Módulo de Generación de Informes Oficiales en PDF (jsPDF + AutoTable).
 *
 * Exporta el listado del Historial de Recorridos a un documento PDF formal.
 */

export interface HistorialPdfItem {
  dispositivoNombre: string;
  dni?: string;
  placa?: string;
  sectorAsignado?: string | null;
  inicio?: string | null;
  fin?: string | null;
  distanciaKm: number;
  velocidadMediaKmh?: number;
  velocidadMaximaKmh?: number;
  duracionMinutos?: number;
  tieneActividad: boolean;
}

export interface HistorialPdfMetadata {
  fechaInicio: string;
  fechaFin: string;
  sector?: string;
  dispositivo?: string;
}

/**
 * Exporta el listado consolidado del Historial de Recorridos a un documento PDF formal y estructurado.
 */
export function exportarHistorialPDF(
  items: HistorialPdfItem[],
  meta: HistorialPdfMetadata
): void {
  if (!items.length) {
    alert('No hay datos disponibles para exportar.');
    return;
  }

  // Orientación horizontal para tablas con múltiples columnas
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Encabezado institucional
  doc.setFontSize(16);
  doc.setTextColor(21, 91, 208); // Azul #155BD0
  doc.text('Reporte de Historial y Jornadas de Perifoneo', 14, 16);

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  const rangoTexto =
    meta.fechaInicio === meta.fechaFin
      ? `Fecha: ${formatearFecha(meta.fechaInicio)}`
      : `Periodo: ${formatearFecha(meta.fechaInicio)} al ${formatearFecha(meta.fechaFin)}`;
  doc.text(rangoTexto, 14, 22);

  const ahora = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' });
  doc.text(`Generado el: ${ahora}`, 200, 22);

  // Totales para métricas de resumen
  const totalRegistros = items.length;
  const activos = items.filter((i) => i.tieneActividad).length;
  const distanciaTotal = items.reduce((acc, i) => acc + (i.distanciaKm || 0), 0);
  const duracionTotalMin = items.reduce((acc, i) => acc + (i.duracionMinutos || 0), 0);
  const velMediaGlobal =
    activos > 0
      ? items.filter((i) => i.tieneActividad).reduce((acc, i) => acc + (i.velocidadMediaKmh || 0), 0) / activos
      : 0;

  // Tarjeta resumen rápida
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(14, 26, 269, 14, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);

  doc.text(`Total Unidades: ${totalRegistros} (${activos} con actividad)`, 18, 34);
  doc.text(`Distancia Acumulada: ${distanciaTotal.toFixed(1)} km`, 90, 34);
  doc.text(`Tiempo Activo Acumulado: ${formatearDuracion(duracionTotalMin)}`, 160, 34);
  doc.text(`Vel. Promedio: ${velMediaGlobal.toFixed(1)} km/h`, 230, 34);

  // Armar cuerpo de la tabla
  const tableData: (string | number)[][] = items.map((it) => [
    it.dispositivoNombre,
    it.dni || '—',
    it.placa || '—',
    it.sectorAsignado || 'Sin sector',
    it.inicio ? formatearHora(it.inicio) : '—',
    it.fin ? formatearHora(it.fin) : '—',
    `${it.distanciaKm.toFixed(1)} km`,
    it.velocidadMediaKmh ? `${it.velocidadMediaKmh.toFixed(1)} km/h` : '—',
    it.velocidadMaximaKmh ? `${it.velocidadMaximaKmh.toFixed(1)} km/h` : '—',
    it.duracionMinutos ? formatearDuracion(it.duracionMinutos) : '0 min',
    it.tieneActividad ? 'Activo' : 'Sin mov.',
  ]);

  // Fila de pie con totales
  tableData.push([
    'TOTALES',
    '-',
    '-',
    '-',
    '-',
    '-',
    `${distanciaTotal.toFixed(1)} km`,
    `${velMediaGlobal.toFixed(1)} km/h`,
    '-',
    formatearDuracion(duracionTotalMin),
    `${activos} activos`,
  ]);

  // Renderizar tabla
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const docAny = doc as any;
  if (typeof docAny.autoTable === 'function') {
    docAny.autoTable({
      startY: 44,
      head: [
        [
          'Dispositivo',
          'DNI / Doc',
          'Placa',
          'Sector',
          'Inicio',
          'Fin',
          'Distancia',
          'Vel. Media',
          'Vel. Máxima',
          'Tiempo Activo',
          'Estado',
        ],
      ],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [21, 91, 208], textColor: [255, 255, 255], fontStyle: 'bold' },
      footStyles: { fillColor: [240, 243, 246], textColor: [20, 20, 20], fontStyle: 'bold' },
      didParseCell: (data: { row: { index: number }; cell: { styles: { fontStyle: string; fillColor?: number[] } } }) => {
        if (data.row.index === tableData.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [235, 240, 248];
        }
      },
    });
  }

  const safeInicio = meta.fechaInicio.replace(/[^0-9-]/g, '');
  const safeFin = meta.fechaFin.replace(/[^0-9-]/g, '');
  doc.save(`Historial_Perifoneo_${safeInicio}_al_${safeFin}.pdf`);
}

