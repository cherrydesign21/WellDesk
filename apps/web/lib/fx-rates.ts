import { createAdminClient } from './supabase/admin';

const FX_API_BASE = 'https://open.er-api.com/v6/latest';
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const BASE_CURRENCY = 'USD';

export type FxRates = Record<string, number>;

// Cached in Postgres (one row, base=USD) rather than refetched on every
// request — a serverless function invocation has no reliable in-memory
// cache to carry between requests, so the DB is the only place a 24h
// cache can actually live. Every currency pair is derived from this one
// USD-based table (see convertCurrency in @welldesk/shared).
export async function getFxRates(): Promise<FxRates> {
  const admin = createAdminClient();

  const { data: cached } = await admin
    .from('fx_rates')
    .select('rates, fetched_at')
    .eq('base_currency', BASE_CURRENCY)
    .maybeSingle();

  if (cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_MAX_AGE_MS) {
    return cached.rates as FxRates;
  }

  try {
    const res = await fetch(`${FX_API_BASE}/${BASE_CURRENCY}`);
    if (!res.ok) throw new Error(`FX API returned ${res.status}`);
    const json = await res.json();
    if (json.result !== 'success' || !json.rates) throw new Error('FX API returned an unexpected payload');

    const rates = json.rates as FxRates;
    await admin
      .from('fx_rates')
      .upsert({ base_currency: BASE_CURRENCY, rates, fetched_at: new Date().toISOString() });
    return rates;
  } catch (err) {
    // A stale cache is still far better than no conversion at all — only
    // throw if we have genuinely nothing to fall back to.
    if (cached) return cached.rates as FxRates;
    console.error('[fx-rates] fetch failed with no cache to fall back to:', (err as Error).message);
    throw err;
  }
}
