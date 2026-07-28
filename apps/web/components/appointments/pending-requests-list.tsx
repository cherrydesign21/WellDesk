'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';
import { APPOINTMENT_MODE_LABELS } from '@welldesk/shared';
import { updateAppointmentStatus } from '@/app/(dashboard)/appointments/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { AppointmentRow } from '@/lib/appointments-export';

export function PendingRequestsList({ rows }: { rows: AppointmentRow[] }) {
  const [isPending, startTransition] = useTransition();

  if (rows.length === 0) return null;

  function handle(id: string, status: 'scheduled' | 'cancelled') {
    startTransition(async () => {
      const result = await updateAppointmentStatus(id, status);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(status === 'scheduled' ? 'Appointment confirmed' : 'Request declined');
    });
  }

  return (
    <Card className="border-warning/40 bg-warning/5">
      <CardContent className="space-y-3 py-4">
        <p className="text-sm font-medium">Pending Requests ({rows.length})</p>
        <div className="space-y-2">
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-card p-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{row.client_name}</p>
                <p className="text-xs text-muted-foreground">
                  {row.local_date} · {row.local_time} · {APPOINTMENT_MODE_LABELS[row.mode]}
                </p>
                {row.notes && <p className="mt-1 text-xs text-muted-foreground">{row.notes}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button size="sm" disabled={isPending} onClick={() => handle(row.id, 'scheduled')}>
                  <Check className="h-3.5 w-3.5" />
                  Confirm
                </Button>
                <Button variant="outline" size="sm" disabled={isPending} onClick={() => handle(row.id, 'cancelled')}>
                  <X className="h-3.5 w-3.5" />
                  Decline
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
