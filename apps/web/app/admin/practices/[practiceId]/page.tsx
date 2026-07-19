import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Users } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PracticeActions } from '@/components/admin/practice-actions';
import { PracticeEditForm } from '@/components/admin/practice-edit-form';

export default async function AdminPracticeDetailPage({
  params,
}: {
  params: Promise<{ practiceId: string }>;
}) {
  const { practiceId } = await params;
  const supabase = createAdminClient();

  const { data: practice } = await supabase
    .from('practices')
    .select('id, name, tagline, suspended_at, created_at')
    .eq('id', practiceId)
    .single();

  if (!practice) notFound();

  const { data: owners } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('practice_id', practiceId);

  const { data: clients } = await supabase
    .from('clients')
    .select('id, full_name, phone, email, status')
    .eq('practice_id', practiceId)
    .order('full_name');

  return (
    <div className="space-y-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to practices
      </Link>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{practice.name}</h1>
          {practice.suspended_at ? (
            <Badge variant="destructive">Suspended</Badge>
          ) : (
            <Badge variant="success">Active</Badge>
          )}
        </div>
        <PracticeActions practiceId={practice.id} isSuspended={!!practice.suspended_at} />
      </div>

      <div className="rounded-md border p-4">
        <PracticeEditForm
          practiceId={practice.id}
          initialName={practice.name}
          initialTagline={practice.tagline ?? ''}
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Team</p>
        <div className="flex flex-wrap gap-2">
          {(owners ?? []).map((o, i) => (
            <Badge key={i} variant="outline" className="capitalize">
              {o.full_name} · {o.role}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium">Clients ({clients?.length ?? 0})</h2>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!clients || clients.length === 0) && (
                <TableRow>
                  <TableCell colSpan={3}>
                    <EmptyState icon={Users} title="No clients yet" compact />
                  </TableCell>
                </TableRow>
              )}
              {clients?.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/practices/${practiceId}/clients/${c.id}`} className="hover:underline">
                      {c.full_name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.phone}
                    {c.email ? ` · ${c.email}` : ''}
                  </TableCell>
                  <TableCell className="capitalize">{c.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
