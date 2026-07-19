import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { calculateBmi, getEffectiveEnrollmentStatus } from '@welldesk/shared';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MetricsChart } from '@/components/metrics/metrics-chart';
import { MetricsCompare } from '@/components/metrics/metrics-compare';
import { IdealWeightCard } from '@/components/metrics/ideal-weight-card';
import type { MetricRow } from '@/components/metrics/types';

function statusVariant(status: string): 'success' | 'warning' | 'destructive' | 'outline' {
  switch (status) {
    case 'active':
      return 'success';
    case 'paused':
      return 'warning';
    case 'expired':
      return 'destructive';
    default:
      return 'outline';
  }
}

export default async function AdminClientDetailPage({
  params,
}: {
  params: Promise<{ practiceId: string; clientId: string }>;
}) {
  const { practiceId, clientId } = await params;
  const supabase = createAdminClient();

  const { data: client } = await supabase
    .from('clients')
    .select('id, full_name, phone, email, status, gender, dob')
    .eq('id', clientId)
    .eq('practice_id', practiceId)
    .single();

  if (!client) notFound();

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('id, cycle_number, plan_type, start_date, expiry_date, status, plan_amount')
    .eq('client_id', clientId)
    .order('cycle_number', { ascending: false });

  const { data: payments } = await supabase
    .from('payments')
    .select('id, amount, payment_date, mode, reference_no')
    .eq('client_id', clientId)
    .order('payment_date', { ascending: false });

  const { data: appointments } = await supabase
    .from('appointments')
    .select('id, starts_at, status')
    .eq('client_id', clientId)
    .order('starts_at', { ascending: false });

  const { data: metrics } = await supabase
    .from('health_metrics')
    .select(
      'id, recorded_at, systolic_bp, diastolic_bp, blood_sugar_fasting, blood_sugar_post_meal, weight_kg, height_cm, waist_cm, chest_cm, hips_cm, body_fat_pct, target_weight_kg, notes'
    )
    .eq('client_id', clientId)
    .order('recorded_at', { ascending: true });

  const metricsAccumulated = (metrics ?? []).reduce<{ list: MetricRow[]; lastHeight: number | null }>(
    (state, m) => {
      const lastHeight = m.height_cm ?? state.lastHeight;
      const bmi = m.weight_kg && lastHeight ? calculateBmi(m.weight_kg, lastHeight) : null;
      return { list: [...state.list, { ...m, bmi }], lastHeight };
    },
    { list: [], lastHeight: null }
  );
  const rows = metricsAccumulated.list;
  const latestWeightKg = [...rows].reverse().find((r) => r.weight_kg != null)?.weight_kg ?? null;

  const totalPaid = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <Link
        href={`/admin/practices/${practiceId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to practice
      </Link>

      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">{client.full_name}</h1>
        <Badge variant="outline" className="capitalize">
          {client.status}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        {client.phone}
        {client.email ? ` · ${client.email}` : ''}
      </p>

      <IdealWeightCard
        heightCm={metricsAccumulated.lastHeight}
        gender={client.gender}
        currentWeightKg={latestWeightKg}
      />

      <div>
        <h2 className="mb-3 text-lg font-medium">Enrollment history</h2>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cycle</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(enrollments ?? []).map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{e.cycle_number}</TableCell>
                  <TableCell>{e.plan_type}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {e.start_date} → {e.expiry_date}
                  </TableCell>
                  <TableCell>{e.plan_amount}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(getEffectiveEnrollmentStatus(e))} className="capitalize">
                      {getEffectiveEnrollmentStatus(e)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-medium">Appointments</h2>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(appointments ?? []).map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="whitespace-nowrap">{new Date(a.starts_at).toLocaleString()}</TableCell>
                    <TableCell className="capitalize">{a.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-medium">Payments</h2>
          <Card className="mb-3">
            <CardContent className="py-3 text-sm">
              <span className="text-muted-foreground">Total paid: </span>
              <span className="font-semibold">{totalPaid}</span>
            </CardContent>
          </Card>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Mode</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(payments ?? []).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="whitespace-nowrap">{p.payment_date}</TableCell>
                    <TableCell>{p.amount}</TableCell>
                    <TableCell className="capitalize">{p.mode}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MetricsChart rows={rows} />
        <MetricsCompare rows={rows} />
      </div>
    </div>
  );
}
