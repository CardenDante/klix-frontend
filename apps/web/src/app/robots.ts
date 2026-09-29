import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/utils';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/organizer', '/admin', '/staff', '/promoter', '/account', '/checkout', '/orders', '/tickets', '/reset-password', '/verify-email'] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
