import { z } from 'zod';

export const messageSchema = z.object({
  body: z.string().trim().min(1, 'Message cannot be empty').max(4000, 'Message is too long'),
});

export type MessageInput = z.infer<typeof messageSchema>;
