import Link from 'next/link';
import { Heart, Scale, Wallet, CalendarClock, ArrowDown, ArrowUp } from 'lucide-react';
import { healthScoreLabel } from '@welldesk/shared';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProgressRing } from '@/components/ui/progress-ring';

function CardIcon({ tone, children }: { tone: 'danger' | 'info' | 'success' | 'warning'; children: React.ReactNode }) {
  const toneClasses = {
    danger: 'bg-destructive/15 text-destructive',
    info: 'bg-info/15 text-(--info-700)',
    success: 'bg-success/15 text-(--success-700)',
    warning: 'bg-warning/15 text-(--warning-700)',
  } as const;
  return (
    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${toneClasses[tone]}`}>
      {children}
    </div>
  );
}

export function HealthScoreCard({ score, delta }: { score: number | null; delta: number | null }) {
  if (score === null) {
    return (
      <Card>
        <CardContent className="py-4">
          <CardIcon tone="danger">
            <Heart className="h-4.5 w-4.5" />
          </CardIcon>
          <p className="mt-3 text-xs text-muted-foreground">Health Score</p>
          <p className="text-sm text-muted-foreground">Log a visit to see this</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex items-start justify-between py-4">
        <div>
          <CardIcon tone="danger">
            <Heart className="h-4.5 w-4.5" />
          </CardIcon>
          <p className="mt-3 text-xs text-muted-foreground">Health Score</p>
          <p className="text-2xl font-semibold">{score}</p>
          <p className="text-xs font-medium text-(--success-700)">{healthScoreLabel(score)}</p>
          {delta !== null && delta !== 0 && (
            <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              {delta > 0 ? (
                <ArrowUp className="h-3 w-3 text-(--success-700)" />
              ) : (
                <ArrowDown className="h-3 w-3 text-destructive" />
              )}
              {Math.abs(delta)} points from last visit
            </p>
          )}
        </div>
        <ProgressRing value={score} size={56} strokeWidth={5} />
      </CardContent>
    </Card>
  );
}

export function CurrentWeightCard({
  currentWeightKg,
  previousWeightKg,
  targetWeightKg,
  startingWeightKg,
}: {
  currentWeightKg: number | null;
  previousWeightKg: number | null;
  targetWeightKg: number | null;
  startingWeightKg: number | null;
}) {
  if (currentWeightKg === null) {
    return (
      <Card>
        <CardContent className="py-4">
          <CardIcon tone="info">
            <Scale className="h-4.5 w-4.5" />
          </CardIcon>
          <p className="mt-3 text-xs text-muted-foreground">Current Weight</p>
          <p className="text-sm text-muted-foreground">No weight logged yet</p>
        </CardContent>
      </Card>
    );
  }

  const delta = previousWeightKg !== null ? Math.round((currentWeightKg - previousWeightKg) * 10) / 10 : null;
  let progressPct: number | null = null;
  if (targetWeightKg !== null && startingWeightKg !== null && startingWeightKg !== targetWeightKg) {
    progressPct = Math.round(
      Math.max(0, Math.min(1, (startingWeightKg - currentWeightKg) / (startingWeightKg - targetWeightKg))) * 100
    );
  }

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-start justify-between">
          <div>
            <CardIcon tone="info">
              <Scale className="h-4.5 w-4.5" />
            </CardIcon>
            <p className="mt-3 text-xs text-muted-foreground">Current Weight</p>
            <p className="text-2xl font-semibold">{currentWeightKg} kg</p>
            {delta !== null && delta !== 0 && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                {delta < 0 ? (
                  <ArrowDown className="h-3 w-3 text-(--success-700)" />
                ) : (
                  <ArrowUp className="h-3 w-3 text-(--warning-700)" />
                )}
                {Math.abs(delta)} vs last visit
              </p>
            )}
          </div>
          {targetWeightKg !== null && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Goal: {targetWeightKg} kg</p>
              {progressPct !== null && <p className="text-xs font-medium">{progressPct}%</p>}
            </div>
          )}
        </div>
        {progressPct !== null && (
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-info" style={{ width: `${progressPct}%` }} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PaymentStatCard({
  summary,
  renewsOn,
}: {
  summary: { plan_amount: number; amount_paid: number; amount_due: number; payment_status: string } | null;
  renewsOn: string | null;
}) {
  if (!summary) {
    return (
      <Card>
        <CardContent className="py-4">
          <CardIcon tone="warning">
            <Wallet className="h-4.5 w-4.5" />
          </CardIcon>
          <p className="mt-3 text-xs text-muted-foreground">Payments</p>
          <p className="text-sm text-muted-foreground">No active plan</p>
        </CardContent>
      </Card>
    );
  }

  const variant =
    summary.payment_status === 'paid'
      ? 'success'
      : summary.payment_status === 'partial'
        ? 'warning'
        : summary.payment_status === 'overdue'
          ? 'destructive'
          : 'outline';

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-start justify-between">
          <CardIcon tone="warning">
            <Wallet className="h-4.5 w-4.5" />
          </CardIcon>
          <Badge variant={variant} className="capitalize">
            {summary.payment_status}
          </Badge>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Payments</p>
        <p className="text-2xl font-semibold">₹{summary.amount_paid.toLocaleString('en-IN')}</p>
        <p className="text-xs text-muted-foreground">Plan: ₹{summary.plan_amount.toLocaleString('en-IN')}</p>
        {renewsOn && <p className="text-xs text-muted-foreground">Renews on {renewsOn}</p>}
      </CardContent>
    </Card>
  );
}

export function NextAppointmentCard({
  dateLabel,
  timeLabel,
  dietitianName,
}: {
  dateLabel: string | null;
  timeLabel: string | null;
  dietitianName: string;
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <CardIcon tone="success">
          <CalendarClock className="h-4.5 w-4.5" />
        </CardIcon>
        <p className="mt-3 text-xs text-muted-foreground">Next Appointment</p>
        {dateLabel ? (
          <>
            <p className="text-lg font-semibold">{dateLabel}</p>
            <p className="text-sm text-muted-foreground">{timeLabel}</p>
            <p className="text-xs text-muted-foreground">With {dietitianName}</p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Nothing scheduled</p>
        )}
        <Button
          variant="outline"
          size="sm"
          className="mt-3 w-full"
          render={<Link href="/appointments" />}
        >
          View Schedule
        </Button>
      </CardContent>
    </Card>
  );
}
