import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import EventPreviewClient from './EventPreviewClient';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Helper to get full image URL
function getFullImageUrl(path: string | undefined): string {
  if (!path) return `${API_BASE_URL}/static/default-event.jpg`;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const safeBackendUrl = API_BASE_URL.replace(':3000', ':8000');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${safeBackendUrl}${normalizedPath}`;
}

// Fetch event data for metadata and page
async function getEventData(slug: string) {
  try {
    // Fetch event details
    const eventResponse = await fetch(`${API_BASE_URL}/api/v1/events/slug/${slug}`, {
      cache: 'no-store', // Always fetch fresh data for metadata
    });

    if (!eventResponse.ok) {
      return null;
    }

    const eventData = await eventResponse.json();

    // Fetch ticket types separately
    let ticketTypes: any[] = [];
    try {
      const ticketTypesResponse = await fetch(
        `${API_BASE_URL}/api/v1/tickets/events/${eventData.id}/ticket-types`,
        { cache: 'no-store' }
      );

      if (ticketTypesResponse.ok) {
        ticketTypes = await ticketTypesResponse.json();
      }
    } catch (error) {
      console.error('Failed to fetch ticket types for metadata:', error);
    }

    return { event: eventData, ticketTypes: ticketTypes || [] };
  } catch (error) {
    console.error('Failed to fetch event for metadata:', error);
    return null;
  }
}

// Generate dynamic metadata for SEO and Open Graph
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const data = await getEventData(params.slug);

  if (!data || !data.event) {
    return {
      title: 'Event Not Found - Klix',
      description: 'The event you are looking for could not be found.',
    };
  }

  const { event } = data;
  const eventDate = new Date(event.start_datetime);
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

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

  // Get full image URL for OG
  const imageUrl = getFullImageUrl(event.banner_image_url);

  // Site URL for canonical and OG
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const eventUrl = `${siteUrl}/events/${params.slug}`;

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
export default async function EventDetailPage({ params }: { params: { slug: string } }) {
  const data = await getEventData(params.slug);

  if (!data || !data.event) {
    notFound();
  }

  const { event, ticketTypes } = data;

  return <EventPreviewClient event={event} ticketTypes={ticketTypes} />;
}
