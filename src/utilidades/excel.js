import * as XLSX from 'xlsx';

export function exportarExcel(a, b, c) {
  // Acepta exportarExcel(datos, nombre) o exportarExcel(columnas, datos, nombre)
  let datos, filename;
  if (typeof b === 'string' && c === undefined) {
    datos = Array.isArray(a) ? a : [];
    filename = b;
  } else {
    datos = Array.isArray(b) ? b : [];
    filename = c || 'reporte';
  }
  if (!datos.length) return;

  const worksheet = XLSX.utils.json_to_sheet(datos);

  const primera = datos[0] || {};
  const colWidths = Object.keys(primera).map((k) => ({
    wch: Math.max(String(k).length, 12),
  }));
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
