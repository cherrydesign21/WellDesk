'use client';

import { useState } from 'react';
import { METRIC_FIELDS } from '@welldesk/shared';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { MetricRow } from './types';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function formatDelta(a: number, b: number) {
  const delta = Math.round((b - a) * 100) / 100;
  if (delta === 0) return '—';
  return delta > 0 ? `+${delta}` : `${delta}`;
}

export function MetricsCompare({ rows }: { rows: MetricRow[] }) {
  const sorted = [...rows].sort((a, b) => a.recorded_at.localeCompare(b.recorded_at));

  const [idA, setIdA] = useState(sorted[sorted.length - 2]?.id ?? sorted[0]?.id);
  const [idB, setIdB] = useState(sorted[sorted.length - 1]?.id);

  if (sorted.length < 2) return null;

  const visitA = sorted.find((r) => r.id === idA) ?? sorted[0];
  const visitB = sorted.find((r) => r.id === idB) ?? sorted[sorted.length - 1];

  const rowsToShow = METRIC_FIELDS.filter((f) => {
    const a = visitA[f.key as keyof MetricRow];
    const b = visitB[f.key as keyof MetricRow];
    return a != null || b != null;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Compare visits</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Select value={idA} onValueChange={(v) => v && setIdA(v)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sorted.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {formatDateTime(r.recorded_at)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={idB} onValueChange={(v) => v && setIdB(v)}>
            <SelectTrigger className="w-full">
              <SelectValue />
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
                <TableHead>Visit A</TableHead>
                <TableHead>Visit B</TableHead>
                <TableHead>Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rowsToShow.map((f) => {
                const a = visitA[f.key as keyof MetricRow] as number | null;
                const b = visitB[f.key as keyof MetricRow] as number | null;
                return (
                  <TableRow key={f.key}>
                    <TableCell>{f.label}</TableCell>
                    <TableCell>{a != null ? `${a}${f.unit ? ` ${f.unit}` : ''}` : '—'}</TableCell>
                    <TableCell>{b != null ? `${b}${f.unit ? ` ${f.unit}` : ''}` : '—'}</TableCell>
                    <TableCell>{a != null && b != null ? formatDelta(a, b) : '—'}</TableCell>
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
