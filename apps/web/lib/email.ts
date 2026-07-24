type SendEmailInput = { to: string; subject: string; html: string; text?: string };

// No transactional email provider is wired up yet — this logs the email
// instead of delivering it. Once a provider (e.g. Resend) is set up, add its
// API key as an env var and replace the body below with a real send call;
// every caller of sendEmail() stays unchanged.
export async function sendEmail(input: SendEmailInput): Promise<{ sent: boolean }> {
  console.log(`[email:preview] to=${input.to} subject="${input.subject}"`);
  return { sent: false };
}
