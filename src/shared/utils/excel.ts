import * as XLSX from 'xlsx';

/**
 * Módulo de Exportación a Hojas de Cálculo (Microsoft Excel - XLSX).
 *
 * Genera libros de trabajo con formato legible y anchos de columna dinámicos.
 */

/**
 * Exporta una lista de objetos a un archivo descargable con extensión .xlsx.
 *
 * @param a Lista de datos o columnas
 * @param b Nombre del archivo o lista de datos si se pasan columnas primero
 * @param c Nombre del archivo si se utiliza la convención de 3 parámetros
 */
export function exportarExcel(
  a: unknown,
  b?: string | unknown[],
  c?: string
): void {
  let datos: Record<string, unknown>[] = [];
  let filename = 'reporte';

  if (typeof b === 'string' && c === undefined) {
    datos = Array.isArray(a) ? (a as Record<string, unknown>[]) : [];
    filename = b;
  } else {
    datos = Array.isArray(b) ? (b as Record<string, unknown>[]) : [];
    filename = c || 'reporte';
  }

  if (!datos.length) {
    alert('No hay datos disponibles para exportar.');
    return;
  }

  // Creación de la hoja de cálculo a partir del arreglo de objetos JSON
  const worksheet = XLSX.utils.json_to_sheet(datos);

  // Estimación de ancho óptimo para cada columna
  const primera = datos[0] || {};
  const colWidths = Object.keys(primera).map((k) => ({
    wch: Math.max(String(k).length + 2, 14),
  }));
  worksheet['!cols'] = colWidths;

  // Ensamblado del libro de trabajo
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');

  // Disparo de la descarga en el navegador
  const sanitizedName = filename.replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.writeFile(workbook, `${sanitizedName}.xlsx`);
}
