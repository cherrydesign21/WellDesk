import { formatCurrency } from '@welldesk/shared';
import { createAdminClient } from '@/lib/supabase/admin';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users } from 'lucide-react';

export default async function AdminDietitiansPage() {
  const supabase = createAdminClient();

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, phone, gender, practice_id, created_at')
    .eq('role', 'owner')
    .order('created_at', { ascending: false });

  const { data: practices } = await supabase
    .from('practices')
    .select('id, name, currency, suspended_at');
  const practiceById = new Map((practices ?? []).map((p) => [p.id, p]));

  const { data: clients } = await supabase.from('clients').select('practice_id');
  const clientCountByPractice = new Map<string, number>();
  for (const c of clients ?? []) {
    clientCountByPractice.set(c.practice_id, (clientCountByPractice.get(c.practice_id) ?? 0) + 1);
  }

  const { data: payments } = await supabase.from('payments').select('practice_id, amount');
  const revenueByPractice = new Map<string, number>();
  for (const p of payments ?? []) {
    revenueByPractice.set(p.practice_id, (revenueByPractice.get(p.practice_id) ?? 0) + Number(p.amount));
  }

  const emailById = new Map<string, string>();
  let page = 1;
  for (;;) {
    const { data: page_data } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    for (const u of page_data.users) {
      if (u.email) emailById.set(u.id, u.email);
    }
    if (page_data.users.length < 200) break;
    page++;
  }

  const rows = (profiles ?? []).map((p) => {
    const practice = practiceById.get(p.practice_id);
    return {
      id: p.id,
      fullName: p.full_name,
      brandName: practice?.name ?? '—',
      email: emailById.get(p.id) ?? '—',
      phone: p.phone,
      gender: p.gender,
      totalClients: clientCountByPractice.get(p.practice_id) ?? 0,
      totalRevenue: revenueByPractice.get(p.practice_id) ?? 0,
      currency: practice?.currency ?? 'INR',
      joinedAt: p.created_at,
      isSuspended: !!practice?.suspended_at,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dietitians</h1>
        <p className="text-sm text-muted-foreground">{rows.length} practice owner(s) on the platform</p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Clients</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8}>
                  <EmptyState icon={Users} title="No dietitians yet" compact />
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.fullName}</TableCell>
                <TableCell>{row.brandName}</TableCell>
                <TableCell>
                  <div className="text-sm">{row.email}</div>
                  <div className="text-xs text-muted-foreground">{row.phone ?? '—'}</div>
                </TableCell>
                <TableCell className="capitalize">{row.gender ?? '—'}</TableCell>
                <TableCell>{row.totalClients}</TableCell>
                <TableCell>{formatCurrency(row.totalRevenue, row.currency)}</TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {row.joinedAt.slice(0, 10)}
                </TableCell>
                <TableCell>
                  {row.isSuspended ? (
                    <Badge variant="destructive">Suspended</Badge>
                  ) : (
                    <Badge variant="success">Active</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
