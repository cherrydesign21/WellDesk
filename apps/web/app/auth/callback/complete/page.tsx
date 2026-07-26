'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function AuthCallbackCompleteInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const next = searchParams.get('next') ?? '/';
    const supabase = createClient();

    // @supabase/ssr's browser client hardcodes flowType: 'pkce', so its
    // built-in getSession()/detectSessionInUrl auto-detection actively
    // rejects an implicit-flow `#access_token=...` fragment as a flow
    // mismatch (silently — no session, no error). Parse the fragment
    // ourselves and hand the tokens to setSession(), which doesn't care
    // which flow produced them.
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    let cancelled = false;

    async function run() {
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (cancelled) return;
        if (!error) {
          router.replace(next);
          return;
        }
      }
      if (!cancelled) setFailed(true);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  if (failed) {
    const next = searchParams.get('next') ?? '/';
    const loginHref = next.startsWith('/portal') ? '/portal/login' : '/login';
    return (
      <div className="flex min-h-svh items-center justify-center p-6 text-center">
        <div>
          <h1 className="mb-2 text-xl font-semibold">Link expired or invalid</h1>
          <p className="mb-4 text-sm text-muted-foreground">Please request a new password reset link.</p>
          <Link href={loginHref} className="text-sm font-medium text-primary hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-6 text-center text-sm text-muted-foreground">
      Signing you in…
    </div>
  );
}

export default function AuthCallbackCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center p-6 text-center text-sm text-muted-foreground">
          Signing you in…
        </div>
      }
    >
      <AuthCallbackCompleteInner />
    </Suspense>
  );
}
