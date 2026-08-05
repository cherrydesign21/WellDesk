import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Demo-data generator for exactly ONE practice (Fitness Vibes /
// pscherrydesign@gmail.com) — NOT a general product feature. Hardcoding the
// practice ID here, rather than accepting one as a parameter, is what keeps
// this endpoint from ever being able to touch a real tenant's data even if
// a secret leaked. Triggered daily by Vercel Cron (see vercel.json) — an
// earlier attempt to trigger this from a scheduled Claude Code cloud
// routine fired on schedule but never actually issued the request, so this
// now uses the same proven mechanism as /api/cron/checkin-reminders.
const DEMO_PRACTICE_ID = '141ced24-c795-44ac-b516-30fa207533d4';
const DIETITIAN_PROFILE_ID = '2140beef-2852-40ef-ad68-8b84e89b9e90';
const PAYMENT_INTERVAL_DAYS = 30;

type EnrollmentLite = { id: string; status: string; currency: string };

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}
function round1(n: number) {
  return Math.round(n * 10) / 10;
}
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export async function GET(request: NextRequest) {
  // Vercel Cron auto-attaches "Bearer $CRON_SECRET" to every cron-configured
  // path — DEMO_SEED_SECRET stays accepted too, purely so this can still be
  // triggered manually for testing without needing Vercel's own secret.
  const authHeader = request.headers.get('authorization');
  const validAuth =
    authHeader === `Bearer ${process.env.CRON_SECRET}` || authHeader === `Bearer ${process.env.DEMO_SEED_SECRET}`;
  if (!validAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: clients, error: clientsError } = await admin
    .from('clients')
    .select('id, enrollments(id, status, currency)')
    .eq('practice_id', DEMO_PRACTICE_ID)
    .eq('status', 'active');

  if (clientsError) {
    return NextResponse.json({ error: clientsError.message }, { status: 500 });
  }

  let metricsLogged = 0;
  let paymentsLogged = 0;

  for (const client of clients ?? []) {
    const enrollments = (client.enrollments ?? []) as EnrollmentLite[];
    const activeEnrollment = enrollments.find((e) => e.status === 'active') ?? null;

    // --- BP / sugar / weight, continued as a random walk from the client's
    // own last reading so today's numbers stay plausible relative to
    // yesterday's rather than jumping around independently each day.
    const { data: lastMetric } = await admin
      .from('health_metrics')
      .select('weight_kg, systolic_bp, diastolic_bp, blood_sugar_fasting, blood_sugar_post_meal')
      .eq('client_id', client.id)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastMetric) {
      const { error: metricError } = await admin.from('health_metrics').insert({
        practice_id: DEMO_PRACTICE_ID,
        client_id: client.id,
        enrollment_id: activeEnrollment?.id ?? null,
        recorded_at: new Date().toISOString(),
        weight_kg: round1(clamp((lastMetric.weight_kg ?? 70) + rand(-0.3, 0.15), 40, 150)),
        systolic_bp: Math.round(clamp((lastMetric.systolic_bp ?? 120) + rand(-2, 2), 95, 150)),
        diastolic_bp: Math.round(clamp((lastMetric.diastolic_bp ?? 80) + rand(-1.5, 1.5), 60, 100)),
        blood_sugar_fasting: Math.round(clamp((lastMetric.blood_sugar_fasting ?? 95) + rand(-3, 3), 70, 160)),
        blood_sugar_post_meal: Math.round(clamp((lastMetric.blood_sugar_post_meal ?? 130) + rand(-5, 5), 100, 220)),
        created_by: null,
      });
      if (!metricError) metricsLogged++;
    }

    // --- payment, only against an active enrollment that isn't fully paid
    // yet, and only once ~30 days have passed since the last one against it.
    if (activeEnrollment) {
      const { data: paymentStatus } = await admin
        .from('v_enrollment_payment_status')
        .select('amount_due')
        .eq('enrollment_id', activeEnrollment.id)
        .maybeSingle();

      if (paymentStatus && paymentStatus.amount_due > 0) {
        const { data: lastPayment } = await admin
          .from('payments')
          .select('amount, payment_date')
          .eq('enrollment_id', activeEnrollment.id)
          .order('payment_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        const daysSinceLast = lastPayment
          ? (Date.now() - new Date(lastPayment.payment_date).getTime()) / 86400000
          : Infinity;

        if (daysSinceLast >= PAYMENT_INTERVAL_DAYS) {
          const installment = Math.min(lastPayment?.amount ?? paymentStatus.amount_due, paymentStatus.amount_due);
          const { error: paymentError } = await admin.from('payments').insert({
            practice_id: DEMO_PRACTICE_ID,
            client_id: client.id,
            enrollment_id: activeEnrollment.id,
            amount: installment,
            currency: activeEnrollment.currency,
            payment_date: today,
            mode: 'online',
            notes: 'Auto-logged demo payment',
            created_by: DIETITIAN_PROFILE_ID,
          });
          if (!paymentError) paymentsLogged++;
        }
      }
    }
  }

  return NextResponse.json({ ok: true, date: today, clientsProcessed: clients?.length ?? 0, metricsLogged, paymentsLogged });
}
