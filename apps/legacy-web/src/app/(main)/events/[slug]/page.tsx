import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import EventPreviewClient from './EventPreviewClient';

// Use server-side API URL for SSR/metadata (works inside Docker network)
// Use client-side API URL for browser requests (works from host machine)
const API_BASE_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Helper to get full image URL for metadata
function getFullImageUrl(path: string | undefined | null): string {
  // Use a default image if path is not provided
  if (!path) {
    const safeBackendUrl = API_BASE_URL.replace(':3000', ':8000');
    return `${safeBackendUrl}/static/default-event.jpg`;
  }

  // If already a full URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Build full URL with backend
  const safeBackendUrl = API_BASE_URL.replace(':3000', ':8000');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${safeBackendUrl}${normalizedPath}`;
}

// Fetch event data for metadata and page
async function getEventData(slug: string) {
  try {
    // Fetch event details
    const eventUrl = `${API_BASE_URL}/api/v1/events/slug/${slug}`;
    console.log(`[METADATA] Fetching event from: ${eventUrl}`);

    const eventResponse = await fetch(eventUrl, {
      cache: 'no-store', // Always fetch fresh data for metadata
    });

    if (!eventResponse.ok) {
      console.error(`[METADATA] Event fetch failed with status: ${eventResponse.status}`);
      return null;
    }

    const eventData = await eventResponse.json();
    console.log(`[METADATA] Event data received:`, {
      title: eventData.title,
      hasOrganizer: !!eventData.organizer,
      hasBanner: !!eventData.banner_image_url,
      hasPortrait: !!eventData.portrait_image_url,
      hasSponsor: !!eventData.sponsor_image_url
    });

    // Fetch ticket types separately
    let ticketTypes: any[] = [];
    try {
      const ticketTypesResponse = await fetch(
        `${API_BASE_URL}/api/v1/tickets/events/${eventData.id}/ticket-types`,
        { cache: 'no-store' }
      );

      if (ticketTypesResponse.ok) {
        ticketTypes = await ticketTypesResponse.json();
        console.log(`[METADATA] Ticket types fetched: ${ticketTypes.length} types`);
      } else {
        console.error(`[METADATA] Ticket types fetch failed with status: ${ticketTypesResponse.status}`);
      }
    } catch (error) {
      console.error('Failed to fetch ticket types for metadata:', error);
    }

    console.log(`[METADATA] Returning data with ${ticketTypes.length} ticket types`);
    return { event: eventData, ticketTypes: ticketTypes || [] };
  } catch (error) {
    console.error('Failed to fetch event for metadata:', error);
    return null;
  }
}

// Generate dynamic metadata for SEO and Open Graph
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  console.log(`[METADATA] Generating metadata for slug: ${slug}`);

  const data = await getEventData(slug);

  if (!data || !data.event) {
    console.warn(`[METADATA] No event data found for slug: ${slug}`);
    return {
      title: 'Event Not Found - Klix',
      description: 'The event you are looking for could not be found.',
    };
  }

  const { event } = data;
  console.log(`[METADATA] Generating metadata for event: ${event.title}`);

  // Safely handle date formatting
  let formattedDate = 'Date TBA';
  if (event.start_datetime) {
    try {
      const eventDate = new Date(event.start_datetime);
      if (!isNaN(eventDate.getTime())) {
        formattedDate = eventDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }
    } catch (error) {
      console.error('Error formatting date for metadata:', error);
    }
  }

  // Generate SEO-friendly description
  const description = event.description
    ? event.description.slice(0, 160)
    : `Join us for ${event.title} on ${formattedDate} at ${event.location}. Get your tickets now!`;

  // Generate keywords
  const keywords = [
    event.title,
    event.category.replace('_', ' '),
    event.location,
    'event tickets',
    'Kenya events',
    event.organizer?.business_name || '',
    'buy tickets online',
    'event booking',
  ].filter(Boolean);

  // Get full image URL for OG - use portrait for better social media display
  const imageUrl = getFullImageUrl(event.portrait_image_url || event.banner_image_url);
  console.log(`[METADATA] Image URL for OG: ${imageUrl}`);

  // Site URL for canonical and OG
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://e-klix.com';
  const eventUrl = `${siteUrl}/events/${slug}`;

  console.log(`[METADATA] Final metadata:`, {
    title: `${event.title} - Klix Events`,
    description: description.substring(0, 50) + '...',
    imageUrl,
    eventUrl
  });

  return {
    title: `${event.title} - Klix Events`,
    description,
    keywords: keywords.join(', '),

    // Open Graph for Facebook, LinkedIn, etc.
    openGraph: {
      title: event.title,
      description,
      url: eventUrl,
      siteName: 'Klix',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: event.title,
        },
      ],
      locale: 'en_KE',
      type: 'website',
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: event.title,
      description,
      images: [imageUrl],
    },

    // Additional metadata
    alternates: {
      canonical: eventUrl,
    },

    // Structured data hints
    other: {
      'event:start_time': event.start_datetime,
      'event:end_time': event.end_datetime,
      'event:location': event.location,
    },
  };
}

// Skeleton Loader Component
const EventDetailSkeleton = () => (
  <div>
    <div className="h-[50vh] bg-gray-200 animate-wave"></div>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid lg:grid-cols-3 gap-12 -mt-16">
        <div className="lg:col-span-2">
          <div className="h-16 bg-gray-300 rounded-lg w-3/4 animate-wave mb-8"></div>
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-full animate-wave"></div>
            <div className="h-6 bg-gray-200 rounded w-full animate-wave"></div>
            <div className="h-6 bg-gray-200 rounded w-5/6 animate-wave"></div>
          </div>
        </div>
        <div className="relative">
          <div className="bg-white rounded-2xl shadow-2xl border p-6 h-96">
            <div className="h-8 bg-gray-300 rounded w-1/2 animate-wave mb-6"></div>
            <div className="h-12 bg-gray-200 rounded animate-wave mb-4"></div>
            <div className="h-12 bg-gray-200 rounded animate-wave"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Server Component - Main Page
export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  // Try to fetch data for initial render, but don't fail if it doesn't work
  // The client component will handle its own data fetching
  const { slug } = await params;
  const data = await getEventData(slug);

  // If we have data, pass it to client for faster initial render
  if (data && data.event) {
    console.log(`[PAGE] Passing to client: event=${data.event.title}, ticketTypes=${data.ticketTypes.length}`);
    return <EventPreviewClient event={data.event} ticketTypes={data.ticketTypes} />;
  }

  // Otherwise, let the client component fetch on its own
  // This handles cases where server-side fetch fails (common in dev)
  return <EventPreviewClient event={null} ticketTypes={[]} />;
}
