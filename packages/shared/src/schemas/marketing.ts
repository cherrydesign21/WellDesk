import { z } from 'zod';

export const contactFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  email: z.string().trim().email('Enter a valid email address'),
  message: z.string().trim().min(1, 'Message is required').max(4000),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;

export const suggestionFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  email: z.string().trim().email('Enter a valid email address'),
  suggestion: z.string().trim().min(1, 'Please share your suggestion').max(4000),
});

export type SuggestionFormInput = z.infer<typeof suggestionFormSchema>;
