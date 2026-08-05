import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      // /portal/login and /portal/forgot-password are the two portal paths
      // that are actually public (see proxy.ts's PUBLIC_PATHS) — carved out
      // as exceptions since they're more specific than the /portal/ disallow
      // below and take precedence under the standard robots.txt rules.
      allow: ['/', '/portal/login', '/portal/forgot-password'],
      disallow: [
        '/api/',
        '/admin/',
        '/dashboard/',
        '/portal/',
        '/clients/',
        '/appointments/',
        '/payments/',
        '/messages/',
        '/diet-plans/',
        '/settings/',
      ],
    },
    sitemap: 'https://www.welldesk.app/sitemap.xml',
  };
}
