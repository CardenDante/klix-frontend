import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/utils';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/organizer', '/admin', '/staff', '/checkout', '/orders', '/tickets'] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
