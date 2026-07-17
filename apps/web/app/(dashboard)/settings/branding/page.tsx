import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { BrandingForm } from '@/components/settings/branding-form';

export default async function BrandingSettingsPage() {
  const supabase = await createClient();
  const result = await getCurrentProfile(supabase);
  if (!result) return null;

  const { data: practice } = await supabase
    .from('practices')
    .select('id, name, tagline, logo_url, primary_color, font_choice')
    .eq('id', result.profile.practice_id)
    .single();

  if (!practice) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Branding</h1>
        <p className="text-sm text-muted-foreground">
          Shown on your dashboard and on every exported PDF and shared plan.
        </p>
      </div>
      <BrandingForm
        practiceId={practice.id}
        initialLogoUrl={practice.logo_url}
        initialValues={{
          name: practice.name,
          tagline: practice.tagline ?? '',
          primaryColor: practice.primary_color,
          fontChoice: practice.font_choice,
        }}
      />
    </div>
  );
}
