import type { MetadataRoute } from 'next';
import { fetchEvents } from '@/lib/api/server';
import { SITE_URL } from '@/lib/utils';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const events = await fetchEvents({ page_size: 100 }, 3600);
  return [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/events`, changeFrequency: 'hourly', priority: 0.9 },
    ...['/become-organizer', '/become-promoter', '/pricing', '/about', '/contact', '/careers', '/safety', '/terms', '/privacy', '/leaderboard'].map(
      (path) => ({ url: `${SITE_URL}${path}`, changeFrequency: 'monthly' as const, priority: 0.5 }),
    ),
    ...(events?.data ?? []).map((e) => ({
      url: `${SITE_URL}/events/${e.slug}`,
      lastModified: e.updated_at,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
  ];
}
