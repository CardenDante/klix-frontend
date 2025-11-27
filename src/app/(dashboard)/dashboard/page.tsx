'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useOrganizer } from '@/hooks/useOrganizer';
import { usePromoter } from '@/hooks/usePromoter';
import { UserRole } from '@/lib/types';
import { ticketsApi } from '@/lib/api/tickets';
import apiClient from '@/lib/api-client';
import { Ticket, Calendar, TrendingUp, Crown, Users, DollarSign, BarChart3, ArrowRight, Gift, Star, MapPin, Clock, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getImageUrl } from '@/lib/utils';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { organizerProfile, isPending: orgPending, isApproved: orgApproved, isRejected: orgRejected, loading: orgLoading } = useOrganizer();
  const { promoterProfile, isPending: promPending, isApproved: promApproved, isRejected: promRejected, loading: promLoading, hasApplication } = usePromoter();

  useEffect(() => {
    if (authLoading || orgLoading || promLoading) return;
    if (!user) return;

    console.log('🔀 [DASHBOARD REDIRECT] User role:', user.role);
    console.log('📊 [ORGANIZER STATUS]', { orgPending, orgApproved, orgRejected, hasProfile: !!organizerProfile });
    console.log('📣 [PROMOTER STATUS]', { promPending, promApproved, promRejected, hasApplication });

    // Route based on user role and application status
    switch (user.role) {
      case UserRole.ADMIN:
        console.log('👑 [REDIRECT] Admin → /admin');
        router.push('/admin');
        break;

      case UserRole.ORGANIZER:
        if (orgPending) {
          console.log('⏳ [REDIRECT] Organizer pending → /dashboard/application-status');
          router.push('/dashboard/application-status');
        } else if (orgApproved) {
          console.log('✅ [REDIRECT] Organizer approved → /organizer');
          router.push('/organizer');
        } else if (orgRejected) {
          console.log('❌ [REDIRECT] Organizer rejected → /dashboard/application-status');
          router.push('/dashboard/application-status');
        } else if (!organizerProfile) {
          // Has organizer role but no application (shouldn't happen, but handle it)
          console.log('⚠️ [REDIRECT] Organizer role but no profile → /become-organizer');
          router.push('/become-organizer');
        }
        break;

      case UserRole.PROMOTER:
        if (!hasApplication) {
          // Has promoter role but no application (shouldn't happen)
          console.log('⚠️ [REDIRECT] Promoter role but no application → /become-promoter');
          router.push('/become-promoter');
        } else if (promPending) {
          console.log('⏳ [REDIRECT] Promoter pending → /dashboard/promoter-application-status');
          router.push('/dashboard/promoter-application-status');
        } else if (promApproved) {
          console.log('✅ [REDIRECT] Promoter approved → /promoter');
          router.push('/promoter');
        } else if (promRejected) {
          console.log('❌ [REDIRECT] Promoter rejected → /dashboard/promoter-application-status');
          router.push('/dashboard/promoter-application-status');
        }
        break;

      case UserRole.EVENT_STAFF:
        console.log('🎫 [REDIRECT] Event Staff → /staff');
        router.push('/staff');
        break;

      case UserRole.ATTENDEE:
      case UserRole.GUEST:
      default:
        console.log('👤 [REDIRECT] Attendee → Stay on dashboard');
        // Stay on this page (attendee dashboard)
        break;
    }
  }, [
    user,
    authLoading,
    orgLoading,
    promLoading,
    orgPending,
    orgApproved,
    orgRejected,
    organizerProfile,
    promPending,
    promApproved,
    promRejected,
    hasApplication,
    promoterProfile,
    router
  ]);

  if (authLoading || orgLoading || promLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user is being redirected, show loading
  if (user?.role !== UserRole.ATTENDEE && user?.role !== UserRole.GUEST) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600 font-body">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  // ATTENDEE DASHBOARD (render below)
  return <AttendeeDashboard user={user} />;
}

function AttendeeDashboard({ user }: { user: any }) {
  const router = useRouter();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loyaltyBalance, setLoyaltyBalance] = useState(0);
  const [recommendedEvents, setRecommendedEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch tickets
      const ticketsRes = await ticketsApi.getMyTickets();
      setTickets(ticketsRes || []);

      // Fetch loyalty balance
      try {
        const loyaltyRes = await apiClient.get('/api/v1/loyalty/balance');
        setLoyaltyBalance(loyaltyRes.data?.available_credits || 0);
      } catch (err) {
        console.log('Loyalty not available:', err);
      }

      // Fetch recommendations
      try {
        const recsRes = await apiClient.get('/api/v1/recommendations/for-you', {
          params: { limit: 4 }
        });
        setRecommendedEvents(recsRes.data?.recommendations || []);
      } catch (err) {
        console.log('Recommendations not available:', err);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const upcomingTickets = tickets.filter(t => {
    const eventDate = new Date(t.event?.start_datetime);
    return eventDate >= new Date() && t.status === 'confirmed';
  });

  const totalSpent = tickets.reduce((sum, t) => sum + parseFloat(t.final_price || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 font-heading tracking-tight">
          Welcome back, <span className="gradient-text font-playful pr-2">{user?.first_name || 'there'}!</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mt-4 font-body">
          Here's a look at your upcoming events and rewards.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        <Card className="transform hover:-translate-y-1 transition-transform">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Ticket className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1 font-body">Upcoming Events</p>
            <p className="text-3xl font-bold text-gray-900 font-comfortaa">{upcomingTickets.length}</p>
            {upcomingTickets.length > 0 && (
              <Link href="/dashboard/tickets" className="text-sm text-blue-600 hover:underline font-body mt-2 inline-block">
                View all tickets <ArrowRight className="inline w-3 h-3" />
              </Link>
            )}
          </CardContent>
        </Card>

        <Card className="transform hover:-translate-y-1 transition-transform">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1 font-body">Total Tickets</p>
            <p className="text-3xl font-bold text-gray-900 font-comfortaa">{tickets.length}</p>
            <p className="text-sm text-gray-500 font-body mt-2">
              KSh {totalSpent.toLocaleString()} spent
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 transform hover:-translate-y-1 transition-transform col-span-2 md:col-span-1">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Crown className="h-6 w-6 text-primary" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1 font-body">Loyalty Credits</p>
            <p className="text-3xl font-bold text-gray-900 font-comfortaa">
              {loyaltyBalance > 0 ? loyaltyBalance : 0}
            </p>
            {loyaltyBalance > 0 && (
              <Link href="/dashboard/loyalty" className="text-sm text-orange-600 hover:underline font-body mt-2 inline-block">
                Redeem credits <ArrowRight className="inline w-3 h-3" />
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* CTA Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          className="bg-gradient-to-br from-primary to-orange-400 text-white rounded-2xl p-8 flex flex-col justify-between items-start cursor-pointer transform hover:scale-105 transition-transform"
          onClick={() => router.push('/become-organizer')}
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-5 h-5" />
              <Badge className="bg-white/20 text-white border-white/30">New</Badge>
            </div>
            <h3 className="text-xl font-bold mb-2 font-comfortaa">Become an Organizer</h3>
            <p className="opacity-90 font-body mb-4 text-sm">
              Start creating and managing events. Earn from ticket sales.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="bg-white text-primary hover:bg-gray-100"
          >
            Learn More
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
        <div
          className="bg-gradient-to-br from-purple-600 to-purple-800 text-white rounded-2xl p-8 flex flex-col justify-between items-start cursor-pointer transform hover:scale-105 transition-transform"
          onClick={() => router.push('/become-promoter')}
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5" />
              <Badge className="bg-white/20 text-white border-white/30">Hot</Badge>
            </div>
            <h3 className="text-xl font-bold mb-2 font-comfortaa">Become a Promoter</h3>
            <p className="opacity-90 font-body mb-4 text-sm">
              Earn commission by promoting events to your audience.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="bg-white text-purple-700 hover:bg-gray-100"
          >
            Start Earning
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Upcoming Tickets */}
      {upcomingTickets.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 font-comfortaa">Your Upcoming Events</h2>
              <Link href="/dashboard/tickets">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingTickets.slice(0, 3).map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex flex-col sm:flex-row items-center gap-4 p-4 border rounded-lg hover:border-primary transition cursor-pointer"
                  onClick={() => router.push(`/dashboard/tickets`)}
                >
                  <div className="w-full sm:w-20 h-24 sm:h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    {ticket.event?.banner_image_url ? (
                      <img
                        src={getImageUrl(ticket.event.banner_image_url)}
                        alt={ticket.event.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Ticket className="w-8 h-8 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-center sm:text-left">
                    <h3 className="font-semibold text-gray-900 font-comfortaa truncate">{ticket.event?.title}</h3>
                    <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-x-3 gap-y-1 text-sm text-gray-600 mt-1 font-body">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(ticket.event?.start_datetime).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {ticket.event?.location?.split(',')[0]}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 sm:mt-0"
                  >
                    View Ticket
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommended Events */}
      {recommendedEvents.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 font-comfortaa">Recommended For You</h2>
              <Link href="/events">
                <Button variant="ghost" size="sm">
                  Browse All
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recommendedEvents.slice(0, 4).map((event) => (
                <div
                  key={event.id}
                  className="border rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer transform hover:-translate-y-1"
                  onClick={() => router.push(`/events/${event.slug}`)}
                >
                  <div className="h-40 bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    {event.banner_image_url ? (
                      <img src={getImageUrl(event.banner_image_url)} alt={event.title} className="w-full h-full object-cover" />
                    ) : (
                      <Calendar className="w-12 h-12 text-primary" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 font-comfortaa line-clamp-2">{event.title}</h3>
                    <p className="text-sm text-gray-600 flex items-center gap-1 font-body">
                      <Clock className="w-4 h-4" />
                      {new Date(event.start_datetime).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {tickets.length === 0 && (
        <Card className="text-center py-16 bg-gray-50 border-dashed">
          <CardContent>
            <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2 font-comfortaa">Your dashboard is empty</h3>
            <p className="text-gray-600 mb-6 font-body">
              It's time to find your next unforgettable experience.
            </p>
            <Button onClick={() => router.push('/events')} size="lg">
              Browse Events
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}