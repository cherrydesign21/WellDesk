import { z } from 'zod';
import { GENDERS, CLIENT_STATUSES, PLAN_TYPES } from '../constants';

export const clientSchema = z.object({
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  dob: z.string().optional().nullable(),
  gender: z.enum(GENDERS).optional().nullable(),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{7,20}$/, 'Enter a valid phone number')
    .optional()
    .or(z.literal(''))
    .nullable(),
  email: z.string().trim().email('Enter a valid email').optional().or(z.literal('')).nullable(),
  address: z.string().trim().max(500).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export type ClientInput = z.infer<typeof clientSchema>;

export const clientStatusSchema = z.enum(CLIENT_STATUSES);

export const createClientSchema = clientSchema.extend({
  planType: z.enum(PLAN_TYPES),
  customDurationDays: z.number().int().positive().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  planAmount: z.number().nonnegative(),
  confirmDuplicate: z.boolean(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
