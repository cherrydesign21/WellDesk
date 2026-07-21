'use client';

import { useState, useTransition } from 'react';
import { Trash2, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { deleteHealthMetric } from '@/app/(dashboard)/clients/[clientId]/actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { ExportMenu } from '@/components/ui/export-menu';
import type { MetricRow } from './types';

const METRICS_EXPORT_HEADERS = ['Date', 'Weight', 'BMI', 'BP', 'Sugar (Fasting)', 'Sugar (Post-meal)', 'Notes'];
const COLLAPSED_COUNT = 3;

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function MetricsHistoryTable({ clientId, rows }: { clientId: string; rows: MetricRow[] }) {
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);

  function handleDelete(id: string) {
    if (!window.confirm('Delete this entry? This cannot be undone.')) return;
    startTransition(async () => {
      const result = await deleteHealthMetric(clientId, id);
      if (result?.error) toast.error(result.error);
      else toast.success('Entry deleted');
    });
  }

  if (rows.length === 0) {
    return <EmptyState icon={Activity} title="No metrics logged yet" compact />;
  }

  const sorted = [...rows].sort((a, b) => b.recorded_at.localeCompare(a.recorded_at));
  const visible = expanded ? sorted : sorted.slice(0, COLLAPSED_COUNT);

  const exportRows = sorted.map((row) => [
    formatDateTime(row.recorded_at),
    row.weight_kg ?? '—',
    row.bmi ?? '—',
    row.systolic_bp && row.diastolic_bp ? `${row.systolic_bp}/${row.diastolic_bp}` : '—',
    row.blood_sugar_fasting ?? '—',
    row.blood_sugar_post_meal ?? '—',
    row.notes ?? '',
  ]);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <ExportMenu filenameBase="metrics-history" title="Metrics History" headers={METRICS_EXPORT_HEADERS} rows={exportRows} />
      </div>
      <div className="divide-y rounded-md border">
        {visible.map((row) => (
          <div key={row.id} className="flex items-start justify-between gap-3 p-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium whitespace-nowrap">{formatDateTime(row.recorded_at)}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {row.weight_kg != null && <Badge variant="outline">{row.weight_kg} kg</Badge>}
                {row.bmi != null && <Badge variant="outline">{row.bmi} BMI</Badge>}
                {row.systolic_bp != null && row.diastolic_bp != null && (
                  <Badge variant="outline">
                    {row.systolic_bp}/{row.diastolic_bp} BP
                  </Badge>
                )}
              </div>
              {row.notes && <p className="mt-1.5 truncate text-xs text-muted-foreground">{row.notes}</p>}
            </div>
            <Button variant="ghost" size="icon" disabled={isPending} onClick={() => handleDelete(row.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      {sorted.length > COLLAPSED_COUNT && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="text-sm font-medium text-primary hover:underline"
        >
          {expanded ? 'Show less' : `View All History (${sorted.length}) →`}
        </button>
      )}
    </div>
  );
}
