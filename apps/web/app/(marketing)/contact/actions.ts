'use server';

import { sendEmail } from '@/lib/email';
import { contactFormSchema, type ContactFormInput } from '@welldesk/shared';

const DESTINATION_EMAIL = 'singhparminder2192@gmail.com';

export async function submitContactForm(values: ContactFormInput) {
  const parsed = contactFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  const { name, email, message } = parsed.data;

  const result = await sendEmail({
    to: DESTINATION_EMAIL,
    subject: `WellDesk contact form: ${name}`,
    html: `<p><strong>From:</strong> ${name} (${email})</p><p>${message.replace(/\n/g, '<br>')}</p>`,
    text: `From: ${name} (${email})\n\n${message}`,
  });

  if (!result.sent) {
    return { error: 'Could not send your message right now — please try again shortly.' };
  }

  return { success: true };
}
