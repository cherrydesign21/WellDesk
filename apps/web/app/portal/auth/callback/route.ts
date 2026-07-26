import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/portal/set-password`);
    }
  }

  // No `code` means Supabase fell back to the implicit flow (e.g. the link
  // was opened on a different browser/device than the one that requested
  // it) and appended the session as a `#access_token=...` fragment instead,
  // which never reaches the server — hand off to the client page that reads
  // it directly (shared with the dietitian-side callback).
  return NextResponse.redirect(`${origin}/auth/callback/complete?next=${encodeURIComponent('/portal/set-password')}`);
}
