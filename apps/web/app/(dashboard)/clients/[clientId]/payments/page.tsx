import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { ExportMenu } from '@/components/ui/export-menu';
import { LogPaymentDialog } from '@/components/payments/log-payment-dialog';
import { PaymentsHistoryTable } from '@/components/payments/payments-history-table';

const PAYMENT_EXPORT_HEADERS = ['Date', 'Amount', 'Mode', 'Reference', 'Plan Period', 'Notes'];

export default async function ClientPaymentsPage({
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

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('id, start_date, expiry_date')
    .eq('client_id', clientId);

  const { data: payments } = await supabase
    .from('payments')
    .select('id, amount, payment_date, mode, reference_no, notes, enrollment_id')
    .eq('client_id', clientId)
    .order('payment_date', { ascending: false });

  const enrollmentById = new Map((enrollments ?? []).map((e) => [e.id, e]));
  const paymentRows = (payments ?? []).map((p) => {
    const enrollment = p.enrollment_id ? enrollmentById.get(p.enrollment_id) : undefined;
    return {
      ...p,
      plan_start: enrollment?.start_date ?? null,
      plan_end: enrollment?.expiry_date ?? null,
    };
  });

  return (
    <div className="space-y-6">
      <Link
        href={`/clients/${clientId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to {client.full_name}
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{client.full_name} — Payments</h1>
          <p className="text-sm text-muted-foreground">{paymentRows.length} payment(s) on file</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportMenu
            filenameBase={`payments-${client.full_name}`}
            title={`Payments — ${client.full_name}`}
            headers={PAYMENT_EXPORT_HEADERS}
            rows={paymentRows.map((p) => [
              p.payment_date,
              p.amount,
              p.mode,
              p.reference_no ?? '—',
              p.plan_start && p.plan_end ? `${p.plan_start} to ${p.plan_end}` : '—',
              p.notes ?? '',
            ])}
          />
          <LogPaymentDialog clientId={clientId} />
        </div>
      </div>

      <PaymentsHistoryTable clientId={clientId} rows={paymentRows} />
    </div>
  );
}
