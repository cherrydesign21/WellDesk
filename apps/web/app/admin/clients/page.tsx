import { createAdminClient } from '@/lib/supabase/admin';
import { getEffectiveClientStatus, type ClientStatus } from '@welldesk/shared';
import { AdminClientsTable, type AdminClientRow } from '@/components/admin/admin-clients-table';

type Enrollment = { plan_type: string; expiry_date: string; status: string; cycle_number: number };

function latestEnrollment(enrollments: Enrollment[]) {
  return [...(enrollments ?? [])].sort((a, b) => b.cycle_number - a.cycle_number)[0];
}

export default async function AdminClientsPage() {
  const supabase = createAdminClient();

  const { data: clientsRaw } = await supabase
    .from('clients')
    .select(
      'id, full_name, email, phone, gender, dob, status, created_at, practice_id, enrollments(plan_type, expiry_date, status, cycle_number)'
    )
    .order('created_at', { ascending: false });

  const { data: practices } = await supabase.from('practices').select('id, name');
  const practiceNameById = new Map((practices ?? []).map((p) => [p.id, p.name]));

  const { data: owners } = await supabase.from('profiles').select('practice_id, full_name').eq('role', 'owner');
  const dietitianByPractice = new Map((owners ?? []).map((o) => [o.practice_id, o.full_name]));

  const rows: AdminClientRow[] = (clientsRaw ?? []).map((c) => {
    const enrollments = (c.enrollments ?? []) as Enrollment[];
    return {
      id: c.id,
      fullName: c.full_name,
      email: c.email,
      phone: c.phone,
      gender: c.gender,
      dob: c.dob,
      status: getEffectiveClientStatus(c.status as ClientStatus, latestEnrollment(enrollments)),
      joinedAt: c.created_at,
      practiceId: c.practice_id,
      practiceName: practiceNameById.get(c.practice_id) ?? '—',
      dietitianName: dietitianByPractice.get(c.practice_id) ?? '—',
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Clients</h1>
        <p className="text-sm text-muted-foreground">{rows.length} client(s) across every practice</p>
      </div>
      <AdminClientsTable rows={rows} />
    </div>
  );
}
