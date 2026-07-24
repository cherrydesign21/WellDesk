import { z } from 'zod';
import { APPOINTMENT_MODES } from '../constants';

export const appointmentSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  durationMinutes: z.number().int().positive(),
  mode: z.enum(APPOINTMENT_MODES),
  notes: z.string().trim().max(2000).optional(),
});

export type AppointmentInput = z.infer<typeof appointmentSchema>;
