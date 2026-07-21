import Link from 'next/link';
import { Check, CalendarDays } from 'lucide-react';
import { PLAN_TYPE_LABELS, getEffectiveEnrollmentStatus, todayISO } from '@welldesk/shared';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PauseResumeButton } from './pause-resume-button';
import { RestartPlanDialog } from './restart-plan-dialog';

type EnrollmentRow = {
  id: string;
  cycle_number: number;
  plan_type: string;
  start_date: string;
  expiry_date: string;
  status: string;
  plan_amount: number;
};

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

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function buildCheckpoints(startDate: string, expiryDate: string) {
  const start = new Date(startDate);
  const end = new Date(expiryDate);
  const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
  const totalMonths = Math.min(4, Math.max(1, Math.round(totalDays / 30)));

  const checkpoints: { label: string; date: Date }[] = [{ label: 'Start', date: start }];
  for (let i = 1; i < totalMonths; i++) {
    const d = new Date(start.getTime() + Math.round((totalDays / totalMonths) * i) * 86400000);
    checkpoints.push({ label: `Month ${i}`, date: d });
  }
  checkpoints.push({ label: 'End', date: end });
  return checkpoints;
}

export function PlanTimelineCard({
  clientId,
  enrollments,
  nextAppointment,
  currentDietPlan,
}: {
  clientId: string;
  enrollments: EnrollmentRow[];
  nextAppointment: { dateLabel: string; timeLabel: string } | null;
  currentDietPlan: { id: string; name: string } | null;
}) {
  const sorted = [...enrollments].sort((a, b) => b.cycle_number - a.cycle_number);
  const latest = sorted[0];

  const checkpoints = latest ? buildCheckpoints(latest.start_date, latest.expiry_date) : [];
  const today = new Date(todayISO());
  const activeIndex = checkpoints.reduce(
    (acc, cp, i) => (cp.date <= today ? i : acc),
    0
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Appointment &amp; Plan</CardTitle>
        <div className="flex items-center gap-2">
          {latest && (
            <PauseResumeButton
              clientId={clientId}
              enrollmentId={latest.id}
              status={getEffectiveEnrollmentStatus(latest)}
            />
          )}
          <RestartPlanDialog clientId={clientId} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 rounded-lg border p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/15 text-(--success-700)">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Upcoming Appointment</p>
            {nextAppointment ? (
              <>
                <p className="text-sm font-semibold">{nextAppointment.dateLabel}</p>
                <p className="text-xs text-muted-foreground">{nextAppointment.timeLabel}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Nothing scheduled</p>
            )}
          </div>
        </div>

        {!latest ? (
          <EmptyState icon={CalendarDays} title="No enrollment cycles yet" compact />
        ) : (
          <div className="rounded-lg border p-3">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium">
                Cycle {latest.cycle_number} — {PLAN_TYPE_LABELS[latest.plan_type as keyof typeof PLAN_TYPE_LABELS]}
              </p>
              <Badge variant={statusVariant(getEffectiveEnrollmentStatus(latest))} className="capitalize">
                {getEffectiveEnrollmentStatus(latest)}
              </Badge>
            </div>
            <div className="relative flex items-center justify-between px-1">
              <div className="absolute top-1.5 right-4 left-4 h-0.5 bg-muted" />
              <div
                className="absolute top-1.5 left-4 h-0.5 bg-success transition-all"
                style={{
                  width: `calc(${(activeIndex / Math.max(1, checkpoints.length - 1)) * 100}% - ${
                    (activeIndex / Math.max(1, checkpoints.length - 1)) * 32
                  }px)`,
                }}
              />
              {checkpoints.map((cp, i) => (
                <div key={cp.label} className="relative z-10 flex flex-col items-center gap-1.5">
                  <div
                    className={`flex h-3.5 w-3.5 items-center justify-center rounded-full ${
                      i < activeIndex
                        ? 'bg-success text-white'
                        : i === activeIndex
                          ? 'bg-success ring-4 ring-success/20'
                          : 'bg-muted ring-1 ring-border'
                    }`}
                  >
                    {i < activeIndex && <Check className="h-2.5 w-2.5" />}
                  </div>
                  <div className="text-center">
                    <p className={`text-[11px] ${i === activeIndex ? 'font-semibold' : 'text-muted-foreground'}`}>
                      {shortDate(cp.date.toISOString())}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{cp.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-xs text-muted-foreground">Diet Plan</p>
            <p className="text-sm font-medium">{currentDietPlan?.name ?? 'No active plan'}</p>
          </div>
          {currentDietPlan && (
            <Link
              href={`/clients/${clientId}/diet-plans/${currentDietPlan.id}`}
              className="text-sm font-medium text-primary hover:underline"
            >
              View Plan →
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
