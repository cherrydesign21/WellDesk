import { z } from 'zod';
import { CURRENCY_CODES } from '../constants';

export const updateCurrencySchema = z.object({
  currency: z.enum(CURRENCY_CODES),
});

export type UpdateCurrencyInput = z.infer<typeof updateCurrencySchema>;
