'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, Users, Plus, Minus, Ticket as TicketIcon, Heart, Gift, Link as LinkIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils';

// --- Define Types ---
interface TicketType {
  id: string;
  name: string;
  price: number;
  quantity_available: number;
  is_sold_out: boolean;
}

interface Organizer {
  id: string;
  business_name: string;
  profile_image_url: string | null;
}

interface Event {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  location: string;
  start_datetime: string;
  end_datetime: string;
  banner_image_url: string;
  sponsor_image_url?: string | null;
  organizer: Organizer;
  ticket_types?: TicketType[];
}

interface EventPreviewClientProps {
  event: Event | null;
  ticketTypes: TicketType[];
}

export default function EventPreviewClient({ event: initialEvent, ticketTypes: initialTicketTypes }: EventPreviewClientProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug as string;

  const [event, setEvent] = useState<Event | null>(initialEvent);
  const [loading, setLoading] = useState(!initialEvent);
  const [ticketQuantities, setTicketQuantities] = useState<{ [key: string]: number }>(() => {
    return initialTicketTypes.reduce((acc: any, tt: TicketType) => {
      acc[tt.id] = 0;
      return acc;
    }, {});
  });
  const [isFollowing, setIsFollowing] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoCodeSource, setPromoCodeSource] = useState<'url' | 'manual' | null>(null);

  // Fetch data client-side if not provided by server
  useEffect(() => {
    if (!initialEvent && slug) {
      const fetchEvent = async () => {
        try {
          setLoading(true);

          // Fetch event details
          const eventResponse = await api.events.getBySlug(slug);
          console.log('🎫 [EVENT PREVIEW] Event response:', eventResponse.data);

          const eventData = eventResponse.data;

          // Fetch ticket types separately
          let ticketTypes: TicketType[] = [];
          try {
            console.log('🎫 [EVENT PREVIEW] Fetching ticket types for event ID:', eventData.id);
            const ticketTypesResponse = await api.tickets.types.list(eventData.id);
            console.log('🎫 [EVENT PREVIEW] Raw ticket types response:', ticketTypesResponse);
            console.log('🎫 [EVENT PREVIEW] Response data:', ticketTypesResponse.data);

            ticketTypes = ticketTypesResponse.data || [];
            console.log('🎫 [EVENT PREVIEW] Ticket types array:', ticketTypes);
            console.log('🎫 [EVENT PREVIEW] Ticket types count:', ticketTypes.length);
          } catch (ticketError: any) {
            console.error('❌ [EVENT PREVIEW] Failed to fetch ticket types:', ticketError);
            console.error('❌ [EVENT PREVIEW] Error response:', ticketError.response?.data);
            console.error('❌ [EVENT PREVIEW] Error status:', ticketError.response?.status);
          }

          // Combine event data with ticket types
          const completeEvent = {
            ...eventData,
            ticket_types: ticketTypes
          };

          setEvent(completeEvent);

          // Initialize quantities
          const initialQuantities = ticketTypes.reduce((acc: any, tt: TicketType) => {
            acc[tt.id] = 0;
            return acc;
          }, {});

          console.log('🎫 [EVENT PREVIEW] Initial quantities:', initialQuantities);
          setTicketQuantities(initialQuantities);
        } catch (error) {
          console.error("❌ [EVENT PREVIEW] Failed to fetch event details:", error);
          router.push('/events');
        } finally {
          setLoading(false);
        }
      };

      fetchEvent();
    } else if (initialEvent) {
      // We have initial data from server, just set up ticket quantities
      const initialQuantities = initialTicketTypes.reduce((acc: any, tt: TicketType) => {
        acc[tt.id] = 0;
        return acc;
      }, {});
      setTicketQuantities(initialQuantities);
    }
  }, [initialEvent, slug, router, initialTicketTypes]);

  // Auto-apply promo code from URL parameter and track click
  useEffect(() => {
    const promoParam = searchParams?.get('promo');
    const source = searchParams?.get('source') || searchParams?.get('utm_source');
    const platform = searchParams?.get('platform') || searchParams?.get('utm_medium');

    if (promoParam && !promoCode) {
      const upperPromo = promoParam.toUpperCase();
      setPromoCode(upperPromo);
      setPromoCodeSource('url');
      console.log('🎁 [PROMO] Auto-applied promo code from URL:', upperPromo);

      // Track the click in the background (don't await, don't block UI)
      api.promoter.trackClick({
        code: upperPromo,
        source: source || 'direct',
        platform: platform || 'web'
      }).catch(err => {
        // Silent fail - tracking shouldn't break user experience
        console.warn('⚠️ [PROMO] Failed to track click:', err);
      });
    }
  }, [searchParams, promoCode]);

  const handleQuantityChange = (ticketTypeId: string, delta: number) => {
    setTicketQuantities(prev => {
      const newQuantity = (prev[ticketTypeId] || 0) + delta;
      return {
        ...prev,
        [ticketTypeId]: Math.max(0, newQuantity)
      };
    });
  };

  const totalCost = event?.ticket_types?.reduce((total, tt) => {
    return total + (ticketQuantities[tt.id] || 0) * tt.price;
  }, 0) || 0;

  const totalTickets = Object.values(ticketQuantities).reduce((total, qty) => total + qty, 0);

  const handleGetTickets = () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/events/${slug}`);
      return;
    }

    // Filter out ticket types with 0 quantity
    const selectedTickets: { [key: string]: number } = {};
    Object.entries(ticketQuantities).forEach(([typeId, qty]) => {
      if (qty > 0) {
        selectedTickets[typeId] = qty;
      }
    });

    // Validate that at least one ticket is selected
    if (Object.keys(selectedTickets).length === 0) {
      alert('Please select at least one ticket');
      return;
    }

    // Store checkout data in sessionStorage
    const checkoutData = {
      event: {
        id: event.id,
        slug: event.slug,
        title: event.title,
        start_datetime: event.start_datetime,
        end_datetime: event.end_datetime,
        location: event.location,
        banner_image_url: event.banner_image_url,
      },
      selectedTickets,
      ticketTypes: event.ticket_types || [],
      promoterCode: promoCode.trim() || null,
    };

    sessionStorage.setItem('checkout_data', JSON.stringify(checkoutData));

    // Navigate to checkout
    router.push('/checkout');
  };

  const handleFollowOrganizer = () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/events/${slug}`);
      return;
    }

    setIsFollowing(!isFollowing);
    console.log(`${isFollowing ? 'Unfollowed' : 'Followed'} organizer:`, event?.organizer.business_name);
  };

  // Loading skeleton
  if (loading || !event) {
    return (
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
  }

  const startDate = new Date(event.start_datetime);
  const endDate = new Date(event.end_datetime);

  return (
    <div className="bg-gray-50">
      {/* --- Hero Section --- */}
      <section className="relative h-[60vh] min-h-[400px] text-white">
        <div className="absolute inset-0">
          <Image
            src={getImageUrl(event.banner_image_url, '/hero/hero2.jpg')}
            alt={event.title}
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-end pb-12">
          <Badge variant="outline" className="mb-4 text-white border-white/50 bg-white/10 w-fit capitalize">{event.category.replace('_', ' ')}</Badge>
          <h1 className="text-4xl lg:text-6xl font-bold font-heading">{event.title}</h1>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-lg">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span>{format(startDate, 'E, MMM dd, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              <span>{event.location}</span>
            </div>
          </div>
        </div>
      </section>

      {/* --- Main Content --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-3 gap-x-12 gap-y-8">

          {/* Left Column: Details */}
          <div className="lg:col-span-2">
            <div className="prose prose-lg max-w-none">
              <h2 className="text-3xl font-bold font-comfortaa text-gray-900">About this Event</h2>
              <p className="font-body">{event.description}</p>
            </div>

            {/* Sponsor Section */}
            {event.sponsor_image_url && (
              <div className="mt-8 p-6 bg-white border rounded-xl">
                <h3 className="text-lg font-semibold text-gray-600 mb-4 font-comfortaa">Sponsored by</h3>
                <div className="flex items-center justify-center">
                  <div className="relative w-20 h-20">
                    <Image
                      src={getImageUrl(event.sponsor_image_url)}
                      alt="Sponsor"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="mt-12">
              <h3 className="text-2xl font-bold font-comfortaa text-gray-900 mb-4">Organizer</h3>
              <div className="flex items-center gap-4 bg-white p-4 rounded-xl border">
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200">
                  <Image
                    src={getImageUrl(event.organizer.profile_image_url, '/logo.png')}
                    alt={event.organizer.business_name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-lg text-gray-800">{event.organizer.business_name}</p>
                  <Button
                    variant={isFollowing ? "default" : "outline"}
                    size="sm"
                    className="mt-1"
                    onClick={handleFollowOrganizer}
                  >
                    <Heart className={`w-4 h-4 mr-1 ${isFollowing ? 'fill-current' : ''}`} />
                    {isFollowing ? 'Following' : 'Follow'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Ticket Box */}
          <div className="relative">
            <div className="lg:sticky lg:top-28 bg-white rounded-2xl shadow-2xl border">
              <div className="p-6">
                <h3 className="text-2xl font-bold font-comfortaa text-gray-900 mb-6">Get Your Tickets</h3>
                <div className="space-y-4">
                  {event.ticket_types && event.ticket_types.length > 0 ? event.ticket_types.map((tt) => (
                    <div key={tt.id} className="p-4 rounded-lg border">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-gray-800">{tt.name}</p>
                          <p className="text-primary font-semibold">KSh {tt.price.toLocaleString()}</p>
                        </div>
                        {tt.is_sold_out ? (
                          <Badge variant="destructive">Sold Out</Badge>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Button size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={() => handleQuantityChange(tt.id, -1)} disabled={ticketQuantities[tt.id] === 0}>
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-bold text-lg">{ticketQuantities[tt.id]}</span>
                            <Button size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={() => handleQuantityChange(tt.id, 1)}>
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8">
                      <TicketIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-700 font-semibold mb-2">Tickets Not Yet Available</p>
                      <p className="text-sm text-gray-500 mb-4">
                        The organizer hasn't added ticket types yet. Check back soon!
                      </p>
                      <p className="text-xs text-gray-400">
                        Tip: Organizers can add tickets from their dashboard
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {totalTickets > 0 && (
                <div className="border-t p-6 bg-gray-50/50 rounded-b-2xl space-y-4">
                  {/* Promo Code Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Have a Promo Code?
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => {
                          setPromoCode(e.target.value.toUpperCase());
                          setPromoCodeSource('manual');
                        }}
                        placeholder="Enter code"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        disabled={promoCodeSource === 'url'}
                      />
                      <Gift className="w-10 h-10 text-primary" />
                    </div>
                    {promoCode && promoCodeSource === 'url' && (
                      <div className="flex items-center gap-2 mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <LinkIcon className="w-4 h-4 text-blue-600" />
                        <p className="text-xs text-blue-700 flex-1">
                          Promo code "<span className="font-bold">{promoCode}</span>" was applied from your link!
                        </p>
                        <button
                          onClick={() => {
                            setPromoCode('');
                            setPromoCodeSource(null);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                    {promoCode && promoCodeSource === 'manual' && (
                      <p className="text-xs text-green-600 mt-1">✓ Code "{promoCode}" will be applied at checkout</p>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="font-semibold text-gray-700">Total</p>
                    <p className="text-2xl font-bold text-gray-900">KSh {totalCost.toLocaleString()}</p>
                  </div>
                  <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-white font-bold" onClick={handleGetTickets}>
                    Checkout ({totalTickets} {totalTickets === 1 ? 'Ticket' : 'Tickets'})
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}