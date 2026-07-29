import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';

// Falls back to USDA's shared DEMO_KEY (30 req/hour, 50/day) when no key is
// configured, so this works with zero setup — a free key from
// fdc.nal.usda.gov/api-key-signup raises that to 1,000 req/hour.
const API_KEY = process.env.USDA_FDC_API_KEY ?? 'DEMO_KEY';

type UsdaNutrient = { nutrientId: number; nutrientName: string; unitName: string; value: number };
type UsdaFood = {
  fdcId: number;
  description: string;
  dataType: string;
  foodNutrients: UsdaNutrient[];
};

function pickNutrient(nutrients: UsdaNutrient[], id: number) {
  const match = nutrients.find((n) => n.nutrientId === id);
  return match ? Math.round(match.value * 10) / 10 : null;
}

export type FoodSearchResult = {
  fdcId: number;
  description: string;
  calories: number | null;
  proteinG: number | null;
  fatG: number | null;
  carbsG: number | null;
};

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const result = await getCurrentProfile(supabase);
  if (!result) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const query = new URL(request.url).searchParams.get('q')?.trim();
  if (!query) {
    return NextResponse.json({ results: [] });
  }

  const usdaUrl = new URL('https://api.nal.usda.gov/fdc/v1/foods/search');
  usdaUrl.searchParams.set('api_key', API_KEY);
  usdaUrl.searchParams.set('query', query);
  usdaUrl.searchParams.set('pageSize', '10');
  // Excludes 'Branded' — packaged-product entries carry manufacturer-submitted
  // serving sizes that are frequently tiny or mislabeled (e.g. a "banana"
  // branded item at 312 kcal per 32g), misleading next to the generic
  // per-100g values dietitians actually expect. These three types are all
  // reliably per-100g. USDA's API wants this as repeated params, not a
  // single comma-joined value (which 400s).
  for (const type of ['Foundation', 'SR Legacy', 'Survey (FNDDS)']) {
    usdaUrl.searchParams.append('dataType', type);
  }

  const res = await fetch(usdaUrl);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    return NextResponse.json({ error: `USDA lookup failed (${res.status}): ${body}` }, { status: 502 });
  }

  const data = (await res.json()) as { foods: UsdaFood[] };

  const results: FoodSearchResult[] = (data.foods ?? []).map((f) => ({
    fdcId: f.fdcId,
    description: f.description,
    calories: pickNutrient(f.foodNutrients, 1008),
    proteinG: pickNutrient(f.foodNutrients, 1003),
    fatG: pickNutrient(f.foodNutrients, 1004),
    carbsG: pickNutrient(f.foodNutrients, 1005),
  }));

  return NextResponse.json({ results });
}
