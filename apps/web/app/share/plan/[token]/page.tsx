import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPlanWithMeals } from '@/lib/diet-plans';
import { PlanView } from '@/components/diet-plans/plan-view';
import { CURATED_FONTS } from '@welldesk/shared';

export default async function SharedPlanPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data: planRow } = await supabase
    .from('diet_plans')
    .select('id, practice_id')
    .eq('share_token', token)
    .maybeSingle();

  if (!planRow) notFound();

  const plan = await getPlanWithMeals(supabase, planRow.id);
  if (!plan) notFound();

  const { data: practice } = await supabase
    .from('practices')
    .select('name, tagline, logo_url, primary_color, font_choice')
    .eq('id', planRow.practice_id)
    .single();

  const font = CURATED_FONTS.find((f) => f.id === practice?.font_choice);

  return (
    <>
      {font && (
        <link
          rel="stylesheet"
          href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(font.label)}:wght@400;600;700&display=swap`}
        />
      )}
      <div className="mx-auto max-w-2xl space-y-6 p-6" style={{ fontFamily: font?.stack }}>
        {practice && (
          <div className="flex items-center gap-3 border-b pb-4">
            {practice.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={practice.logo_url} alt="" className="h-10 w-10 rounded object-contain" />
            )}
            <div>
              <p className="text-lg font-semibold" style={{ color: practice.primary_color ?? undefined }}>
                {practice.name}
              </p>
              {practice.tagline && <p className="text-sm text-muted-foreground">{practice.tagline}</p>}
            </div>
          </div>
        )}
        <PlanView plan={plan} />
      </div>
    </>
  );
}
