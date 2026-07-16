'use client';

import { useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { deleteHealthMetric } from '@/app/(dashboard)/clients/[clientId]/actions';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { MetricRow } from './types';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function MetricsHistoryTable({ clientId, rows }: { clientId: string; rows: MetricRow[] }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string) {
    if (!window.confirm('Delete this entry? This cannot be undone.')) return;
    startTransition(async () => {
      const result = await deleteHealthMetric(clientId, id);
      if (result?.error) toast.error(result.error);
      else toast.success('Entry deleted');
    });
  }

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No metrics logged yet.</p>;
  }

  const sorted = [...rows].sort((a, b) => b.recorded_at.localeCompare(a.recorded_at));

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Weight</TableHead>
            <TableHead>BMI</TableHead>
            <TableHead>BP</TableHead>
            <TableHead>Sugar (F / PM)</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="whitespace-nowrap">{formatDateTime(row.recorded_at)}</TableCell>
              <TableCell>{row.weight_kg ?? '—'}</TableCell>
              <TableCell>{row.bmi ?? '—'}</TableCell>
              <TableCell>
                {row.systolic_bp && row.diastolic_bp ? `${row.systolic_bp}/${row.diastolic_bp}` : '—'}
              </TableCell>
              <TableCell>
                {row.blood_sugar_fasting ?? '—'} / {row.blood_sugar_post_meal ?? '—'}
              </TableCell>
              <TableCell className="max-w-[200px] truncate text-muted-foreground">{row.notes}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isPending}
                  onClick={() => handleDelete(row.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
