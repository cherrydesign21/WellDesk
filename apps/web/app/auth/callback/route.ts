import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // No `code` in the query string usually means the link was opened on a
  // different browser/device than the one that requested it, so there was
  // no matching PKCE code_verifier cookie — Supabase falls back to the
  // implicit flow and appends the session as a `#access_token=...` URL
  // fragment instead. Fragments never reach the server, so hand off to a
  // client page that can read it directly.
  return NextResponse.redirect(`${origin}/auth/callback/complete?next=${encodeURIComponent(next)}`);
}
