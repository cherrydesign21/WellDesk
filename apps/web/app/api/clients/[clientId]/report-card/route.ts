import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { getPlanWithMeals } from '@/lib/diet-plans';
import { calculateIdealWeightKg, type Gender } from '@welldesk/shared';
import { renderReportCardPdf } from '@/lib/exports/report-card';

export async function GET(_request: Request, { params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;

  const supabase = await createClient();
  const result = await getCurrentProfile(supabase);
  if (!result) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: client } = await supabase
    .from('clients')
    .select('full_name, gender')
    .eq('id', clientId)
    .single();

  if (!client) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('plan_type, expiry_date')
    .eq('client_id', clientId)
    .order('cycle_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: metrics } = await supabase
    .from('health_metrics')
    .select(
      'recorded_at, weight_kg, height_cm, systolic_bp, diastolic_bp, blood_sugar_fasting, waist_cm, body_fat_pct, target_weight_kg'
    )
    .eq('client_id', clientId)
    .order('recorded_at', { ascending: true });

  const weightPoints = (metrics ?? [])
    .filter((m) => m.weight_kg != null)
    .map((m) => ({ date: m.recorded_at.slice(0, 10), weight: m.weight_kg as number }));

  let lastHeight: number | null = null;
  for (const m of metrics ?? []) {
    if (m.height_cm) lastHeight = m.height_cm;
  }

  const latest = metrics && metrics.length > 0 ? metrics[metrics.length - 1] : null;
  const latestMetrics = latest
    ? {
        recorded_at: latest.recorded_at,
        weight_kg: latest.weight_kg,
        bmi:
          latest.weight_kg && lastHeight
            ? Math.round((latest.weight_kg / ((lastHeight / 100) * (lastHeight / 100))) * 10) / 10
            : null,
        systolic_bp: latest.systolic_bp,
        diastolic_bp: latest.diastolic_bp,
        blood_sugar_fasting: latest.blood_sugar_fasting,
        waist_cm: latest.waist_cm,
        body_fat_pct: latest.body_fat_pct,
        target_weight_kg: latest.target_weight_kg,
      }
    : null;

  const { data: activePlan } = await supabase
    .from('diet_plans')
    .select('id')
    .eq('client_id', clientId)
    .eq('is_template', false)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const currentDietPlan = activePlan ? await getPlanWithMeals(supabase, activePlan.id) : null;

  const practice = result.profile.practices ?? { name: 'WellDesk', tagline: null, primary_color: null };

  const blob = await renderReportCardPdf(
    {
      client: { full_name: client.full_name, gender: client.gender },
      enrollment,
      weightPoints,
      latestMetrics,
      idealWeightKg: lastHeight ? calculateIdealWeightKg(lastHeight, client.gender as Gender | null) : null,
      currentDietPlan: currentDietPlan
        ? {
            name: currentDietPlan.name,
            meals: currentDietPlan.diet_plan_meals.map((m) => ({
              slot_name: m.slot_name,
              items: m.diet_plan_meal_items.map((i) => ({
                food_item: i.food_item,
                quantity: i.quantity,
                calories: i.calories,
              })),
            })),
          }
        : null,
    },
    practice
  );

  const filename = client.full_name.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'report-card';

  return new NextResponse(blob, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}-report-card.pdf"`,
    },
  });
}
