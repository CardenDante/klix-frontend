import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://e-klix.com'

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/events`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/become-organizer`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/become-promoter`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]

  try {
    // Fetch events from API for dynamic sitemap
    const response = await fetch(`https://api.e-klix.com/api/v1/events?limit=1000&is_published=true`, {
      next: { revalidate: 3600 } // Revalidate every hour
    })

    if (response.ok) {
      const data = await response.json()
      const events = data.data || data

      const eventPages: MetadataRoute.Sitemap = events.map((event: any) => ({
        url: `${baseUrl}/events/${event.slug}`,
        lastModified: new Date(event.updated_at || event.created_at),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))

      return [...staticPages, ...eventPages]
    }
  } catch (error) {
    console.error('Error fetching events for sitemap:', error)
  }

  return staticPages
}
