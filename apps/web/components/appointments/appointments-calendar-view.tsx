'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExportMenu } from '@/components/ui/export-menu';
import { AppointmentsList } from './appointments-list';
import { toAppointmentExportRows, APPOINTMENT_EXPORT_HEADERS, type AppointmentRow } from '@/lib/appointments-export';

type WeekCell = { day: number; inMonth: boolean; key: string };

export function AppointmentsCalendarView({
  weeks,
  byDate,
  todayLocalKey,
  monthLabel,
  prevMonth,
  nextMonth,
  rows,
}: {
  weeks: WeekCell[][];
  byDate: Record<string, AppointmentRow[]>;
  todayLocalKey: string;
  monthLabel: string;
  prevMonth: string;
  nextMonth: string;
  rows: AppointmentRow[];
}) {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
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
              const dayAppointments = byDate[cell.key] ?? [];
              const isToday = cell.key === todayLocalKey;
              const isHovered = hoveredDate === cell.key && dayAppointments.length > 0;
              return (
                <div
                  key={`${wi}-${di}`}
                  onMouseEnter={() => dayAppointments.length > 0 && setHoveredDate(cell.key)}
                  onMouseLeave={() => setHoveredDate((d) => (d === cell.key ? null : d))}
                  className={`min-h-20 bg-background p-1.5 transition-colors ${cell.inMonth ? '' : 'opacity-40'} ${
                    isHovered ? 'bg-primary/10 ring-1 ring-inset ring-primary/40' : ''
                  }`}
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
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium">This month&apos;s list</h2>
          <ExportMenu
            filenameBase="appointments"
            title="Appointments"
            headers={APPOINTMENT_EXPORT_HEADERS}
            rows={toAppointmentExportRows(rows)}
          />
        </div>
        <AppointmentsList rows={rows} hoveredDate={hoveredDate} onHoverDate={setHoveredDate} />
      </div>
    </div>
  );
}
