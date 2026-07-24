import { Users, CalendarClock, Wallet, PackageOpen, type LucideIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import {
  getEffectiveClientStatus,
  utcIsoToLocalDateKey,
  utcIsoToLocalTime,
  PLAN_TYPE_LABELS,
  type ClientStatus,
  type AppointmentMode,
} from '@welldesk/shared';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { TodaysSchedule, type ScheduleItem } from '@/components/dashboard/todays-schedule';
import { NeedsAttention, type AttentionItem } from '@/components/dashboard/needs-attention';
import { ClientProgressTable, type ProgressRow } from '@/components/dashboard/client-progress-table';
import { QuickActionsRow } from '@/components/dashboard/quick-actions';

type Enrollment = { plan_type: string; expiry_date: string; status: string; cycle_number: number };
type ClientLite = {
  id: string;
  full_name: string;
  status: string;
  photo_url: string | null;
  created_at: string;
  enrollments: Enrollment[];
};

function latestEnrollment(enrollments: Enrollment[]) {
  return [...(enrollments ?? [])].sort((a, b) => b.cycle_number - a.cycle_number)[0];
}

function getGreeting(hour: number) {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const STAT_ICON_CLASSES = {
  primary: 'bg-primary/15 text-primary',
  warning: 'bg-warning/15 text-(--warning-700)',
  success: 'bg-success/15 text-(--success-700)',
  info: 'bg-info/15 text-(--info-700)',
} as const;

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
  prefix,
  badge,
  badgeTone,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone: keyof typeof STAT_ICON_CLASSES;
  prefix?: string;
  badge?: string;
  badgeTone?: 'success' | 'info' | 'warning' | 'destructive';
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between py-4">
        <div>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${STAT_ICON_CLASSES[tone]}`}>
            <Icon className="h-5 w-5" />
          </div>
          <p className="mt-3 text-2xl font-semibold">
            {prefix}
            <AnimatedCounter value={value} />
          </p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
        {badge && (
          <Badge variant={badgeTone ?? 'success'} className="shrink-0">
            {badge}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const result = await getCurrentProfile(supabase);
  if (!result) return null;

  const firstName = result.profile.full_name.trim().split(/\s+/)[0] ?? '';
  const timezone = result.profile.practices?.timezone ?? 'Asia/Kolkata';

  const nowLocalHour = Number(
    new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: timezone }).format(new Date())
  );
  const todayLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: timezone,
  }).format(new Date());

  const { data: clientsRaw } = await supabase
    .from('clients')
    .select('id, full_name, status, photo_url, created_at, enrollments(plan_type, expiry_date, status, cycle_number)');

  const clients = (clientsRaw ?? []) as ClientLite[];

  const { data: metricsRaw } = await supabase
    .from('health_metrics')
    .select('client_id, recorded_at, weight_kg')
    .order('recorded_at', { ascending: false });

  const metricsByClient = new Map<string, { recorded_at: string; weight_kg: number | null }[]>();
  for (const m of metricsRaw ?? []) {
    const list = metricsByClient.get(m.client_id) ?? [];
    if (list.length < 2) list.push(m);
    metricsByClient.set(m.client_id, list);
  }

  const activeClients = clients.filter(
    (c) => getEffectiveClientStatus(c.status as ClientStatus, latestEnrollment(c.enrollments)) === 'active'
  );

  const in7Days = new Date();
  in7Days.setDate(in7Days.getDate() + 7);
  const in7DaysStr = in7Days.toISOString().slice(0, 10);

  const expiringSoon = activeClients.filter((c) => {
    const enrollment = latestEnrollment(c.enrollments);
    return enrollment && enrollment.status === 'active' && enrollment.expiry_date <= in7DaysStr;
  });

  const now = new Date();
  const nowMs = now.getTime();
  const currentMonthKey = now.toISOString().slice(0, 7);
  const newThisMonth = clients.filter((c) => c.created_at?.slice(0, 7) === currentMonthKey).length;

  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const firstOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);

  const [{ data: monthPayments }, { data: prevMonthPayments }] = await Promise.all([
    supabase.from('payments').select('amount').gte('payment_date', firstOfMonth),
    supabase.from('payments').select('amount').gte('payment_date', firstOfPrevMonth).lt('payment_date', firstOfMonth),
  ]);
  const revenueThisMonth = (monthPayments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  const revenuePrevMonth = (prevMonthPayments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  const revenueChangePct =
    revenuePrevMonth > 0 ? Math.round(((revenueThisMonth - revenuePrevMonth) / revenuePrevMonth) * 100) : null;

  const { data: overdueRows } = await supabase
    .from('v_enrollment_payment_status')
    .select('client_id, amount_due')
    .eq('payment_status', 'overdue');

  const clientNameById = new Map(clients.map((c) => [c.id, c.full_name]));

  const todayLocalKey = utcIsoToLocalDateKey(new Date().toISOString(), timezone);

  const { data: upcomingAppointments } = await supabase
    .from('appointments')
    .select('id, client_id, starts_at, notes, mode, clients(full_name)')
    .eq('status', 'scheduled')
    .order('starts_at', { ascending: true });

  type AppointmentJoined = {
    id: string;
    client_id: string;
    starts_at: string;
    notes: string | null;
    mode: AppointmentMode;
    clients: { full_name: string } | { full_name: string }[] | null;
  };

  const todaysAppointments: ScheduleItem[] = ((upcomingAppointments ?? []) as AppointmentJoined[])
    .filter((a) => utcIsoToLocalDateKey(a.starts_at, timezone) === todayLocalKey)
    .map((a) => {
      const clientRel = Array.isArray(a.clients) ? a.clients[0] : a.clients;
      return {
        id: a.id,
        clientId: a.client_id,
        clientName: clientRel?.full_name ?? 'Unknown',
        time: utcIsoToLocalTime(a.starts_at, timezone),
        purpose: a.notes ?? '',
        mode: a.mode,
      };
    });

  const videoAppointmentsToday = todaysAppointments.filter((a) => a.mode === 'video').length;

  // Needs Attention: merge expiring plans, stale check-ins, and overdue
  // payments into one urgency-sorted feed (expiring first, then overdue,
  // then inactivity — roughly time-to-impact order).
  const attentionItems: AttentionItem[] = [];

  for (const c of expiringSoon) {
    const enrollment = latestEnrollment(c.enrollments);
    attentionItems.push({
      id: `expiring-${c.id}`,
      clientId: c.id,
      clientName: c.full_name,
      reason: `Plan expires ${enrollment?.expiry_date}`,
      kind: 'expiring',
    });
  }

  for (const row of overdueRows ?? []) {
    attentionItems.push({
      id: `overdue-${row.client_id}`,
      clientId: row.client_id,
      clientName: clientNameById.get(row.client_id) ?? 'Unknown',
      reason: `Payment of ₹${Number(row.amount_due).toLocaleString('en-IN')} overdue`,
      kind: 'overdue',
    });
  }

  const inactiveCutoff = new Date();
  inactiveCutoff.setDate(inactiveCutoff.getDate() - 14);
  const inactiveCutoffIso = inactiveCutoff.toISOString();

  for (const c of activeClients) {
    const lastVisit = metricsByClient.get(c.id)?.[0]?.recorded_at;
    if (!lastVisit || lastVisit < inactiveCutoffIso) {
      const days = lastVisit ? Math.floor((nowMs - new Date(lastVisit).getTime()) / 86400000) : null;
      attentionItems.push({
        id: `inactive-${c.id}`,
        clientId: c.id,
        clientName: c.full_name,
        reason: days !== null ? `No check-in for ${days} days` : 'Never checked in',
        kind: 'inactive',
      });
    }
  }

  // Client Progress: Plan = active enrollment's plan type; Adherence = a
  // recency-based check-in proxy (we don't track a real compliance metric);
  // Trend = latest-vs-previous logged weight direction + magnitude.
  const progressRows: ProgressRow[] = activeClients.map((c) => {
    const enrollment = latestEnrollment(c.enrollments);
    const history = metricsByClient.get(c.id) ?? [];
    const lastVisit = history[0]?.recorded_at;

    let adherence: ProgressRow['adherence'] = 'at_risk';
    let adherencePct = 15;
    if (lastVisit) {
      const daysSince = (nowMs - new Date(lastVisit).getTime()) / 86400000;
      if (daysSince <= 7) {
        adherence = 'on_track';
        adherencePct = 90;
      } else if (daysSince <= 21) {
        adherence = 'slipping';
        adherencePct = 50;
      }
    }

    let trend: ProgressRow['trend'] = null;
    let trendKg: number | null = null;
    if (history.length === 2 && history[0].weight_kg != null && history[1].weight_kg != null) {
      const diff = Math.round((history[0].weight_kg - history[1].weight_kg) * 10) / 10;
      trend = diff < 0 ? 'down' : diff > 0 ? 'up' : 'flat';
      trendKg = Math.abs(diff);
    }

    return {
      id: c.id,
      name: c.full_name,
      photoUrl: c.photo_url,
      plan: enrollment ? (PLAN_TYPE_LABELS[enrollment.plan_type as keyof typeof PLAN_TYPE_LABELS] ?? '—') : '—',
      adherence,
      adherencePct,
      lastLogLabel: lastVisit ? lastVisit.slice(0, 10) : 'Never',
      trend,
      trendKg,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {firstName ? `${getGreeting(nowLocalHour)}, ${firstName}` : 'Dashboard'}
        </h1>
        <p className="text-sm text-muted-foreground">{todayLabel} — here&apos;s what&apos;s happening today</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Active Clients"
          value={activeClients.length}
          icon={Users}
          tone="primary"
          badge={newThisMonth > 0 ? `+${newThisMonth} this mo.` : undefined}
          badgeTone="success"
        />
        <StatCard
          label="Today's Appointments"
          value={todaysAppointments.length}
          icon={CalendarClock}
          tone="info"
          badge={videoAppointmentsToday > 0 ? `${videoAppointmentsToday} video` : undefined}
          badgeTone="info"
        />
        <StatCard
          label="Revenue This Month"
          value={revenueThisMonth}
          icon={Wallet}
          tone="success"
          prefix="₹"
          badge={revenueChangePct !== null ? `${revenueChangePct >= 0 ? '+' : ''}${revenueChangePct}%` : undefined}
          badgeTone={revenueChangePct !== null && revenueChangePct < 0 ? 'destructive' : 'success'}
        />
        <StatCard
          label="Packages Expiring Soon"
          value={expiringSoon.length}
          icon={PackageOpen}
          tone="warning"
          badge={expiringSoon.length > 0 ? 'Act soon' : undefined}
          badgeTone="destructive"
        />
      </div>

      <QuickActionsRow
        practiceId={result.profile.practice_id}
        clients={clients.map((c) => ({ id: c.id, full_name: c.full_name }))}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <TodaysSchedule items={todaysAppointments} />
        <NeedsAttention items={attentionItems} />
      </div>

      <ClientProgressTable rows={progressRows} />
    </div>
  );
}
