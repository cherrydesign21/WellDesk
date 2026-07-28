'use client';

import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, FileJson } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportTableAsCsv, exportTableAsXlsx, exportTableAsPdf } from '@/lib/table-export';

export function ExportMenu({
  label = 'Export',
  filenameBase,
  title,
  headers,
  rows,
}: {
  label?: string;
  filenameBase: string;
  title: string;
  headers: string[];
  rows: (string | number)[][];
}) {
  const [isExporting, setIsExporting] = useState(false);

  async function handle(format: 'pdf' | 'xlsx' | 'csv') {
    setIsExporting(true);
    try {
      if (format === 'csv') exportTableAsCsv(filenameBase, headers, rows);
      else if (format === 'xlsx') await exportTableAsXlsx(filenameBase, headers, rows);
      else await exportTableAsPdf(filenameBase, title, headers, rows);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            disabled={isExporting}
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
          />
        }
      >
        <Download className="h-3.5 w-3.5" />
        {isExporting ? 'Exporting…' : label}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handle('pdf')}>
          <FileText className="h-4 w-4" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handle('xlsx')}>
          <FileSpreadsheet className="h-4 w-4" />
          Export as Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handle('csv')}>
          <FileJson className="h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
