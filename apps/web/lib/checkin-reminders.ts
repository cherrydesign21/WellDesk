import { createAdminClient } from './supabase/admin';
import { sendEmail } from './email';
import { renderCheckinReminderEmail } from './email-templates/checkin-reminder';
import { notifyClient } from './notifications-store';
import { getSiteUrl } from './site';

const INACTIVE_AFTER_DAYS = 14;
const REMINDER_COOLDOWN_DAYS = 7;

type EligibleClient = {
  id: string;
  practice_id: string;
  full_name: string;
  email: string | null;
  daysSinceLastCheckIn: number | null;
};

// Runs once a day via a Vercel Cron hitting /api/cron/checkin-reminders.
// Finds active, portal-enabled clients who haven't logged a health metric
// in INACTIVE_AFTER_DAYS days and haven't already been reminded in the last
// REMINDER_COOLDOWN_DAYS, then emails + in-app-notifies each one and stamps
// last_reminder_sent_at so tomorrow's run doesn't nag them again immediately.
export async function sendCheckinReminders(): Promise<{ remindersSent: number; clientIds: string[] }> {
  const admin = createAdminClient();
  const now = Date.now();
  const inactiveCutoffIso = new Date(now - INACTIVE_AFTER_DAYS * 86400000).toISOString();
  const cooldownCutoffIso = new Date(now - REMINDER_COOLDOWN_DAYS * 86400000).toISOString();

  const { data: clients, error: clientsError } = await admin
    .from('clients')
    .select('id, practice_id, full_name, email, created_at, user_id, status, last_reminder_sent_at, enrollments(status)')
    .eq('status', 'active')
    .not('user_id', 'is', null);

  if (clientsError) {
    console.error('[checkin-reminders] clients query failed:', clientsError.message);
    return { remindersSent: 0, clientIds: [] };
  }
  if (!clients || clients.length === 0) return { remindersSent: 0, clientIds: [] };

  const activeClients = clients.filter((c) => {
    const enrollments = (c.enrollments ?? []) as { status: string }[];
    return enrollments.some((e) => e.status === 'active');
  });
  if (activeClients.length === 0) return { remindersSent: 0, clientIds: [] };

  const clientIds = activeClients.map((c) => c.id);
  const { data: metrics } = await admin
    .from('health_metrics')
    .select('client_id, recorded_at')
    .in('client_id', clientIds)
    .order('recorded_at', { ascending: false });

  const lastCheckInByClient = new Map<string, string>();
  for (const m of metrics ?? []) {
    if (!lastCheckInByClient.has(m.client_id)) lastCheckInByClient.set(m.client_id, m.recorded_at);
  }

  const eligible: EligibleClient[] = [];
  for (const c of activeClients) {
    if (c.last_reminder_sent_at && c.last_reminder_sent_at > cooldownCutoffIso) continue;

    const lastCheckIn = lastCheckInByClient.get(c.id);
    const isInactive = lastCheckIn ? lastCheckIn < inactiveCutoffIso : c.created_at < inactiveCutoffIso;
    if (!isInactive) continue;

    eligible.push({
      id: c.id,
      practice_id: c.practice_id,
      full_name: c.full_name,
      email: c.email,
      daysSinceLastCheckIn: lastCheckIn ? Math.floor((now - new Date(lastCheckIn).getTime()) / 86400000) : null,
    });
  }

  if (eligible.length === 0) return { remindersSent: 0, clientIds: [] };

  const practiceIds = [...new Set(eligible.map((c) => c.practice_id))];
  const { data: practices } = await admin
    .from('practices')
    .select('id, name, logo_url, primary_color')
    .in('id', practiceIds);
  const practiceById = new Map((practices ?? []).map((p) => [p.id, p]));

  const remindedIds: string[] = [];
  for (const client of eligible) {
    const practice = practiceById.get(client.practice_id);
    const practiceName = practice?.name ?? 'Your dietitian';
    const firstName = client.full_name.trim().split(/\s+/)[0] ?? '';

    if (client.email) {
      const { subject, html, text } = renderCheckinReminderEmail({
        clientFirstName: firstName,
        practiceName,
        practiceLogoUrl: practice?.logo_url,
        practiceAccentColor: practice?.primary_color,
        daysSinceLastCheckIn: client.daysSinceLastCheckIn,
        portalUrl: `${getSiteUrl()}/portal`,
      });
      await sendEmail({ to: client.email, subject, html, text });
    }

    await notifyClient({
      practiceId: client.practice_id,
      clientId: client.id,
      type: 'checkin_reminder',
      title: 'Time for a check-in',
      body:
        client.daysSinceLastCheckIn === null
          ? "You haven't logged any numbers yet — add your first check-in."
          : `It's been ${client.daysSinceLastCheckIn} days since your last check-in.`,
      href: '/portal',
    });

    await admin.from('clients').update({ last_reminder_sent_at: new Date().toISOString() }).eq('id', client.id);
    remindedIds.push(client.id);
  }

  return { remindersSent: remindedIds.length, clientIds: remindedIds };
}
