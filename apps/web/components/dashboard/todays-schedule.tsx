import Link from 'next/link';
import { Video, Users as UsersIcon, Phone, CalendarClock } from 'lucide-react';
import { APPOINTMENT_MODE_LABELS, type AppointmentMode } from '@welldesk/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

const MODE_ICONS = { video: Video, in_person: UsersIcon, phone: Phone } as const;

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
      <CardHeader>
        <CardTitle className="text-base">Today&apos;s Schedule</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {items.length === 0 ? (
          <EmptyState icon={CalendarClock} title="Nothing scheduled today" compact />
        ) : (
          items.map((item) => {
            const Icon = MODE_ICONS[item.mode];
            return (
              <Link
                key={item.id}
                href={`/clients/${item.clientId}`}
                className="flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted"
              >
                <span className="w-16 shrink-0 font-medium text-muted-foreground">{item.time}</span>
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-medium">{item.clientName}</span>
                  {item.purpose && <span className="text-muted-foreground"> — {item.purpose}</span>}
                </span>
                <span
                  className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground"
                  title={APPOINTMENT_MODE_LABELS[item.mode]}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
              </Link>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
