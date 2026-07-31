import { z } from 'zod';

export const razorpaySettingsSchema = z.object({
  keyId: z.string().trim().min(1, 'Key ID is required'),
  keySecret: z.string().trim().min(1, 'Key Secret is required'),
});

export type RazorpaySettingsInput = z.infer<typeof razorpaySettingsSchema>;
