import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { renderPaymentsXlsx, type PaymentExportRow } from '@/lib/exports/payments-xlsx';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const result = await getCurrentProfile(supabase);
  if (!result) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  let query = supabase
    .from('payments')
    .select('payment_date, amount, mode, reference_no, notes, clients(full_name)')
    .order('payment_date', { ascending: false });

  if (clientId) query = query.eq('client_id', clientId);
  if (from) query = query.gte('payment_date', from);
  if (to) query = query.lte('payment_date', to);

  const { data: payments } = await query;

  const rows: PaymentExportRow[] = (payments ?? []).map((p) => ({
    payment_date: p.payment_date,
    client_name: (p.clients as unknown as { full_name: string } | null)?.full_name ?? '',
    amount: p.amount,
    mode: p.mode,
    reference_no: p.reference_no,
    notes: p.notes,
  }));

  const buffer = renderPaymentsXlsx(rows);
  const filename = clientId ? 'payments-client' : 'payments-all';

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
    },
  });
}
