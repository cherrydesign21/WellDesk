import { z } from 'zod';
import { PLAN_TYPES } from '../constants';

export const enrollmentSchema = z
  .object({
    planType: z.enum(PLAN_TYPES),
    customDurationDays: z.number().int().positive().optional(),
    startDate: z.string().min(1, 'Start date is required'),
    planAmount: z.number().nonnegative(),
    notes: z.string().trim().max(2000).optional().nullable(),
  })
  .refine((data) => data.planType !== 'custom' || !!data.customDurationDays, {
    message: 'Custom plans require a duration in days',
    path: ['customDurationDays'],
  });

export type EnrollmentInput = z.infer<typeof enrollmentSchema>;
