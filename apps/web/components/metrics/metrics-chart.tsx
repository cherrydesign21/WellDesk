'use client';

import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TrendingDown, TrendingUp, ArrowRightLeft, Percent } from 'lucide-react';
import { METRIC_FIELDS, type MetricFieldKey } from '@welldesk/shared';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MetricRow } from './types';

const FIELD_COLORS = [
  'var(--primary-500)',
  'var(--info-500)',
  'var(--danger-500)',
  'var(--warning-500)',
  'var(--success-500)',
];

function colorForField(key: string) {
  const index = METRIC_FIELDS.findIndex((f) => f.key === key);
  return FIELD_COLORS[index % FIELD_COLORS.length];
}

const RANGES = [
  { key: '7d', label: '7 Days', days: 7 },
  { key: '30d', label: '30 Days', days: 30 },
  { key: '90d', label: '90 Days', days: 90 },
  { key: '6m', label: '6 Months', days: 182 },
  { key: '1y', label: '1 Year', days: 365 },
] as const;

export function MetricsChart({ rows }: { rows: MetricRow[] }) {
  const availableFields = useMemo(
    () => METRIC_FIELDS.filter((f) => rows.some((r) => r[f.key as keyof MetricRow] != null)),
    [rows]
  );

  const [selected, setSelected] = useState<MetricFieldKey>(availableFields[0]?.key ?? 'weight_kg');
  const [range, setRange] = useState<(typeof RANGES)[number]['key']>('90d');

  if (availableFields.length === 0) return null;

  const field = availableFields.find((f) => f.key === selected) ?? availableFields[0];
  const color = colorForField(field.key);
  const gradientId = `metric-gradient-${field.key}`;

  const activeRange = RANGES.find((r) => r.key === range) ?? RANGES[2];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - activeRange.days);

  const fieldRows = rows.filter((r) => r[field.key as keyof MetricRow] != null);
  const rangeRows = fieldRows.filter((r) => new Date(r.recorded_at) >= cutoff);
  // fall back to full history when the selected window has too little data
  // to plot — an empty chart is worse than showing more than was asked for.
  const visibleRows = rangeRows.length >= 2 ? rangeRows : fieldRows;

  const data = visibleRows.map((r) => ({
    date: new Date(r.recorded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    fullDate: new Date(r.recorded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
    value: r[field.key as keyof MetricRow] as number,
  }));

  const startValue = data[0]?.value ?? null;
  const currentValue = data[data.length - 1]?.value ?? null;
  const totalChange = startValue !== null && currentValue !== null ? Math.round((currentValue - startValue) * 100) / 100 : null;
  const pctChange =
    startValue !== null && currentValue !== null && startValue !== 0
      ? Math.round(((currentValue - startValue) / Math.abs(startValue)) * 1000) / 10
      : null;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-base">Progress Overview</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={selected} onValueChange={(v) => setSelected(v as MetricFieldKey)}>
            <SelectTrigger className="w-45">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableFields.map((f) => (
                <SelectItem key={f.key} value={f.key}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 rounded-full border p-0.5">
            {RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setRange(r.key)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  r.key === range ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 lg:flex-row">
        <div className="h-72 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" fontSize={12} tickLine={false} />
              <YAxis
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={40}
                domain={['auto', 'auto']}
                unit={field.unit ? ` ${field.unit}` : ''}
              />
              <Tooltip
                labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate ?? ''}
                formatter={(value) => [`${value}${field.unit ? ` ${field.unit}` : ''}`, field.label]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2.5}
                fill={`url(#${gradientId})`}
                dot={{ r: 3, fill: color, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {startValue !== null && currentValue !== null && (
          <div className="grid grid-cols-2 gap-3 lg:w-52 lg:grid-cols-1">
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5" /> Starting {field.label}
              </div>
              <p className="mt-1 text-lg font-semibold">
                {startValue}
                {field.unit ? ` ${field.unit}` : ''}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TrendingDown className="h-3.5 w-3.5" /> Current {field.label}
              </div>
              <p className="mt-1 text-lg font-semibold">
                {currentValue}
                {field.unit ? ` ${field.unit}` : ''}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ArrowRightLeft className="h-3.5 w-3.5" /> Total Change
              </div>
              <p
                className={`mt-1 text-lg font-semibold ${totalChange !== null && totalChange < 0 ? 'text-(--success-700)' : totalChange !== null && totalChange > 0 ? 'text-(--warning-700)' : ''}`}
              >
                {totalChange !== null && totalChange > 0 ? '+' : ''}
                {totalChange}
                {field.unit ? ` ${field.unit}` : ''}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Percent className="h-3.5 w-3.5" /> Percentage Change
              </div>
              <p
                className={`mt-1 text-lg font-semibold ${pctChange !== null && pctChange < 0 ? 'text-(--success-700)' : pctChange !== null && pctChange > 0 ? 'text-(--warning-700)' : ''}`}
              >
                {pctChange !== null && pctChange > 0 ? '+' : ''}
                {pctChange}%
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
