import { createClient } from '@/lib/supabase/server';
import { requireClient } from '@/lib/auth';
import { getPlanWithMeals } from '@/lib/diet-plans';
import { calculateBmi } from '@welldesk/shared';
import { PlanView } from '@/components/diet-plans/plan-view';
import { MetricsChart } from '@/components/metrics/metrics-chart';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { MetricRow } from '@/components/metrics/types';

export default async function PortalPage() {
  const { client } = await requireClient();
  const supabase = await createClient();

  const { data: activePlanRow } = await supabase
    .from('diet_plans')
    .select('id')
    .eq('client_id', client.id)
    .eq('is_template', false)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const currentPlan = activePlanRow ? await getPlanWithMeals(supabase, activePlanRow.id) : null;

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

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Hi {client.full_name.split(' ')[0]}</h1>

      <div>
        <h2 className="mb-3 text-lg font-medium">Your Diet Plan</h2>
        {currentPlan ? (
          <PlanView plan={currentPlan} />
        ) : (
          <p className="text-sm text-muted-foreground">No active diet plan yet.</p>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium">Your Progress</h2>
        <MetricsChart rows={rows} />
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
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No payments recorded yet.
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
