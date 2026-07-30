import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
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
