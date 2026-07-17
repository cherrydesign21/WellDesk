import { createClient } from '@supabase/supabase-js';

// Server-only, bypasses RLS. Never import this from a 'use client' file.
// Reserved for lookups that must work without an authenticated session,
// e.g. resolving a public diet-plan share token by its exact value.
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
