'use server';

import { sendEmail } from '@/lib/email';
import { suggestionFormSchema, type SuggestionFormInput } from '@welldesk/shared';

const DESTINATION_EMAIL = 'singhparminder2192@gmail.com';

export async function submitSuggestion(values: SuggestionFormInput) {
  const parsed = suggestionFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  const { name, email, suggestion } = parsed.data;

  const result = await sendEmail({
    to: DESTINATION_EMAIL,
    subject: `WellDesk suggestion: ${name}`,
    html: `<p><strong>From:</strong> ${name} (${email})</p><p>${suggestion.replace(/\n/g, '<br>')}</p>`,
    text: `From: ${name} (${email})\n\n${suggestion}`,
  });

  if (!result.sent) {
    return { error: 'Could not send your suggestion right now — please try again shortly.' };
  }

  return { success: true };
}
