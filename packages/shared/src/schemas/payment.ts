import { z } from 'zod';
import { PAYMENT_MODES } from '../constants';

export const paymentSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  paymentDate: z.string().min(1, 'Date is required'),
  mode: z.enum(PAYMENT_MODES),
  referenceNo: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export type PaymentInput = z.infer<typeof paymentSchema>;
