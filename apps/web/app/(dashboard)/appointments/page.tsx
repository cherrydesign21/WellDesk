import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import {
  zonedTimeToUtcIso,
  utcIsoToLocalDateKey,
  utcIsoToLocalTime,
  type AppointmentStatus,
  type AppointmentMode,
} from '@welldesk/shared';
import { NewAppointmentDialog } from '@/components/appointments/new-appointment-dialog';
import { AppointmentsCalendarView } from '@/components/appointments/appointments-calendar-view';
import { PendingRequestsList } from '@/components/appointments/pending-requests-list';
import type { AppointmentRow } from '@/lib/appointments-export';

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
    .select('id, client_id, starts_at, status, notes, mode, clients(full_name)')
    .gte('starts_at', rangeStart)
    .lte('starts_at', rangeEnd)
    .order('starts_at', { ascending: true });

  const { data: clients } = await supabase
    .from('clients')
    .select('id, full_name')
    .neq('status', 'archived')
    .order('full_name');

  const { data: requestedAppointments } = await supabase
    .from('appointments')
    .select('id, client_id, starts_at, status, notes, mode, clients(full_name)')
    .eq('status', 'requested')
    .order('starts_at', { ascending: true });

  type AppointmentJoined = {
    id: string;
    client_id: string;
    starts_at: string;
    status: AppointmentStatus;
    notes: string | null;
    mode: AppointmentMode;
    clients: { full_name: string } | { full_name: string }[] | null;
  };

  function toAppointmentRow(a: AppointmentJoined): AppointmentRow {
    const clientRel = Array.isArray(a.clients) ? a.clients[0] : a.clients;
    return {
      id: a.id,
      client_id: a.client_id,
      client_name: clientRel?.full_name ?? 'Unknown',
      local_date: utcIsoToLocalDateKey(a.starts_at, timezone),
      local_time: utcIsoToLocalTime(a.starts_at, timezone),
      status: a.status,
      notes: a.notes,
      mode: a.mode,
    };
  }

  const rows: AppointmentRow[] = ((appointments ?? []) as AppointmentJoined[]).map(toAppointmentRow);
  const pendingRequestRows: AppointmentRow[] = ((requestedAppointments ?? []) as AppointmentJoined[]).map(
    toAppointmentRow
  );

  const byDate: Record<string, AppointmentRow[]> = {};
  for (const row of rows) {
    (byDate[row.local_date] ??= []).push(row);
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

      <PendingRequestsList rows={pendingRequestRows} />

      <AppointmentsCalendarView
        weeks={weeks}
        byDate={byDate}
        todayLocalKey={todayLocalKey}
        monthLabel={monthLabel}
        prevMonth={prevMonth}
        nextMonth={nextMonth}
        rows={rows}
      />
    </div>
  );
}
