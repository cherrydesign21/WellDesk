import { Wallet } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ExportMenu } from '@/components/ui/export-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const PAYMENT_EXPORT_HEADERS = ['Date', 'Client', 'Amount', 'Mode', 'Reference'];

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from, to } = await searchParams;
  const supabase = await createClient();
  const result = await getCurrentProfile(supabase);
  if (!result) return null;

  let query = supabase
    .from('payments')
    .select('id, amount, payment_date, mode, reference_no, notes, clients(full_name)')
    .order('payment_date', { ascending: false });

  if (from) query = query.gte('payment_date', from);
  if (to) query = query.lte('payment_date', to);

  const { data: payments } = await query;
  const total = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);

  const exportRows = (payments ?? []).map((p) => [
    p.payment_date,
    (p.clients as unknown as { full_name: string } | null)?.full_name ?? '—',
    p.amount,
    p.mode,
    p.reference_no ?? '—',
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Payments</h1>
          <p className="text-sm text-muted-foreground">{payments?.length ?? 0} payment(s) · total {total}</p>
        </div>
        <ExportMenu
          filenameBase="payments"
          title="Payments"
          headers={PAYMENT_EXPORT_HEADERS}
          rows={exportRows}
        />
      </div>

      <form className="flex flex-wrap items-end gap-3" action="/payments">
        <div className="grid gap-1.5">
          <Label htmlFor="from">From</Label>
          <Input id="from" type="date" name="from" defaultValue={from} className="w-40" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="to">To</Label>
          <Input id="to" type="date" name="to" defaultValue={to} className="w-40" />
        </div>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
        {(from || to) && (
          <Button type="button" variant="ghost" render={<a href="/payments" />}>
            Clear
          </Button>
        )}
      </form>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Reference</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!payments || payments.length === 0) && (
              <TableRow>
                <TableCell colSpan={5}>
                  <EmptyState icon={Wallet} title="No payments found" compact />
                </TableCell>
              </TableRow>
            )}
            {payments?.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="whitespace-nowrap">{p.payment_date}</TableCell>
                <TableCell>{(p.clients as unknown as { full_name: string } | null)?.full_name ?? '—'}</TableCell>
                <TableCell>{p.amount}</TableCell>
                <TableCell className="capitalize">{p.mode}</TableCell>
                <TableCell>{p.reference_no ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
