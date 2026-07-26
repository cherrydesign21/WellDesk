import Link from 'next/link';
import { UtensilsCrossed, CalendarDays, Wallet, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireClient } from '@/lib/auth';
import { calculateBmi, utcIsoToLocalDateKey, utcIsoToLocalTime } from '@welldesk/shared';
import { MetricsChart } from '@/components/metrics/metrics-chart';
import { PortalLogMetricDialog } from '@/components/portal/portal-log-metric-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { MetricRow } from '@/components/metrics/types';

const NEW_PLAN_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

export default async function PortalPage() {
  const { client } = await requireClient();
  const supabase = await createClient();

  const { data: activePlanRow } = await supabase
    .from('diet_plans')
    .select('id, name, plan_date, version, created_at')
    .eq('client_id', client.id)
    .eq('is_template', false)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nowMs = new Date().getTime();
  const isNewPlan = activePlanRow ? nowMs - new Date(activePlanRow.created_at).getTime() < NEW_PLAN_WINDOW_MS : false;

  const { data: metrics } = await supabase
    .from('health_metrics')
    .select(
      'id, recorded_at, systolic_bp, diastolic_bp, blood_sugar_fasting, blood_sugar_post_meal, weight_kg, height_cm, waist_cm, chest_cm, hips_cm, body_fat_pct, target_weight_kg, notes'
    )
    .eq('client_id', client.id)
    .order('recorded_at', { ascending: true });

  const rows: MetricRow[] = (metrics ?? []).reduce<{ list: MetricRow[]; lastHeight: number | null }>(
    (state, m) => {
      const lastHeight = m.height_cm ?? state.lastHeight;
      const bmi = m.weight_kg && lastHeight ? calculateBmi(m.weight_kg, lastHeight) : null;
      return { list: [...state.list, { ...m, bmi }], lastHeight };
    },
    { list: [], lastHeight: null }
  ).list;

  const { data: payments } = await supabase
    .from('payments')
    .select('id, amount, payment_date, mode, reference_no')
    .eq('client_id', client.id)
    .order('payment_date', { ascending: false });

  const timezone = client.practices?.timezone ?? 'Asia/Kolkata';
  const { data: appointments } = await supabase
    .from('appointments')
    .select('id, starts_at, status')
    .eq('client_id', client.id)
    .eq('status', 'scheduled')
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Hi {client.full_name.split(' ')[0]}</h1>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-medium">
            Your Diet Plan
            {isNewPlan && <Badge variant="success">New</Badge>}
          </h2>
          <Link
            href="/portal/diet-plans"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:underline"
          >
            View all plans
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {activePlanRow ? (
          <Card>
            <CardContent className="flex items-center justify-between gap-4 pt-4">
              <div>
                <p className="font-medium">{activePlanRow.name}</p>
                <p className="text-sm text-muted-foreground">
                  {activePlanRow.plan_date} · v{activePlanRow.version}
                </p>
              </div>
              <Button size="sm" render={<Link href={`/portal/diet-plans/${activePlanRow.id}`} />}>
                View chart
              </Button>
            </CardContent>
          </Card>
        ) : (
          <EmptyState icon={UtensilsCrossed} title="No active diet plan yet" compact />
        )}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium">Your Progress</h2>
          <PortalLogMetricDialog />
        </div>
        <MetricsChart rows={rows} />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium">Upcoming Appointments</h2>
        {!appointments || appointments.length === 0 ? (
          <EmptyState icon={CalendarDays} title="No upcoming appointments" compact />
        ) : (
          <Card>
            <CardContent className="space-y-2 pt-4">
              {appointments.map((a) => (
                <div key={a.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{utcIsoToLocalDateKey(a.starts_at, timezone)}</span>
                  <span className="text-muted-foreground">{utcIsoToLocalTime(a.starts_at, timezone)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium">Payment Receipts</h2>
        <Card>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(!payments || payments.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <EmptyState icon={Wallet} title="No payments recorded yet" compact />
                    </TableCell>
                  </TableRow>
                )}
                {payments?.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.payment_date}</TableCell>
                    <TableCell>{p.amount}</TableCell>
                    <TableCell className="capitalize">{p.mode}</TableCell>
                    <TableCell>{p.reference_no ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
