import { z } from 'zod';

export const healthMetricSchema = z.object({
  recordedAt: z.string().min(1, 'Date is required'),
  systolicBp: z.number().int().positive().optional(),
  diastolicBp: z.number().int().positive().optional(),
  bloodSugarFasting: z.number().nonnegative().optional(),
  bloodSugarPostMeal: z.number().nonnegative().optional(),
  weightKg: z.number().positive().optional(),
  heightCm: z.number().positive().optional(),
  waistCm: z.number().positive().optional(),
  chestCm: z.number().positive().optional(),
  hipsCm: z.number().positive().optional(),
  bodyFatPct: z.number().min(0).max(100).optional(),
  targetWeightKg: z.number().positive().optional(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export type HealthMetricInput = z.infer<typeof healthMetricSchema>;
