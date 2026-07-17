import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default async function ClientDietPlansPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const supabase = await createClient();
  const result = await getCurrentProfile(supabase);
  if (!result) return null;

  const { data: client } = await supabase.from('clients').select('id, full_name').eq('id', clientId).single();
  if (!client) notFound();

  const { data: plans } = await supabase
    .from('diet_plans')
    .select('id, name, plan_date, version, status')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  const { data: templates } = await supabase
    .from('diet_plans')
    .select('id, name')
    .eq('is_template', true)
    .order('name');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{client.full_name} — Diet Plans</h1>
          <p className="text-sm text-muted-foreground">{plans?.length ?? 0} plan(s) on file</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" render={<Link href={`/clients/${clientId}/diet-plans/new`} />}>
            New Plan
          </Button>
        </div>
      </div>

      {templates && templates.length > 0 && (
        <div className="rounded-md border p-4">
          <p className="mb-2 text-sm font-medium">Start from a template</p>
          <div className="flex flex-wrap gap-2">
            {templates.map((t) => (
              <Button
                key={t.id}
                variant="secondary"
                size="sm"
                render={<Link href={`/clients/${clientId}/diet-plans/new?fromTemplateId=${t.id}`} />}
              >
                {t.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!plans || plans.length === 0) && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No plans yet.
                </TableCell>
              </TableRow>
            )}
            {plans?.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell className="font-medium">
                  <Link href={`/clients/${clientId}/diet-plans/${plan.id}`} className="hover:underline">
                    {plan.name}
                  </Link>
                </TableCell>
                <TableCell>{plan.plan_date}</TableCell>
                <TableCell>v{plan.version}</TableCell>
                <TableCell>
                  <Badge variant={plan.status === 'active' ? 'default' : 'outline'} className="capitalize">
                    {plan.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
