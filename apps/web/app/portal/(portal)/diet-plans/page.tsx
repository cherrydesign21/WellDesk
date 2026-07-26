import Link from 'next/link';
import { UtensilsCrossed } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireClient } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default async function PortalDietPlansPage() {
  const { client } = await requireClient();
  const supabase = await createClient();

  const { data: plans } = await supabase
    .from('diet_plans')
    .select('id, name, plan_date, version, status')
    .eq('client_id', client.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Your Diet Plans</h1>
        <p className="text-sm text-muted-foreground">{plans?.length ?? 0} plan(s) on file</p>
      </div>

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
                <TableCell colSpan={4}>
                  <EmptyState icon={UtensilsCrossed} title="No plans yet" compact />
                </TableCell>
              </TableRow>
            )}
            {plans?.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell className="font-medium">
                  <Link href={`/portal/diet-plans/${plan.id}`} className="hover:underline">
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
