import { APPOINTMENT_MODE_LABELS, APPOINTMENT_STATUS_LABELS, type AppointmentStatus, type AppointmentMode } from '@welldesk/shared';

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

export const APPOINTMENT_EXPORT_HEADERS = ['Date', 'Time', 'Client', 'Mode', 'Status'];

export function toAppointmentExportRows(rows: AppointmentRow[]): string[][] {
  return rows.map((row) => [
    row.local_date,
    row.local_time,
    row.client_name,
    APPOINTMENT_MODE_LABELS[row.mode],
    APPOINTMENT_STATUS_LABELS[row.status],
  ]);
}
