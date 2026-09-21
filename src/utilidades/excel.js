import * as XLSX from 'xlsx';

export function exportarExcel(columns, data, filename) {
  const mappedData = data.map(item => {
    const row = {};
    columns.forEach(col => {
      row[col.header] = typeof col.accessorFn === 'function' 
        ? col.accessorFn(item)
        : item[col.key];
    });
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(mappedData);

  const colWidths = columns.map(col => ({
    wch: Math.max(col.header.length, 10)
  }));
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
