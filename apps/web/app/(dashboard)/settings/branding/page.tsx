import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { BrandingForm } from '@/components/settings/branding-form';

export default async function BrandingSettingsPage() {
  const supabase = await createClient();
  const result = await getCurrentProfile(supabase);
  if (!result) return null;

  const { data: practice } = await supabase
    .from('practices')
    .select('id, name, tagline, logo_url')
    .eq('id', result.profile.practice_id)
    .single();

  if (!practice) return null;

  // Queried separately so a not-yet-run migration for these two columns
  // can't take down the whole page — worst case, the fields start blank.
  const { data: contactInfo } = await supabase
    .from('practices')
    .select('contact_phone, contact_email')
    .eq('id', result.profile.practice_id)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Branding</h1>
        <p className="text-sm text-muted-foreground">
          Your logo appears on your dashboard. Contact phone/email are shown to clients in their portal.
        </p>
      </div>
      <BrandingForm
        practiceId={practice.id}
        initialLogoUrl={practice.logo_url}
        initialValues={{
          name: practice.name,
          tagline: practice.tagline ?? '',
          contactPhone: contactInfo?.contact_phone ?? '',
          contactEmail: contactInfo?.contact_email ?? '',
        }}
      />
    </div>
  );
}
