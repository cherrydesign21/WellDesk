import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import {
  calculateBmi,
  calculateHealthScore,
  getEffectiveClientStatus,
  utcIsoToLocalDateKey,
  utcIsoToLocalTime,
  formatMoney,
} from '@welldesk/shared';
import { getFxRates } from '@/lib/fx-rates';
import { ExportMenu } from '@/components/ui/export-menu';
import { LogMetricDialog } from '@/components/metrics/log-metric-dialog';
import { MetricsChart } from '@/components/metrics/metrics-chart';
import { MetricsCompare } from '@/components/metrics/metrics-compare';
import { MetricsHistoryTable } from '@/components/metrics/metrics-history-table';
import { PlanTimelineCard } from '@/components/enrollments/plan-timeline-card';
import { LogPaymentDialog } from '@/components/payments/log-payment-dialog';
import { PaymentsHistoryTable } from '@/components/payments/payments-history-table';
import { AppointmentsList, type AppointmentRow } from '@/components/appointments/appointments-list';
import { ClientHeaderCard } from '@/components/clients/client-header-card';
import {
  HealthScoreCard,
  CurrentWeightCard,
  PaymentStatCard,
  NextAppointmentCard,
} from '@/components/clients/client-stat-cards';
import { ProgressPhotosCard } from '@/components/clients/progress-photos-card';
import { getProgressPhotos } from '@/lib/progress-photos-store';
import type { MetricRow } from '@/components/metrics/types';

const PAYMENT_EXPORT_HEADERS = ['Date', 'Amount', 'Mode', 'Reference', 'Plan Period'];

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
    .select('id, full_name, phone, email, status, gender, dob, photo_url, user_id, created_at')
    .eq('id', clientId)
    .single();

  if (!client) notFound();

  // Queried separately so a not-yet-migrated diet_type column can't 404 the
  // whole client page — falls back to null if it fails.
  const { data: dietTypeRow } = await supabase.from('clients').select('diet_type').eq('id', clientId).maybeSingle();

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('id, cycle_number, plan_type, start_date, expiry_date, status, plan_amount')
    .eq('client_id', clientId)
    .order('cycle_number', { ascending: false });

  const latestEnrollment = enrollments?.[0] ?? null;
  const effectiveStatus = getEffectiveClientStatus(client.status, latestEnrollment);

  const { data: payments } = await supabase
    .from('payments')
    .select('id, amount, currency, payment_date, mode, reference_no, notes, enrollment_id')
    .eq('client_id', clientId)
    .order('payment_date', { ascending: false });

  const enrollmentById = new Map((enrollments ?? []).map((e) => [e.id, e]));
  const paymentRows = (payments ?? []).map((p) => {
    const enrollment = p.enrollment_id ? enrollmentById.get(p.enrollment_id) : undefined;
    return {
      ...p,
      plan_start: enrollment?.start_date ?? null,
      plan_end: enrollment?.expiry_date ?? null,
    };
  });

  const progressPhotos = await getProgressPhotos(supabase, clientId);

  const { data: paymentSummary } = latestEnrollment
    ? await supabase
        .from('v_enrollment_payment_status')
        .select('plan_amount, amount_paid, amount_due, payment_status, currency')
        .eq('enrollment_id', latestEnrollment.id)
        .single()
    : { data: null };

  const rates = await getFxRates();

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
  const weighedRows = rows.filter((r) => r.weight_kg != null);
  const latestWeightKg = weighedRows[weighedRows.length - 1]?.weight_kg ?? null;
  const previousWeightKg = weighedRows[weighedRows.length - 2]?.weight_kg ?? null;
  const startingWeightKg = weighedRows[0]?.weight_kg ?? null;
  const targetWeightKg = [...rows].reverse().find((r) => r.target_weight_kg != null)?.target_weight_kg ?? null;

  const currentVisit = rows[rows.length - 1] ?? null;
  const previousVisit = rows[rows.length - 2] ?? null;
  const beforePreviousVisit = rows[rows.length - 3] ?? null;
  const healthScore = calculateHealthScore({
    latest: currentVisit
      ? {
          systolicBp: currentVisit.systolic_bp,
          diastolicBp: currentVisit.diastolic_bp,
          bloodSugarFasting: currentVisit.blood_sugar_fasting,
          weightKg: currentVisit.weight_kg,
        }
      : null,
    previousWeightKg: previousVisit?.weight_kg ?? null,
    targetWeightKg: currentVisit?.target_weight_kg ?? null,
  });
  const previousHealthScore = calculateHealthScore({
    latest: previousVisit
      ? {
          systolicBp: previousVisit.systolic_bp,
          diastolicBp: previousVisit.diastolic_bp,
          bloodSugarFasting: previousVisit.blood_sugar_fasting,
          weightKg: previousVisit.weight_kg,
        }
      : null,
    previousWeightKg: beforePreviousVisit?.weight_kg ?? null,
    targetWeightKg: previousVisit?.target_weight_kg ?? null,
  });
  const healthScoreDelta =
    healthScore !== null && previousHealthScore !== null ? healthScore - previousHealthScore : null;

  const timezone = result.profile.practices?.timezone ?? 'Asia/Kolkata';
  const currency = result.profile.practices?.currency ?? 'INR';
  const { data: appointments } = await supabase
    .from('appointments')
    .select('id, client_id, starts_at, status, notes, mode')
    .eq('client_id', clientId)
    .order('starts_at', { ascending: false });

  const appointmentRows: AppointmentRow[] = (appointments ?? []).map((a) => ({
    id: a.id,
    client_id: a.client_id,
    client_name: client.full_name,
    local_date: utcIsoToLocalDateKey(a.starts_at, timezone),
    local_time: utcIsoToLocalTime(a.starts_at, timezone),
    status: a.status,
    notes: a.notes,
    mode: a.mode,
  }));

  // appointmentRows is newest-first; reverse the upcoming subset so the
  // soonest appointment shows first, while visit history stays newest-first.
  const upcomingAppointmentRows = appointmentRows.filter((r) => r.status === 'scheduled').reverse();
  const visitHistoryRows = appointmentRows.filter((r) => r.status !== 'scheduled');

  const nowIso = new Date().toISOString();
  const nextAppointmentRow = (appointments ?? [])
    .filter((a) => a.status === 'scheduled' && a.starts_at >= nowIso)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0];

  let nextAppointment: { dateLabel: string; timeLabel: string } | null = null;
  if (nextAppointmentRow) {
    const dateKey = utcIsoToLocalDateKey(nextAppointmentRow.starts_at, timezone);
    const todayKey = utcIsoToLocalDateKey(nowIso, timezone);
    const tomorrow = new Date(nowIso);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowKey = utcIsoToLocalDateKey(tomorrow.toISOString(), timezone);
    const dateLabel = dateKey === todayKey ? 'Today' : dateKey === tomorrowKey ? 'Tomorrow' : dateKey;
    nextAppointment = { dateLabel, timeLabel: utcIsoToLocalTime(nextAppointmentRow.starts_at, timezone) };
  }

  const { data: currentDietPlan } = await supabase
    .from('diet_plans')
    .select('id, name')
    .eq('client_id', clientId)
    .eq('is_template', false)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <Link
        href="/clients"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to clients
      </Link>

      <ClientHeaderCard
        client={{ ...client, diet_type: dietTypeRow?.diet_type ?? null }}
        effectiveStatus={effectiveStatus}
        statusVariant={statusVariant(effectiveStatus)}
        memberSince={new Date(client.created_at).toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' })}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <HealthScoreCard score={healthScore} delta={healthScoreDelta} />
        <CurrentWeightCard
          currentWeightKg={latestWeightKg}
          previousWeightKg={previousWeightKg}
          targetWeightKg={targetWeightKg}
          startingWeightKg={startingWeightKg}
        />
        <PaymentStatCard
          summary={paymentSummary}
          displayCurrency={currency}
          rates={rates}
          renewsOn={
            latestEnrollment
              ? new Date(latestEnrollment.expiry_date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : null
          }
        />
        <NextAppointmentCard
          dateLabel={nextAppointment?.dateLabel ?? null}
          timeLabel={nextAppointment?.timeLabel ?? null}
          dietitianName={result.profile.full_name}
        />
      </div>

      <MetricsChart rows={rows} />
      <MetricsCompare rows={rows} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PlanTimelineCard
          clientId={client.id}
          enrollments={enrollments ?? []}
          nextAppointment={nextAppointment}
          currentDietPlan={currentDietPlan}
        />

        <div>
          <MetricsHistoryTable clientId={client.id} rows={rows} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div>
            <h2 className="mb-3 text-lg font-medium">Upcoming Appointments</h2>
            <AppointmentsList rows={upcomingAppointmentRows} emptyStateTitle="No upcoming appointments" />
          </div>

          <div>
            <h2 className="mb-3 text-lg font-medium">Visit History</h2>
            <AppointmentsList rows={visitHistoryRows} emptyStateTitle="No visit history yet" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Payments</h2>
            <div className="flex items-center gap-2">
              <Link
                href={`/clients/${client.id}/payments`}
                className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                View all
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <ExportMenu
                filenameBase={`payments-${client.full_name}`}
                title={`Payments — ${client.full_name}`}
                headers={PAYMENT_EXPORT_HEADERS}
                rows={(paymentRows ?? []).map((p) => [
                  p.payment_date,
                  formatMoney(p.amount, p.currency, currency, rates),
                  p.mode,
                  p.reference_no ?? '—',
                  p.plan_start && p.plan_end ? `${p.plan_start} to ${p.plan_end}` : '—',
                ])}
              />
              <LogPaymentDialog clientId={client.id} />
            </div>
          </div>
          <PaymentsHistoryTable
            clientId={client.id}
            rows={paymentRows}
            showReference={false}
            displayCurrency={currency}
            rates={rates}
          />
        </div>
      </div>

      <ProgressPhotosCard clientId={client.id} practiceId={result.profile.practice_id} initialPhotos={progressPhotos} />

      <div className="flex justify-end">
        <LogMetricDialog clientId={client.id} />
      </div>
    </div>
  );
}
