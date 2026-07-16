import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { calculateBmi } from '@welldesk/shared';
import { Badge } from '@/components/ui/badge';
import { LogMetricDialog } from '@/components/metrics/log-metric-dialog';
import { MetricsChart } from '@/components/metrics/metrics-chart';
import { MetricsCompare } from '@/components/metrics/metrics-compare';
import { MetricsHistoryTable } from '@/components/metrics/metrics-history-table';
import type { MetricRow } from '@/components/metrics/types';

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'active':
      return 'default';
    case 'paused':
      return 'secondary';
    case 'expired':
      return 'destructive';
    default:
      return 'outline';
  }
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const supabase = await createClient();
  const result = await getCurrentProfile(supabase);
  if (!result) return null;

  const { data: client } = await supabase
    .from('clients')
    .select('id, full_name, phone, email, status')
    .eq('id', clientId)
    .single();

  if (!client) notFound();

  const { data: metrics } = await supabase
    .from('health_metrics')
    .select(
      'id, recorded_at, systolic_bp, diastolic_bp, blood_sugar_fasting, blood_sugar_post_meal, weight_kg, height_cm, waist_cm, chest_cm, hips_cm, body_fat_pct, target_weight_kg, notes'
    )
    .eq('client_id', clientId)
    .order('recorded_at', { ascending: true });

  const rows: MetricRow[] = (metrics ?? []).reduce<{ list: MetricRow[]; lastHeight: number | null }>(
    (state, m) => {
      const lastHeight = m.height_cm ?? state.lastHeight;
      const bmi = m.weight_kg && lastHeight ? calculateBmi(m.weight_kg, lastHeight) : null;
      return { list: [...state.list, { ...m, bmi }], lastHeight };
    },
    { list: [], lastHeight: null }
  ).list;

  return (
    <div className="space-y-6">
      <Link
        href="/clients"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to clients
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{client.full_name}</h1>
            <Badge variant={statusVariant(client.status)} className="capitalize">
              {client.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {client.phone}
            {client.email ? ` · ${client.email}` : ''}
          </p>
        </div>
        <LogMetricDialog clientId={client.id} />
      </div>

      <MetricsChart rows={rows} />
      <MetricsCompare rows={rows} />

      <div>
        <h2 className="mb-3 text-lg font-medium">History</h2>
        <MetricsHistoryTable clientId={client.id} rows={rows} />
      </div>
    </div>
  );
}
