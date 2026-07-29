type SendEmailInput = { to: string; subject: string; html: string; text?: string };

const FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS ?? 'WellDesk <onboarding@resend.dev>';

// Falls back to a console log when RESEND_API_KEY isn't set (e.g. a local
// dev environment without one), so every caller of sendEmail() stays
// unchanged and never has to branch on whether a provider is configured.
export async function sendEmail(input: SendEmailInput): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[email:preview] to=${input.to} subject="${input.subject}"`);
    return { sent: false };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`[email] Resend send failed (${res.status}): ${body}`);
    return { sent: false };
  }

  return { sent: true };
}
