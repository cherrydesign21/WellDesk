import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { PaymentSettingsForm } from '@/components/settings/payment-settings-form';

export default async function PaymentSettingsPage() {
  const supabase = await createClient();
  const result = await getCurrentProfile(supabase);
  if (!result) return null;

  // Queried separately, same reasoning as the branding page's contact info
  // split: a not-yet-run migration for these columns shouldn't take down the
  // whole settings page. key_secret is fetched only to derive a boolean —
  // it's never spread into the client props below.
  const { data: gateway } = await supabase
    .from('practices')
    .select('razorpay_key_id, razorpay_key_secret, currency')
    .eq('id', result.profile.practice_id)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Payments</h1>
        <p className="text-sm text-muted-foreground">
          Connect your own Razorpay account so clients can pay online from their portal — money goes straight to
          your bank, WellDesk never holds or forwards it.
        </p>
      </div>
      <PaymentSettingsForm
        isConnected={Boolean(gateway?.razorpay_key_id && gateway?.razorpay_key_secret)}
        keyId={gateway?.razorpay_key_id ?? ''}
        currency={gateway?.currency ?? 'INR'}
      />
    </div>
  );
}
