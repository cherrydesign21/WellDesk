'use client';

import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, FileJson } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  size = 'sm',
}: {
  label?: string;
  filenameBase: string;
  title: string;
  headers: string[];
  rows: (string | number)[][];
  size?: 'sm' | 'default';
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
      <DropdownMenuTrigger render={<Button type="button" variant="outline" size={size} disabled={isExporting} />}>
        <Download className="h-4 w-4" />
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
