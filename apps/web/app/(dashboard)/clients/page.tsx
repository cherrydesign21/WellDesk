import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { getEffectiveClientStatus, type ClientStatus } from '@welldesk/shared';
import { ClientsTable, type ClientRow, type Enrollment } from '@/components/clients/clients-table';
import { NewClientDialog } from '@/components/clients/new-client-dialog';

type SearchParams = {
  q?: string;
  gender?: string;
  status?: string;
  planType?: string;
  joinMonth?: string;
  expiringWithin?: string;
  sort?: string;
  dir?: string;
};

function latestEnrollment(enrollments: Enrollment[]) {
  return [...(enrollments ?? [])].sort((a, b) => b.cycle_number - a.cycle_number)[0];
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const result = await getCurrentProfile(supabase);
  if (!result) return null;

  let query = supabase
    .from('clients')
    .select(
      'id, full_name, phone, email, gender, dob, address, notes, status, created_at, enrollments(plan_type, expiry_date, status, cycle_number)'
    );

  if (params.q) {
    const term = params.q.replace(/[%,]/g, '');
    query = query.or(`full_name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%`);
  }
  if (params.gender) {
    query = query.eq('gender', params.gender);
  }

  const { data: clientsRaw, error } = await query;

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

  let clients: ClientRow[] = (clientsRaw ?? []).map((c) => ({
    ...(c as unknown as ClientRow),
    effective_status: getEffectiveClientStatus(c.status as ClientStatus, latestEnrollment(c.enrollments)),
    last_visit: lastVisitByClient.get(c.id) ?? null,
  }));

  if (params.status) {
    clients = clients.filter((c) => c.effective_status === params.status);
  }
  if (params.planType) {
    clients = clients.filter((c) => latestEnrollment(c.enrollments)?.plan_type === params.planType);
  }
  if (params.joinMonth) {
    clients = clients.filter((c) => c.created_at.slice(0, 7) === params.joinMonth);
  }
  if (params.expiringWithin) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + Number(params.expiringWithin));
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    clients = clients.filter((c) => {
      const enrollment = latestEnrollment(c.enrollments);
      return enrollment && c.effective_status === 'active' && enrollment.expiry_date <= cutoffStr;
    });
  }

  const dir = params.dir === 'asc' ? 1 : -1;
  clients.sort((a, b) => {
    switch (params.sort) {
      case 'name':
        return a.full_name.localeCompare(b.full_name) * dir;
      case 'expiryDate': {
        const ea = latestEnrollment(a.enrollments)?.expiry_date ?? '';
        const eb = latestEnrollment(b.enrollments)?.expiry_date ?? '';
        return ea.localeCompare(eb) * dir;
      }
      case 'lastVisit': {
        const va = a.last_visit ?? '';
        const vb = b.last_visit ?? '';
        return va.localeCompare(vb) * dir;
      }
      case 'planType': {
        const pa = latestEnrollment(a.enrollments)?.plan_type ?? '';
        const pb = latestEnrollment(b.enrollments)?.plan_type ?? '';
        return pa.localeCompare(pb) * dir;
      }
      case 'joinDate':
      default:
        return a.created_at.localeCompare(b.created_at) * dir;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Clients</h1>
          <p className="text-sm text-muted-foreground">{clients.length} total</p>
        </div>
        <NewClientDialog />
      </div>
      {error ? (
        <p className="text-sm text-destructive">Failed to load clients: {error.message}</p>
      ) : (
        <ClientsTable clients={clients} filters={params} />
      )}
    </div>
  );
}
