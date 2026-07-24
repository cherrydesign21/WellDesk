'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { Trash2, CalendarDays, Video, Users as UsersIcon, Phone } from 'lucide-react';
import { toast } from 'sonner';
import {
  APPOINTMENT_STATUSES,
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_MODE_LABELS,
  type AppointmentStatus,
  type AppointmentMode,
} from '@welldesk/shared';
import { updateAppointmentStatus, deleteAppointment } from '@/app/(dashboard)/appointments/actions';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ExportMenu } from '@/components/ui/export-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const APPOINTMENT_EXPORT_HEADERS = ['Date', 'Time', 'Client', 'Mode', 'Status'];

const MODE_ICONS = { video: Video, in_person: UsersIcon, phone: Phone } as const;

export type AppointmentRow = {
  id: string;
  client_id: string;
  client_name: string;
  local_date: string;
  local_time: string;
  status: AppointmentStatus;
  notes: string | null;
  mode: AppointmentMode;
};

export function AppointmentsList({ rows }: { rows: AppointmentRow[] }) {
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(id: string, status: string | null) {
    if (!status) return;
    startTransition(async () => {
      const result = await updateAppointmentStatus(id, status as AppointmentStatus);
      if (result?.error) toast.error(result.error);
    });
  }

  function handleDelete(id: string) {
    if (!window.confirm('Delete this appointment?')) return;
    startTransition(async () => {
      const result = await deleteAppointment(id);
      if (result?.error) toast.error(result.error);
      else toast.success('Appointment deleted');
    });
  }

  if (rows.length === 0) {
    return <EmptyState icon={CalendarDays} title="No appointments this month" compact />;
  }

  const exportRows = rows.map((row) => [
    row.local_date,
    row.local_time,
    row.client_name,
    APPOINTMENT_MODE_LABELS[row.mode],
    APPOINTMENT_STATUS_LABELS[row.status],
  ]);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <ExportMenu
          filenameBase="appointments"
          title="Appointments"
          headers={APPOINTMENT_EXPORT_HEADERS}
          rows={exportRows}
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="whitespace-nowrap">{row.local_date}</TableCell>
                <TableCell className="whitespace-nowrap">{row.local_time}</TableCell>
                <TableCell>
                  <Link href={`/clients/${row.client_id}`} className="hover:underline">
                    {row.client_name}
                  </Link>
                </TableCell>
                <TableCell>
                  {(() => {
                    const Icon = MODE_ICONS[row.mode];
                    return (
                      <span
                        className="flex items-center gap-1.5 text-sm text-muted-foreground"
                        title={APPOINTMENT_MODE_LABELS[row.mode]}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {APPOINTMENT_MODE_LABELS[row.mode]}
                      </span>
                    );
                  })()}
                </TableCell>
                <TableCell>
                  <Select
                    value={row.status}
                    onValueChange={(v) => handleStatusChange(row.id, v)}
                    disabled={isPending}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {APPOINTMENT_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {APPOINTMENT_STATUS_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" disabled={isPending} onClick={() => handleDelete(row.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
