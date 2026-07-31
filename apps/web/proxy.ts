import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/portal/login',
  '/portal/forgot-password',
  '/privacy',
  '/terms',
  '/contact',
  '/suggestions',
];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPortalPath = pathname.startsWith('/portal');

  // Login/register pages check their own identity (dietitian profile vs
  // client) and redirect forward themselves when already authenticated —
  // this proxy only ever redirects unauthenticated visitors *toward* the
  // correct login page, never away from one, so it can't loop against a
  // page-level redirect the other direction.
  // API routes authenticate themselves (session check, or a bearer secret
  // for cron routes) and return a proper JSON error — redirecting an API
  // caller to an HTML login page instead of a 401 is wrong for all of them,
  // not just cron, and it's what was silently breaking the cron endpoint.
  const isPublicPath =
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/share/') ||
    pathname.startsWith('/portal/auth/') ||
    pathname.startsWith('/api/');

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = isPortalPath ? '/portal/login' : '/login';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // .html is excluded for search-engine site-verification files (e.g.
    // Google's google<token>.html) — no app route ever resolves to a
    // literal .html path, so this can't shadow real pages.
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|html)$).*)',
  ],
};
