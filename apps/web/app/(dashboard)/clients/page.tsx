import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { ClientsTable, type ClientRow } from '@/components/clients/clients-table';
import { NewClientDialog } from '@/components/clients/new-client-dialog';

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();
  const result = await getCurrentProfile(supabase);
  if (!result) return null;

  let query = supabase
    .from('clients')
    .select(
      'id, full_name, phone, email, gender, dob, address, notes, status, created_at, enrollments(plan_type, expiry_date, status, cycle_number)'
    )
    .order('created_at', { ascending: false });

  if (q) {
    const term = q.replace(/[%,]/g, '');
    query = query.or(`full_name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%`);
  }

  const { data: clients, error } = await query;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Clients</h1>
          <p className="text-sm text-muted-foreground">{clients?.length ?? 0} total</p>
        </div>
        <NewClientDialog />
      </div>
      {error ? (
        <p className="text-sm text-destructive">Failed to load clients: {error.message}</p>
      ) : (
        <ClientsTable clients={(clients ?? []) as ClientRow[]} initialQuery={q ?? ''} />
      )}
    </div>
  );
}
