import { z } from 'zod';

export const brandingSchema = z.object({
  name: z.string().trim().min(2, 'Practice name is required').max(120),
  tagline: z.string().trim().max(200).optional().nullable(),
  contactPhone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{7,20}$/, 'Enter a valid phone number')
    .optional()
    .or(z.literal('')),
  contactEmail: z.string().trim().email('Enter a valid email').optional().or(z.literal('')),
});

export type BrandingInput = z.infer<typeof brandingSchema>;
