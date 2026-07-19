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

export function MetricsChart({ rows }: { rows: MetricRow[] }) {
  const availableFields = useMemo(
    () => METRIC_FIELDS.filter((f) => rows.some((r) => r[f.key as keyof MetricRow] != null)),
    [rows]
  );

  const [selected, setSelected] = useState<MetricFieldKey>(availableFields[0]?.key ?? 'weight_kg');

  if (availableFields.length === 0) return null;

  const field = availableFields.find((f) => f.key === selected) ?? availableFields[0];
  const color = colorForField(field.key);
  const gradientId = `metric-gradient-${field.key}`;

  const data = rows
    .filter((r) => r[field.key as keyof MetricRow] != null)
    .map((r) => ({
      date: new Date(r.recorded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      value: r[field.key as keyof MetricRow] as number,
    }));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Progress</CardTitle>
        <Select value={selected} onValueChange={(v) => setSelected(v as MetricFieldKey)}>
          <SelectTrigger className="w-55">
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
      </CardHeader>
      <CardContent className="h-72">
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
      </CardContent>
    </Card>
  );
}
