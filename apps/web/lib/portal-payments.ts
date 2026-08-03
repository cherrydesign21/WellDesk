import { convertCurrency } from '@welldesk/shared';
import { createAdminClient } from './supabase/admin';
import { getFxRates } from './fx-rates';

export type PaymentDueInfo = {
  isGatewayConnected: boolean;
  currency: string;
  enrollmentId: string | null;
  amountDue: number;
};

// Shared by the portal page (read-only "amount due" display) and the order
// -creation action, so the two can never disagree on what's owed. Goes
// through the admin client rather than the client's own RLS-bound session —
// v_enrollment_payment_status's RLS behavior as a *view* depends on its
// owner's privileges, not necessarily the querying client, so relying on it
// under RLS would be an unverified assumption. Every query here is scoped by
// the caller-supplied clientId/practiceId regardless.
export async function getPortalPaymentDue(clientId: string, practiceId: string): Promise<PaymentDueInfo> {
  const admin = createAdminClient();

  const { data: gateway } = await admin
    .from('practices')
    .select('razorpay_key_id, razorpay_key_secret, currency')
    .eq('id', practiceId)
    .maybeSingle();

  const isGatewayConnected = Boolean(gateway?.razorpay_key_id && gateway?.razorpay_key_secret);
  const currency = gateway?.currency || 'INR';

  const { data: enrollment } = await admin
    .from('enrollments')
    .select('id')
    .eq('client_id', clientId)
    .eq('status', 'active')
    .order('cycle_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!enrollment) {
    return { isGatewayConnected, currency, enrollmentId: null, amountDue: 0 };
  }

  const { data: status } = await admin
    .from('v_enrollment_payment_status')
    .select('amount_due, currency')
    .eq('enrollment_id', enrollment.id)
    .eq('client_id', clientId)
    .maybeSingle();

  // The view's amount_due is in the enrollment's own currency, which can
  // differ from the practice's current display/billing currency if that's
  // been changed since the enrollment was created — convert to what the
  // client should actually be charged.
  const rawAmountDue = status?.amount_due ?? 0;
  const rates = await getFxRates();
  const amountDue = convertCurrency(rawAmountDue, status?.currency ?? currency, currency, rates);

  return { isGatewayConnected, currency, enrollmentId: enrollment.id, amountDue };
}
