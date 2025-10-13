'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useOrganizer } from '@/hooks/useOrganizer';
import { UserRole } from '@/lib/types';
import { ticketsApi } from '@/lib/api/tickets';
import apiClient from '@/lib/api-client';
import { Ticket, Calendar, TrendingUp, Crown, Users, DollarSign, BarChart3, ArrowRight, Gift, Star, MapPin, Clock, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { organizerProfile, isPending, isApproved, isRejected, loading: orgLoading } = useOrganizer();

  useEffect(() => {
    if (authLoading || orgLoading) return;
    if (!user) return;

    // Route based on user role
    switch (user.role) {
      case UserRole.ADMIN:
        router.push('/admin/analytics');
        break;

      case UserRole.ORGANIZER:
        if (isPending) {
          router.push('/dashboard/application-status');
        } else if (isApproved) {
          router.push('/organizer');
        } else if (isRejected) {
          router.push('/dashboard/application-status');
        } else if (!organizerProfile) {
          router.push('/dashboard/apply-organizer');
        }
        break;

      case UserRole.PROMOTER:
        router.push('/promoter');
        break;

      case UserRole.EVENT_STAFF:
        router.push('/staff');
        break;

      case UserRole.ATTENDEE:
      case UserRole.GUEST:
      default:
        break;
    }
  }, [user, authLoading, orgLoading, isPending, isApproved, isRejected, organizerProfile, router]);

  if (authLoading || orgLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user?.role !== UserRole.ATTENDEE && user?.role !== UserRole.GUEST) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
        const loyaltyRes = await apiClient.get('/loyalty/balance');
        setLoyaltyBalance(loyaltyRes.data?.available_credits || 0);
      } catch (err) {
        console.log('Loyalty not available:', err);
      }

      // Fetch recommendations
      try {
        const recsRes = await apiClient.get('/recommendations/for-you', {
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
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 font-comfortaa">
          Welcome back, {user?.first_name || 'there'}! 👋
        </h1>
        <p className="text-gray-600 mt-2 font-body">Discover and book your next amazing event</p>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="border-l-4 border-l-blue-500">
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
                View all tickets →
              </Link>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
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

        <Card className="border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-50 to-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Crown className="h-6 w-6 text-[#EB7D30]" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1 font-body">Loyalty Credits</p>
            <p className="text-3xl font-bold text-gray-900 font-comfortaa">
              {loyaltyBalance > 0 ? loyaltyBalance : 0}
            </p>
            {loyaltyBalance > 0 && (
              <Link href="/dashboard/loyalty" className="text-sm text-orange-600 hover:underline font-body mt-2 inline-block">
                Redeem credits →
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* CTA Banner - Apply as Organizer */}
      <Card className="bg-gradient-to-br from-[#EB7D30] to-[#ff9554] text-white mb-8 overflow-hidden relative">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="w-5 h-5" />
                <Badge className="bg-white/20 text-white border-white/30">New</Badge>
              </div>
              <h3 className="text-2xl font-bold mb-2 font-comfortaa">Become an Organizer</h3>
              <p className="opacity-90 font-body mb-4">
                Start creating and managing events. Earn money from ticket sales.
              </p>
              <Button 
                onClick={() => router.push('/become-organizer')}
                variant="secondary"
                className="bg-white text-primary hover:bg-gray-100"
              >
                Learn More
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            <div className="hidden md:block">
              <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center">
                <Star className="w-16 h-16 text-white/50" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Tickets */}
      {upcomingTickets.length > 0 && (
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 font-comfortaa">Your Upcoming Events</h2>
              <Link href="/dashboard/tickets">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="space-y-4">
              {upcomingTickets.slice(0, 3).map((ticket) => (
                <div key={ticket.id} className="flex items-center gap-4 p-4 border rounded-lg hover:border-primary transition">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    {ticket.event?.banner_image_url ? (
                      <img 
                        src={ticket.event.banner_image_url} 
                        alt={ticket.event.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Ticket className="w-8 h-8 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 font-comfortaa truncate">{ticket.event?.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-600 mt-1 font-body">
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
                    onClick={() => router.push(`/dashboard/tickets`)}
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
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 font-comfortaa">Recommended For You</h2>
              <Link href="/events">
                <Button variant="ghost" size="sm">
                  Browse All
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {recommendedEvents.slice(0, 4).map((event) => (
                <div key={event.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer" onClick={() => router.push(`/events/${event.slug}`)}>
                  <div className="h-40 bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    {event.banner_image_url ? (
                      <img src={event.banner_image_url} alt={event.title} className="w-full h-full object-cover" />
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
        <Card className="text-center py-12">
          <CardContent>
            <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2 font-comfortaa">No tickets yet</h3>
            <p className="text-gray-600 mb-6 font-body">Start exploring events and book your first ticket!</p>
            <Button onClick={() => router.push('/events')}>
              Browse Events
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}