import type { MetadataRoute } from 'next';

import { siteUrl } from '@/lib/locale-params';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/*/account',
        '/*/admin',
        '/*/cart',
        '/*/checkout',
        '/*/login',
        '/*/register',
        '/*/reset-password',
        '/*/verify-email',
        '/*/forgot-password',
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
