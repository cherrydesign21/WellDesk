import { z } from 'zod';
import { CURATED_FONTS } from '../constants';

const fontIds: string[] = CURATED_FONTS.map((f) => f.id);

export const brandingSchema = z.object({
  name: z.string().trim().min(2, 'Practice name is required').max(120),
  tagline: z.string().trim().max(200).optional().nullable(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Enter a valid hex color'),
  fontChoice: z.string().refine((v) => fontIds.includes(v), 'Invalid font choice'),
});

export type BrandingInput = z.infer<typeof brandingSchema>;
