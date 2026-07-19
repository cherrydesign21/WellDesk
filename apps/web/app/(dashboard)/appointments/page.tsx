import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { zonedTimeToUtcIso, utcIsoToLocalDateKey, utcIsoToLocalTime, type AppointmentStatus } from '@welldesk/shared';
import { NewAppointmentDialog } from '@/components/appointments/new-appointment-dialog';
import { AppointmentsList, type AppointmentRow } from '@/components/appointments/appointments-list';
import { Button } from '@/components/ui/button';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function dateKey(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function getMonthGrid(year: number, month: number) {
  const startDow = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const daysInPrevMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const cells: { day: number; inMonth: boolean; key: string }[] = [];

  for (let i = startDow - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    cells.push({ day, inMonth: false, key: dateKey(y, m, day) });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, inMonth: true, key: dateKey(year, month, day) });
  }
  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    const m = month === 11 ? 0 : month + 1;
    const y = month === 11 ? year + 1 : year;
    cells.push({ day: nextDay, inMonth: false, key: dateKey(y, m, nextDay) });
    nextDay++;
  }

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
  const supabase = await createClient();
  const result = await getCurrentProfile(supabase);
  if (!result) return null;

  const timezone = result.profile.practices?.timezone ?? 'Asia/Kolkata';
  const todayLocalKey = utcIsoToLocalDateKey(new Date().toISOString(), timezone);
  const [todayYear, todayMonth] = todayLocalKey.split('-').map(Number);

  const [year, month] = monthParam
    ? monthParam.split('-').map(Number)
    : [todayYear, todayMonth];
  const monthIndex = month - 1;

  const weeks = getMonthGrid(year, monthIndex);
  const rangeStart = zonedTimeToUtcIso(weeks[0][0].key, '00:00', timezone);
  const rangeEnd = zonedTimeToUtcIso(weeks[weeks.length - 1][6].key, '23:59', timezone);

  const { data: appointments } = await supabase
    .from('appointments')
    .select('id, client_id, starts_at, status, notes, clients(full_name)')
    .gte('starts_at', rangeStart)
    .lte('starts_at', rangeEnd)
    .order('starts_at', { ascending: true });

  const { data: clients } = await supabase
    .from('clients')
    .select('id, full_name')
    .neq('status', 'archived')
    .order('full_name');

  type AppointmentJoined = {
    id: string;
    client_id: string;
    starts_at: string;
    status: AppointmentStatus;
    notes: string | null;
    clients: { full_name: string } | { full_name: string }[] | null;
  };

  const rows: AppointmentRow[] = ((appointments ?? []) as AppointmentJoined[]).map((a) => {
    const clientRel = Array.isArray(a.clients) ? a.clients[0] : a.clients;
    return {
      id: a.id,
      client_id: a.client_id,
      client_name: clientRel?.full_name ?? 'Unknown',
      local_date: utcIsoToLocalDateKey(a.starts_at, timezone),
      local_time: utcIsoToLocalTime(a.starts_at, timezone),
      status: a.status,
      notes: a.notes,
    };
  });

  const byDate = new Map<string, AppointmentRow[]>();
  for (const row of rows) {
    const list = byDate.get(row.local_date) ?? [];
    list.push(row);
    byDate.set(row.local_date, list);
  }

  const prevMonth = monthIndex === 0 ? `${year - 1}-12` : `${year}-${pad(monthIndex)}`;
  const nextMonth = monthIndex === 11 ? `${year + 1}-01` : `${year}-${pad(monthIndex + 2)}`;
  const monthLabel = new Date(Date.UTC(year, monthIndex, 1)).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Appointments</h1>
          <p className="text-sm text-muted-foreground">{rows.length} this month</p>
        </div>
        <NewAppointmentDialog clients={clients ?? []} defaultDate={todayLocalKey} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon" render={<Link href={`/appointments?month=${prevMonth}`} />}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-medium">{monthLabel}</h2>
            <Button variant="outline" size="icon" render={<Link href={`/appointments?month=${nextMonth}`} />}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-md border bg-border text-sm">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="bg-muted/50 p-2 text-center text-xs font-medium text-muted-foreground">
                {d}
              </div>
            ))}
            {weeks.flatMap((week, wi) =>
              week.map((cell, di) => {
                const dayAppointments = byDate.get(cell.key) ?? [];
                const isToday = cell.key === todayLocalKey;
                return (
                  <div
                    key={`${wi}-${di}`}
                    className={`min-h-20 bg-background p-1.5 ${cell.inMonth ? '' : 'opacity-40'}`}
                  >
                    <p className={`mb-1 text-xs ${isToday ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                      {cell.day}
                    </p>
                    <div className="space-y-0.5">
                      {dayAppointments.slice(0, 2).map((a) => (
                        <p key={a.id} className="truncate rounded bg-muted px-1 py-0.5 text-[11px]">
                          {a.local_time} {a.client_name}
                        </p>
                      ))}
                      {dayAppointments.length > 2 && (
                        <p className="text-[11px] text-muted-foreground">+{dayAppointments.length - 2} more</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-medium">This month&apos;s list</h2>
          <AppointmentsList rows={rows} />
        </div>
      </div>
    </div>
  );
}
