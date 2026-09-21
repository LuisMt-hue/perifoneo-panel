import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { 
  formatearFecha, 
  formatearHora, 
  formatearDuracion, 
  formatearKm, 
  formatearPorcentaje 
} from './formato.js';

export function generarInformePDF(persona, sesiones, periodo) {
  const doc = new jsPDF();
  
  // Título
  doc.setFontSize(18);
  doc.text('Informe de Perifoneo', 14, 22);
  
  // Datos personales
  doc.setFontSize(11);
  doc.text(`Nombre: ${persona.nombre || '-'}`, 14, 32);
  doc.text(`DNI: ${persona.dni || '-'}`, 14, 38);
  doc.text(`Sector: ${persona.sector || '-'}`, 100, 32);
  doc.text(`Placa: ${persona.placa || '-'}`, 100, 38);
  
  // Periodo
  doc.text(`Periodo: ${periodo.desde} al ${periodo.hasta}`, 14, 46);
  
  // Tabla de sesiones
  const tableData = sesiones.map(s => [
    formatearFecha(s.inicio),
    formatearHora(s.inicio),
    formatearHora(s.fin),
    formatearDuracion(s.duracion_minutos),
    s.minutos_dentro ?? '-',
    s.minutos_fuera ?? '-',
    formatearPorcentaje(s.porcentaje_dentro),
    formatearKm(s.distancia_km)
  ]);
  
  // Totales
  const totalDuracion = sesiones.reduce((sum, s) => sum + (s.duracion_minutos || 0), 0);
  const totalDentro = sesiones.reduce((sum, s) => sum + (s.minutos_dentro || 0), 0);
  const totalFuera = sesiones.reduce((sum, s) => sum + (s.minutos_fuera || 0), 0);
  const totalKm = sesiones.reduce((sum, s) => sum + (s.distancia_km || 0), 0);
  const avgDentro = totalDuracion > 0 ? (totalDentro / totalDuracion) * 100 : 0;
  
  tableData.push([
    'TOTAL',
    '-',
    '-',
    formatearDuracion(totalDuracion),
    totalDentro,
    totalFuera,
    formatearPorcentaje(avgDentro),
    formatearKm(totalKm)
  ]);
  
  doc.autoTable({
    startY: 52,
    head: [['Fecha', 'Inicio', 'Fin', 'Duración', 'Min Dentro', 'Min Fuera', '% Dentro', 'Km']],
    body: tableData,
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    willDrawCell: function(data) {
      if (data.row.index === tableData.length - 1) {
        doc.setFont('', 'bold');
      }
    }
  });
  
  const finalY = doc.lastAutoTable.finalY || 52;
  
  // Evaluación del supervisor
  doc.setFontSize(11);
  doc.text('Evaluación del supervisor:', 14, finalY + 15);
  doc.rect(14, finalY + 20, 180, 30); // Caja vacía
  
  // Firma
  const signatureY = finalY + 80;
  doc.text('Firma del supervisor: ___________________', 14, signatureY);
  doc.text('Fecha: _______________', 120, signatureY);
  
  // Descargar
  doc.save(`informe_perifoneo_${persona.dni || 'reporte'}.pdf`);
}
