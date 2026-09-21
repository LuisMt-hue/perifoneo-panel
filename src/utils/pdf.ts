import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import type { SesionRecorrido, ResumenPerifoneador } from '../types/perifoneo.types';
import {
  formatearFecha,
  formatearHora,
  formatearDuracion,
  formatearKm,
  formatearPorcentaje,
} from './formato';

/**
 * Módulo de Generación de Informes Oficiales en PDF (jsPDF + AutoTable).
 *
 * Emite el documento de auditoría individual por perifoneador y periodo,
 * que incluye datos personales, desglose de recorridos y el recuadro formal
 * para la evaluación y firma manuscrita del supervisor (RF-33).
 */

export interface PeriodoReporte {
  desde: string;
  hasta: string;
}

export function generarInformePDF(
  persona: ResumenPerifoneador | Record<string, unknown>,
  sesionesODesde: SesionRecorrido[] | string,
  periodoOHasta?: PeriodoReporte | string
): void {
  let sesiones: SesionRecorrido[] = [];
  let periodo: PeriodoReporte = { desde: '', hasta: '' };

  if (Array.isArray(sesionesODesde)) {
    sesiones = sesionesODesde;
    if (typeof periodoOHasta === 'object' && periodoOHasta !== null) {
      periodo = periodoOHasta as PeriodoReporte;
    }
  } else {
    periodo = {
      desde: typeof sesionesODesde === 'string' ? sesionesODesde : '',
      hasta: typeof periodoOHasta === 'string' ? periodoOHasta : '',
    };
  }

  const doc = new jsPDF();

  // Encabezado institucional
  doc.setFontSize(18);
  doc.text('Informe de Perifoneo', 14, 22);

  // Ficha de datos personales del perifoneador
  doc.setFontSize(11);
  const nombre = (persona as Record<string, string>).nombre || '-';
  const dni = (persona as Record<string, string>).dni || '-';
  const sector =
    (persona as Record<string, string>).sector ||
    (persona as Record<string, string>).sector_nombre ||
    '-';
  const placa = (persona as Record<string, string>).placa || '-';

  doc.text(`Nombre: ${nombre}`, 14, 32);
  doc.text(`DNI: ${dni}`, 14, 38);
  doc.text(`Sector Asignado: ${sector}`, 100, 32);
  doc.text(`Placa de Unidad: ${placa}`, 100, 38);

  // Periodo auditado
  doc.text(`Periodo: ${periodo.desde || 'N/A'} al ${periodo.hasta || 'N/A'}`, 14, 46);

  // Matriz de datos de las sesiones del periodo
  const tableData: (string | number)[][] = sesiones.map((s) => [
    formatearFecha(s.inicio_at || s.inicio || s.fecha),
    formatearHora(s.inicio_at || s.inicio),
    formatearHora(s.fin_at || s.fin),
    formatearDuracion(s.minutos_totales ?? s.duracion_minutos),
    s.minutos_dentro !== undefined ? `${s.minutos_dentro} min` : '-',
    s.minutos_fuera !== undefined ? `${s.minutos_fuera} min` : '-',
    formatearPorcentaje(s.pct_dentro ?? s.porcentaje_dentro),
    formatearKm(s.km_totales ?? s.distancia_km),
  ]);

  // Cómputo de totales consolidados
  const totalDuracion = sesiones.reduce(
    (sum, s) => sum + (s.minutos_totales ?? s.duracion_minutos ?? 0),
    0
  );
  const totalDentro = sesiones.reduce((sum, s) => sum + (s.minutos_dentro || 0), 0);
  const totalFuera = sesiones.reduce((sum, s) => sum + (s.minutos_fuera || 0), 0);
  const totalKm = sesiones.reduce(
    (sum, s) => sum + (s.km_totales ?? s.distancia_km ?? 0),
    0
  );
  const avgDentro = totalDuracion > 0 ? (totalDentro / totalDuracion) * 100 : 0;

  // Fila de resumen al pie de la tabla
  tableData.push([
    'TOTAL',
    '-',
    '-',
    formatearDuracion(totalDuracion),
    `${totalDentro} min`,
    `${totalFuera} min`,
    formatearPorcentaje(avgDentro),
    formatearKm(totalKm),
  ]);

  // Renderizado de tabla con jspdf-autotable
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const docAny = doc as any;
  if (typeof docAny.autoTable === 'function') {
    docAny.autoTable({
      startY: 52,
      head: [['Fecha', 'Inicio', 'Fin', 'Duración', 'Min Dentro', 'Min Fuera', '% Dentro', 'Km']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255] },
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      didParseCell: (data: { row: { index: number }; cell: { styles: { fontStyle: string } } }) => {
        if (data.row.index === tableData.length - 1) {
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });
  }

  const finalY: number = docAny.lastAutoTable?.finalY || 160;

  // Cuadro de evaluación para firma y sello del supervisor
  doc.setFontSize(11);
  doc.text('Evaluación del supervisor:', 14, finalY + 12);
  doc.rect(14, finalY + 16, 180, 28); // Caja en blanco para observaciones manuscritas

  // Líneas de firma
  const signatureY = finalY + 65;
  doc.text('Firma del supervisor: _______________________', 14, signatureY);
  doc.text('Fecha: ____________________', 125, signatureY);

  // Guardar archivo PDF con nombre descriptivo
  const safeDni = dni.replace(/[^a-zA-Z0-9]/g, '');
  doc.save(`informe_perifoneo_${safeDni || 'reporte'}.pdf`);
}
