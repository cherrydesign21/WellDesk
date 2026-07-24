// Plain HTML string (not JSX) — email clients need inline styles and
// table-based layout, so this deliberately skips React/Tailwind entirely.
export function renderDietPlanReadyEmail({
  clientFirstName,
  practiceName,
  practiceLogoUrl,
  practiceAccentColor,
  planName,
  portalUrl,
}: {
  clientFirstName: string;
  practiceName: string;
  practiceLogoUrl?: string | null;
  practiceAccentColor?: string | null;
  planName: string;
  portalUrl: string;
}): { subject: string; html: string; text: string } {
  const accent = practiceAccentColor || '#454E17';
  const subject = `${practiceName}: your new diet plan is ready`;

  const html = `<!doctype html>
<html>
  <body style="margin:0; padding:0; background-color:#f7f1e3; font-family:'Segoe UI', Arial, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f1e3; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; background-color:#ffffff; border-radius:16px; overflow:hidden;">
            <tr>
              <td style="background-color:${accent}; padding:24px 32px;">
                ${
                  practiceLogoUrl
                    ? `<img src="${practiceLogoUrl}" alt="${practiceName}" height="32" style="display:block; height:32px; width:auto;" />`
                    : `<span style="color:#ffffff; font-size:18px; font-weight:600;">${practiceName}</span>`
                }
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 16px; font-size:22px; line-height:1.3;">🥗</p>
                <p style="margin:0 0 8px; font-size:16px; color:#3c1d0c;">Hi ${clientFirstName},</p>
                <p style="margin:0 0 24px; font-size:15px; line-height:1.6; color:#3c1d0c;">
                  <strong>${practiceName}</strong> just added a new diet plan for you — <strong>${planName}</strong>.
                  Log in to your client portal to see today's meals and track your progress.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="border-radius:999px; background-color:${accent};">
                      <a href="${portalUrl}" style="display:inline-block; padding:12px 28px; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:999px;">
                        View Your Diet Plan
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px; background-color:#f7f1e3; text-align:center;">
                <p style="margin:0; font-size:12px; color:#8a7a63;">
                  Sent by ${practiceName} via WellDesk — an automated notification from your dietitian.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `Hi ${clientFirstName},\n\n${practiceName} just added a new diet plan for you: "${planName}".\n\nView it here: ${portalUrl}\n\n— Sent by ${practiceName} via WellDesk`;

  return { subject, html, text };
}
