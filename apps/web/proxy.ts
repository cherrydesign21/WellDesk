import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const PUBLIC_PATHS = [
  '/',
  '/about',
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

// welldesk.app is the marketing/SEO surface; my.welldesk.app is the product
// (dashboard, portal, admin, and all the auth pages that lead into it).
// /privacy and /terms deliberately stay reachable on both hosts — they're
// linked from inside the app as well as the marketing footer. Every other
// path belongs to exactly one side, so a request for it on the wrong host
// gets redirected across rather than 404ing or duplicating content.
const APP_HOST = 'my.welldesk.app';
const MARKETING_HOSTS = new Set(['welldesk.app', 'www.welldesk.app']);
const MARKETING_ONLY_PATHS = new Set(['/', '/about', '/contact', '/suggestions']);
const SHARED_PATHS = new Set(['/privacy', '/terms']);

export async function proxy(request: NextRequest) {
  const host = request.headers.get('host') ?? '';
  const isAppHost = host === APP_HOST;
  const isMarketingHost = MARKETING_HOSTS.has(host);

  // Local dev and Vercel preview deployments have neither hostname, so this
  // whole split is a no-op there — one server keeps answering every route,
  // exactly like before the two production hosts existed. API routes are
  // also skipped entirely — Vercel Cron and other server-to-server callers
  // hit whichever host is configured and may not follow redirects, and
  // there's no UX/SEO reason to redirect a JSON endpoint across hosts.
  if ((isAppHost || isMarketingHost) && !request.nextUrl.pathname.startsWith('/api/')) {
    const { pathname, search } = request.nextUrl;

    // The marketing landing page has no equivalent on the app host — send
    // root visits straight to login rather than across to welldesk.app.
    // Must run before the generic redirect below, which would otherwise
    // treat '/' as a marketing-only path and send it there instead.
    if (isAppHost && pathname === '/') {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (!SHARED_PATHS.has(pathname)) {
      const isMarketingOnlyPath = MARKETING_ONLY_PATHS.has(pathname);
      if (isAppHost && isMarketingOnlyPath) {
        return NextResponse.redirect(new URL(`https://welldesk.app${pathname}${search}`));
      }
      if (isMarketingHost && !isMarketingOnlyPath) {
        return NextResponse.redirect(new URL(`https://${APP_HOST}${pathname}${search}`));
      }
    }
  }

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
    // literal .html path, so this can't shadow real pages. llms.txt is the
    // same situation as robots.txt/sitemap.xml: a static public/ file with
    // no session, so it must never hit the !user redirect. opengraph-image
    // and twitter-image are Next.js's generated-image route handlers — their
    // URLs carry no file extension for the .png/.jpg exclusion below to
    // catch, so they need to be named explicitly too.
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sitemap.xml|robots.txt|llms.txt|opengraph-image|twitter-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|html)$).*)',
  ],
};
