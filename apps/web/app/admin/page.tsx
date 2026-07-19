import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2 } from 'lucide-react';

export default async function AdminPracticesPage() {
  const supabase = createAdminClient();

  const { data: practices } = await supabase
    .from('practices')
    .select('id, name, tagline, owner_user_id, suspended_at, created_at')
    .order('created_at', { ascending: false });

  const { data: clientCounts } = await supabase.from('clients').select('practice_id');
  const countByPractice = new Map<string, number>();
  for (const c of clientCounts ?? []) {
    countByPractice.set(c.practice_id, (countByPractice.get(c.practice_id) ?? 0) + 1);
  }

  const { data: owners } = await supabase.from('profiles').select('id, full_name, practice_id').eq('role', 'owner');
  const ownerByPractice = new Map(owners?.map((o) => [o.practice_id, o.full_name]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Practices</h1>
        <p className="text-sm text-muted-foreground">{practices?.length ?? 0} practice(s) on the platform</p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Practice</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Clients</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!practices || practices.length === 0) && (
              <TableRow>
                <TableCell colSpan={5}>
                  <EmptyState icon={Building2} title="No practices yet" compact />
                </TableCell>
              </TableRow>
            )}
            {practices?.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">
                  <Link href={`/admin/practices/${p.id}`} className="hover:underline">
                    {p.name}
                  </Link>
                </TableCell>
                <TableCell>{ownerByPractice.get(p.id) ?? '—'}</TableCell>
                <TableCell>{countByPractice.get(p.id) ?? 0}</TableCell>
                <TableCell className="whitespace-nowrap">{p.created_at.slice(0, 10)}</TableCell>
                <TableCell>
                  {p.suspended_at ? (
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
