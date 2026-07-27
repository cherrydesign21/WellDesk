'use client';

import { useState } from 'react';
import { METRIC_FIELDS, isLengthField, displayMetricValue, displayMetricUnit } from '@welldesk/shared';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ExportMenu } from '@/components/ui/export-menu';
import { useLengthUnit } from '@/lib/use-length-unit';
import { LengthUnitToggle } from './length-unit-toggle';
import type { MetricRow } from './types';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function formatDelta(previous: number, current: number) {
  const delta = Math.round((current - previous) * 100) / 100;
  if (delta === 0) return '—';
  return delta > 0 ? `+${delta}` : `${delta}`;
}

export function MetricsCompare({ rows }: { rows: MetricRow[] }) {
  const sorted = [...rows].sort((a, b) => a.recorded_at.localeCompare(b.recorded_at));

  const [currentId, setCurrentId] = useState(sorted[sorted.length - 1]?.id);
  const [previousId, setPreviousId] = useState(sorted[sorted.length - 2]?.id ?? sorted[0]?.id);
  const [lengthUnit] = useLengthUnit();

  if (sorted.length < 2) return null;

  const visitCurrent = sorted.find((r) => r.id === currentId) ?? sorted[sorted.length - 1];
  const visitPrevious = sorted.find((r) => r.id === previousId) ?? sorted[0];
  const isLatest = visitCurrent.id === sorted[sorted.length - 1]?.id;

  const rowsToShow = METRIC_FIELDS.filter((f) => {
    const current = visitCurrent[f.key as keyof MetricRow];
    const previous = visitPrevious[f.key as keyof MetricRow];
    return current != null || previous != null;
  });
  const hasLengthRow = rowsToShow.some((f) => isLengthField(f.key));

  const exportRows = rowsToShow.map((f) => {
    const unit = displayMetricUnit(f.key, f.unit, lengthUnit);
    const currentRaw = visitCurrent[f.key as keyof MetricRow] as number | null;
    const previousRaw = visitPrevious[f.key as keyof MetricRow] as number | null;
    const current = currentRaw != null ? displayMetricValue(f.key, currentRaw, lengthUnit) : null;
    const previous = previousRaw != null ? displayMetricValue(f.key, previousRaw, lengthUnit) : null;
    return [
      f.label,
      current != null ? `${current}${unit ? ` ${unit}` : ''}` : '—',
      previous != null ? `${previous}${unit ? ` ${unit}` : ''}` : '—',
      current != null && previous != null ? formatDelta(previous, current) : '—',
    ];
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Compare Visits</CardTitle>
        <div className="flex items-center gap-2">
          {hasLengthRow && <LengthUnitToggle />}
          <ExportMenu
            filenameBase="compare-visits"
            title="Compare Visits"
            headers={['Metric', 'Current', 'Previous', 'Change']}
            rows={exportRows}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <Select value={currentId} onValueChange={(v) => v && setCurrentId(v)}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {(value: string) => {
                  const r = sorted.find((row) => row.id === value);
                  if (!r) return '';
                  return `${formatDateTime(r.recorded_at)}${r.id === sorted[sorted.length - 1]?.id ? ' (Current)' : ''}`;
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {sorted.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {formatDateTime(r.recorded_at)}
                  {r.id === sorted[sorted.length - 1]?.id ? ' (Current)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">vs</span>
          <Select value={previousId} onValueChange={(v) => v && setPreviousId(v)}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {(value: string) => {
                  const r = sorted.find((row) => row.id === value);
                  return r ? formatDateTime(r.recorded_at) : '';
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {sorted.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {formatDateTime(r.recorded_at)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {rowsToShow.length === 0 ? (
          <p className="text-sm text-muted-foreground">No overlapping metrics between these two visits.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead>{isLatest ? 'Current' : formatDateTime(visitCurrent.recorded_at)}</TableHead>
                <TableHead>Previous</TableHead>
                <TableHead>Change</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rowsToShow.map((f) => {
                const currentRaw = visitCurrent[f.key as keyof MetricRow] as number | null;
                const previousRaw = visitPrevious[f.key as keyof MetricRow] as number | null;
                const unit = displayMetricUnit(f.key, f.unit, lengthUnit);
                const current = currentRaw != null ? displayMetricValue(f.key, currentRaw, lengthUnit) : null;
                const previous = previousRaw != null ? displayMetricValue(f.key, previousRaw, lengthUnit) : null;
                const hasChange = currentRaw != null && previousRaw != null && currentRaw !== previousRaw;
                // a simple, transparent heuristic: for these tracked vitals a
                // decrease reads as improved for a weight-management context.
                const improved = hasChange && currentRaw! < previousRaw!;
                return (
                  <TableRow key={f.key}>
                    <TableCell>{f.label}</TableCell>
                    <TableCell>{current != null ? `${current}${unit ? ` ${unit}` : ''}` : '—'}</TableCell>
                    <TableCell>{previous != null ? `${previous}${unit ? ` ${unit}` : ''}` : '—'}</TableCell>
                    <TableCell>
                      {current != null && previous != null ? formatDelta(previous, current) : '—'}
                    </TableCell>
                    <TableCell>
                      {hasChange ? (
                        <Badge variant={improved ? 'success' : 'warning'}>{improved ? 'Improved' : 'Watch'}</Badge>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
