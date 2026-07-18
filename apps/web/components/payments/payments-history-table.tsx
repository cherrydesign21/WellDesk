'use client';

import { useTransition } from 'react';
import { Trash2, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { deletePayment } from '@/app/(dashboard)/clients/[clientId]/payments/actions';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export type PaymentRow = {
  id: string;
  amount: number;
  payment_date: string;
  mode: string;
  reference_no: string | null;
  notes: string | null;
};

export function PaymentsHistoryTable({ clientId, rows }: { clientId: string; rows: PaymentRow[] }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string) {
    if (!window.confirm('Delete this payment entry? This cannot be undone.')) return;
    startTransition(async () => {
      const result = await deletePayment(clientId, id);
      if (result?.error) toast.error(result.error);
      else toast.success('Payment deleted');
    });
  }

  if (rows.length === 0) {
    return <EmptyState icon={Wallet} title="No payments logged yet" compact />;
  }

  const sorted = [...rows].sort((a, b) => b.payment_date.localeCompare(a.payment_date));

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Mode</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="whitespace-nowrap">{row.payment_date}</TableCell>
              <TableCell>{row.amount}</TableCell>
              <TableCell className="capitalize">{row.mode}</TableCell>
              <TableCell>{row.reference_no ?? '—'}</TableCell>
              <TableCell className="max-w-[200px] truncate text-muted-foreground">{row.notes}</TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" disabled={isPending} onClick={() => handleDelete(row.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
