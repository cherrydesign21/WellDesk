import Link from 'next/link';
import { CalendarClock } from 'lucide-react';
import { APPOINTMENT_MODE_LABELS, type AppointmentMode } from '@welldesk/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

const MODE_BADGE_VARIANTS = { video: 'info', in_person: 'success', phone: 'warning' } as const;

const AVATAR_COLORS = [
  'bg-primary/15 text-primary',
  'bg-(--info-100) text-(--info-700)',
  'bg-(--success-100) text-(--success-700)',
  'bg-(--warning-100) text-(--warning-700)',
];

export type ScheduleItem = {
  id: string;
  clientId: string;
  clientName: string;
  time: string;
  purpose: string;
  mode: AppointmentMode;
};

export function TodaysSchedule({ items }: { items: ScheduleItem[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">Today&apos;s Schedule</CardTitle>
        <Link href="/appointments" className="text-sm font-medium text-(--success-700) hover:underline">
          View calendar
        </Link>
      </CardHeader>
      <CardContent className="space-y-1">
        {items.length === 0 ? (
          <EmptyState icon={CalendarClock} title="Nothing scheduled today" compact />
        ) : (
          items.map((item, i) => (
            <Link
              key={item.id}
              href={`/clients/${item.clientId}`}
              className="flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted"
            >
              <span className="w-16 shrink-0 font-medium text-muted-foreground">{item.time}</span>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}
              >
                {item.clientName.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 truncate">
                <span className="font-medium">{item.clientName}</span>
                {item.purpose && <span className="text-muted-foreground"> · {item.purpose}</span>}
              </span>
              <Badge variant={MODE_BADGE_VARIANTS[item.mode]} className="shrink-0">
                {APPOINTMENT_MODE_LABELS[item.mode]}
              </Badge>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
