import { toCsv, downloadCsv } from '@/lib/csv';

function saveBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportTableAsCsv(filenameBase: string, headers: string[], rows: unknown[][]) {
  downloadCsv(`${filenameBase}.csv`, toCsv(headers, rows));
}

export async function exportTableAsXlsx(filenameBase: string, headers: string[], rows: unknown[][]) {
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  saveBlob(
    `${filenameBase}.xlsx`,
    new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  );
}

export async function exportTableAsPdf(
  filenameBase: string,
  title: string,
  headers: string[],
  rows: (string | number)[][]
) {
  const [{ pdf }, { GenericTablePdf }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('@/lib/exports/generic-table-pdf'),
  ]);
  const blob = await pdf(<GenericTablePdf title={title} headers={headers} rows={rows} />).toBlob();
  saveBlob(`${filenameBase}.pdf`, blob);
}
