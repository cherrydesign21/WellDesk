import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { getEffectiveClientStatus, type ClientStatus } from '@welldesk/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Enrollment = { plan_type: string; expiry_date: string; status: string; cycle_number: number };
type ClientLite = { id: string; full_name: string; status: string; enrollments: Enrollment[] };

function latestEnrollment(enrollments: Enrollment[]) {
  return [...(enrollments ?? [])].sort((a, b) => b.cycle_number - a.cycle_number)[0];
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function AlertList({
  title,
  items,
}: {
  title: string;
  items: { id: string; label: string; sub: string }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing here.</p>
        ) : (
          items.map((item) => (
            <Link
              key={item.id}
              href={`/clients/${item.id}`}
              className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted"
            >
              <span className="font-medium">{item.label}</span>
              <span className="text-muted-foreground">{item.sub}</span>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const result = await getCurrentProfile(supabase);
  if (!result) return null;

  const { data: clientsRaw } = await supabase
    .from('clients')
    .select('id, full_name, status, enrollments(plan_type, expiry_date, status, cycle_number)');

  const clients = (clientsRaw ?? []) as ClientLite[];

  const { data: recentMetrics } = await supabase
    .from('health_metrics')
    .select('client_id, recorded_at')
    .order('recorded_at', { ascending: false });

  const lastVisitByClient = new Map<string, string>();
  for (const m of recentMetrics ?? []) {
    if (!lastVisitByClient.has(m.client_id)) {
      lastVisitByClient.set(m.client_id, m.recorded_at);
    }
  }

  const activeClients = clients.filter(
    (c) => getEffectiveClientStatus(c.status as ClientStatus, latestEnrollment(c.enrollments)) === 'active'
  );

  const in7Days = new Date();
  in7Days.setDate(in7Days.getDate() + 7);
  const in7DaysStr = in7Days.toISOString().slice(0, 10);

  const expiringSoon = activeClients.filter((c) => {
    const enrollment = latestEnrollment(c.enrollments);
    return enrollment && enrollment.status === 'active' && enrollment.expiry_date <= in7DaysStr;
  });

  const inactiveCutoff = new Date();
  inactiveCutoff.setDate(inactiveCutoff.getDate() - 14);
  const inactiveCutoffIso = inactiveCutoff.toISOString();

  const inactiveClients = activeClients.filter((c) => {
    const lastVisit = lastVisitByClient.get(c.id);
    return !lastVisit || lastVisit < inactiveCutoffIso;
  });

  const { data: overdueRows } = await supabase
    .from('v_enrollment_payment_status')
    .select('client_id, amount_due')
    .eq('payment_status', 'overdue');

  const clientNameById = new Map(clients.map((c) => [c.id, c.full_name]));
  const overduePayments = (overdueRows ?? []).map((r) => ({
    id: r.client_id as string,
    label: clientNameById.get(r.client_id as string) ?? 'Unknown',
    sub: `Due ${r.amount_due}`,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Active clients" value={activeClients.length} />
        <StatCard label="Expiring in 7 days" value={expiringSoon.length} />
        <StatCard label="No visit in 14+ days" value={inactiveClients.length} />
        <StatCard label="Overdue payments" value={overduePayments.length} />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <AlertList
          title="Expiring soon"
          items={expiringSoon.map((c) => ({
            id: c.id,
            label: c.full_name,
            sub: latestEnrollment(c.enrollments)?.expiry_date ?? '',
          }))}
        />
        <AlertList
          title="No recent check-in"
          items={inactiveClients.map((c) => ({
            id: c.id,
            label: c.full_name,
            sub: lastVisitByClient.get(c.id)?.slice(0, 10) ?? 'Never',
          }))}
        />
        <AlertList title="Overdue payments" items={overduePayments} />
      </div>
    </div>
  );
}
