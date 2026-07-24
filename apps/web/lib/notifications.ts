import type { SupabaseClient } from '@supabase/supabase-js';

export type NotificationItem = {
  id: string;
  clientId: string;
  label: string;
  sub: string;
  href: string;
};

// Lightweight, real-data-backed alerts for the header bell — deliberately not
// a persisted notifications table (no read/unread state), just a live query
// over the same "needs attention" conditions the dashboard already surfaces.
export async function getNotifications(supabase: SupabaseClient): Promise<NotificationItem[]> {
  const in7Days = new Date();
  in7Days.setDate(in7Days.getDate() + 7);
  const in7DaysStr = in7Days.toISOString().slice(0, 10);

  const [{ data: expiring }, { data: overdue }] = await Promise.all([
    supabase
      .from('enrollments')
      .select('client_id, expiry_date')
      .eq('status', 'active')
      .lte('expiry_date', in7DaysStr)
      .order('expiry_date', { ascending: true })
      .limit(5),
    supabase
      .from('v_enrollment_payment_status')
      .select('client_id, amount_due')
      .eq('payment_status', 'overdue')
      .limit(5),
  ]);

  const expiringRows = (expiring ?? []) as { client_id: string; expiry_date: string }[];
  const overdueRows = (overdue ?? []) as { client_id: string; amount_due: number }[];

  const clientIds = [...new Set([...expiringRows, ...overdueRows].map((r) => r.client_id))];
  const nameById = new Map<string, string>();
  if (clientIds.length > 0) {
    const { data: clients } = await supabase.from('clients').select('id, full_name').in('id', clientIds);
    for (const c of clients ?? []) nameById.set(c.id, c.full_name);
  }

  const items: NotificationItem[] = [];

  for (const row of expiringRows) {
    items.push({
      id: `expiring-${row.client_id}`,
      clientId: row.client_id,
      label: nameById.get(row.client_id) ?? 'Unknown',
      sub: `Plan expires ${row.expiry_date}`,
      href: `/clients/${row.client_id}`,
    });
  }

  for (const row of overdueRows) {
    items.push({
      id: `overdue-${row.client_id}`,
      clientId: row.client_id,
      label: nameById.get(row.client_id) ?? 'Unknown',
      sub: `Payment of ${row.amount_due} overdue`,
      href: `/clients/${row.client_id}`,
    });
  }

  return items;
}
