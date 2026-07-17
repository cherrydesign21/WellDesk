import { PLAN_TYPE_LABELS, getEffectiveEnrollmentStatus } from '@welldesk/shared';
import { Badge } from '@/components/ui/badge';
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

export function EnrollmentTimeline({ clientId, enrollments }: { clientId: string; enrollments: EnrollmentRow[] }) {
  const sorted = [...enrollments].sort((a, b) => b.cycle_number - a.cycle_number);
  const latest = sorted[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Enrollment Timeline</h2>
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
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">No enrollment cycles yet.</p>
      ) : (
        <div className="space-y-3">
          {sorted.map((e) => {
            const status = getEffectiveEnrollmentStatus(e);
            return (
              <div key={e.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">
                    Cycle {e.cycle_number} — {PLAN_TYPE_LABELS[e.plan_type as keyof typeof PLAN_TYPE_LABELS]}
                  </p>
                  <Badge variant={statusVariant(status)} className="capitalize">
                    {status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {e.start_date} → {e.expiry_date}
                  {e.plan_amount ? ` · ${e.plan_amount}` : ''}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
