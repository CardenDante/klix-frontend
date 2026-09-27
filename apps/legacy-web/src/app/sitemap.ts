import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://e-klix.com'
  const now = new Date()

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/events`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/become-organizer`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/become-promoter`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]

  try {
    // Fetch events from API for dynamic sitemap
    const response = await fetch(`https://api.e-klix.com/api/v1/events?limit=1000&is_published=true`, {
      next: { revalidate: 3600 }, // Revalidate every hour
      headers: {
        'Accept': 'application/json',
      }
    })

    if (response.ok) {
      const data = await response.json()
      const events = data.data || data

      const eventPages: MetadataRoute.Sitemap = events
        .filter((event: any) => event.slug) // Only include events with slugs
        .map((event: any) => {
          // Safely parse date or use current date as fallback
          let lastModified = now
          try {
            const dateStr = event.updated_at || event.created_at
            if (dateStr) {
              const parsedDate = new Date(dateStr)
              if (!isNaN(parsedDate.getTime())) {
                lastModified = parsedDate
              }
            }
          } catch (e) {
            // Use default date if parsing fails
          }

          return {
            url: `${baseUrl}/events/${event.slug}`,
            lastModified,
            changeFrequency: 'weekly' as const,
            priority: 0.8,
          }
        })

      return [...staticPages, ...eventPages]
    }
  } catch (error) {
    console.error('Error fetching events for sitemap:', error)
  }

  return staticPages
}
