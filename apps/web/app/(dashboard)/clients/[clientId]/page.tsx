import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { calculateBmi, getEffectiveClientStatus } from '@welldesk/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LogMetricDialog } from '@/components/metrics/log-metric-dialog';
import { MetricsChart } from '@/components/metrics/metrics-chart';
import { MetricsCompare } from '@/components/metrics/metrics-compare';
import { MetricsHistoryTable } from '@/components/metrics/metrics-history-table';
import { EnrollmentTimeline } from '@/components/enrollments/enrollment-timeline';
import { LogPaymentDialog } from '@/components/payments/log-payment-dialog';
import { PaymentSummary } from '@/components/payments/payment-summary';
import { PaymentsHistoryTable } from '@/components/payments/payments-history-table';
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

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('id, cycle_number, plan_type, start_date, expiry_date, status, plan_amount')
    .eq('client_id', clientId)
    .order('cycle_number', { ascending: false });

  const latestEnrollment = enrollments?.[0] ?? null;
  const effectiveStatus = getEffectiveClientStatus(client.status, latestEnrollment);

  const { data: payments } = await supabase
    .from('payments')
    .select('id, amount, payment_date, mode, reference_no, notes')
    .eq('client_id', clientId)
    .order('payment_date', { ascending: false });

  const { data: paymentSummary } = latestEnrollment
    ? await supabase
        .from('v_enrollment_payment_status')
        .select('plan_amount, amount_paid, amount_due, payment_status')
        .eq('enrollment_id', latestEnrollment.id)
        .single()
    : { data: null };

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
            <Badge variant={statusVariant(effectiveStatus)} className="capitalize">
              {effectiveStatus}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {client.phone}
            {client.email ? ` · ${client.email}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" render={<Link href={`/clients/${client.id}/diet-plans`} />}>
            Diet Plans
          </Button>
          <LogMetricDialog clientId={client.id} />
        </div>
      </div>

      <EnrollmentTimeline clientId={client.id} enrollments={enrollments ?? []} />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Payments</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              render={<a href={`/api/payments/export?clientId=${client.id}`} />}
            >
              Export
            </Button>
            <LogPaymentDialog clientId={client.id} />
          </div>
        </div>
        <PaymentSummary summary={paymentSummary} />
        <PaymentsHistoryTable clientId={client.id} rows={payments ?? []} />
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
