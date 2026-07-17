import * as XLSX from 'xlsx';

export type PaymentExportRow = {
  payment_date: string;
  client_name: string;
  amount: number;
  mode: string;
  reference_no: string | null;
  notes: string | null;
};

export function renderPaymentsXlsx(rows: PaymentExportRow[]): Buffer {
  const data: (string | number)[][] = [['Date', 'Client', 'Amount', 'Mode', 'Reference', 'Notes']];

  for (const r of rows) {
    data.push([r.payment_date, r.client_name, r.amount, r.mode, r.reference_no ?? '', r.notes ?? '']);
  }

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  worksheet['!cols'] = [{ wch: 12 }, { wch: 24 }, { wch: 12 }, { wch: 10 }, { wch: 20 }, { wch: 30 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Payments');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}
