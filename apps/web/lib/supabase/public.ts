import { createClient } from '@supabase/supabase-js';

// Anon-key client that never touches cookies() — safe to call from a
// statically-generated or ISR-revalidated page (e.g. the landing page's
// testimonials fetch) without opting the route into per-request dynamic
// rendering. Only ever reaches rows RLS already exposes to anonymous users.
export function createPublicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
