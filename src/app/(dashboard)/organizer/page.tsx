'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { organizersApi } from '@/lib/api/organizers';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Ticket, Calendar, BarChart3, ArrowRight, Loader2, PlusCircle, MapPin, Clock } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { getImageUrl } from '@/lib/utils';

// --- INTERFACES ---
interface SalesData {
  date: string;
  revenue: number;
}

interface TopEventData {
  id: string;
  title: string;
  tickets_sold: number;
}

interface UpcomingEventData {
  id: string;
  slug: string;
  title: string;
  start_datetime: string;
  location: string;
  banner_image_url?: string;
}

interface DashboardStats {
  total_revenue: number;
  total_tickets_sold: number;
  upcoming_events_count: number;
  total_events_count: number;
  sales_over_time: SalesData[];
  top_events: TopEventData[];
  upcoming_events: UpcomingEventData[];
}

// --- MAIN COMPONENT ---
export default function OrganizerDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [fallbackEvents, setFallbackEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Try fetching dashboard stats
        try {
          const response = await organizersApi.getDashboard();

          // Debug logging
          console.log('📊 [DASHBOARD] Full response:', response);
          console.log('📊 [DASHBOARD] Response data:', response.data);
          console.log('📊 [DASHBOARD] Total events:', response.data?.total_events_count);
          console.log('📊 [DASHBOARD] Upcoming events:', response.data?.upcoming_events);

          setStats(response.data);
        } catch (analyticsError: any) {
          console.error("❌ [DASHBOARD] Analytics failed:", analyticsError);

          // Fallback: fetch events directly
          console.log('🔄 [DASHBOARD] Trying fallback: fetching events directly');
          try {
            const eventsResponse = await organizersApi.getMyEvents();
            console.log('📊 [DASHBOARD] My events response:', eventsResponse.data);

            const events = eventsResponse.data.data || eventsResponse.data || [];
            setFallbackEvents(events);

            // Create basic stats from events
            const basicStats: DashboardStats = {
              total_revenue: 0,
              total_tickets_sold: 0,
              upcoming_events_count: events.filter((e: any) => new Date(e.start_datetime) > new Date()).length,
              total_events_count: events.length,
              sales_over_time: [],
              top_events: [],
              upcoming_events: events.filter((e: any) => new Date(e.start_datetime) > new Date()).slice(0, 3)
            };
            console.log('📊 [DASHBOARD] Created basic stats:', basicStats);
            setStats(basicStats);
          } catch (eventsError) {
            console.error("❌ [DASHBOARD] Failed to fetch events too:", eventsError);
            toast.error("Could not load your dashboard data. Please try again.");
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Debug: log the stats to see what we have
  console.log('📊 [DASHBOARD] Current stats state:', stats);
  console.log('📊 [DASHBOARD] Should show empty state?', !stats || stats.total_events_count === 0);

  if (!stats) {
    console.warn('⚠️ [DASHBOARD] Stats is null, showing empty state');
    return <EmptyState />;
  }

  // Only show empty state if we're sure there are no events
  if (stats.total_events_count === 0) {
    console.warn('⚠️ [DASHBOARD] Total events count is 0, showing empty state');
    return <EmptyState />;
  }

  const salesChartData = (stats.sales_over_time || []).map(item => ({
    name: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    Revenue: item.revenue
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-comfortaa">
            Welcome, <span className="gradient-text font-playful pr-2">{user?.first_name || 'Organizer'}!</span>
          </h1>
          <p className="text-gray-600 mt-1 font-body">Here's an overview of your events and sales.</p>
        </div>
        <Button size="lg" onClick={() => router.push('/organizer/events/create')}>
          <PlusCircle className="w-5 h-5 mr-2" />
          Create New Event
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
            title="Total Revenue"
            value={`KSh ${(stats.total_revenue || 0).toLocaleString()}`}
            icon={DollarSign}
            iconColor="text-green-600"
            bgColor="bg-green-100"
        />
        <StatCard
            title="Tickets Sold"
            value={(stats.total_tickets_sold || 0).toLocaleString()}
            icon={Ticket}
            iconColor="text-blue-600"
            bgColor="bg-blue-100"
        />
        <StatCard
            title="Upcoming Events"
            value={(stats.upcoming_events_count || 0).toString()}
            icon={Calendar}
            iconColor="text-orange-600"
            bgColor="bg-orange-100"
        />
        <StatCard
            title="Total Events"
            value={(stats.total_events_count || 0).toString()}
            icon={BarChart3}
            iconColor="text-purple-600"
            bgColor="bg-purple-100"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-comfortaa">Sales Over Time</CardTitle>
            <CardDescription className="font-body">Revenue from ticket sales in the last 30 days.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `KSh ${Number(value) / 1000}k`} />
                <Tooltip 
                  cursor={{ fill: 'rgba(235, 125, 48, 0.1)' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #ddd' }}
                />
                <Bar dataKey="Revenue" fill="#EB7D30" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-comfortaa">Top Events</CardTitle>
            <CardDescription className="font-body">Your best-selling events.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(stats.top_events || []).slice(0, 5).map((event, index) => (
                <div key={event.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-400 w-5">#{index + 1}</span>
                    <p className="text-sm font-semibold text-gray-800 truncate">{event.title}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{(event.tickets_sold || 0).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Upcoming Events List */}
      <Card>
          <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-comfortaa">Upcoming Events</CardTitle>
                  <CardDescription className="font-body">Your next few scheduled events.</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/organizer/events">
                        View All <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                </Button>
              </div>
          </CardHeader>
          <CardContent>
              {(stats.upcoming_events || []).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(stats.upcoming_events || []).slice(0, 3).map((event) => (
                      <div 
                        key={event.id} 
                        className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => router.push(`/organizer/events/${event.id}`)}
                      >
                        <div className="h-40 bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                            {event.banner_image_url ? (
                                <img
                                  src={getImageUrl(event.banner_image_url)}
                                  alt={event.title}
                                  className="w-full h-full object-cover"
                                />
                            ) : (
                                <Calendar className="w-12 h-12 text-primary" />
                            )}
                        </div>
                        <div className="p-4">
                            <h4 className="font-semibold font-comfortaa truncate">{event.title}</h4>
                            <div className="text-xs text-gray-600 space-y-1 mt-2 font-body">
                                <p className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {new Date(event.start_datetime).toLocaleDateString()}</p>
                                <p className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {event.location}</p>
                            </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8 font-body">You have no upcoming events.</p>
              )}
          </CardContent>
      </Card>

      {/* DEBUG PANEL - Remove after fixing */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="mt-8 border-red-300 bg-red-50/50">
          <CardHeader>
            <CardTitle className="text-red-700 font-comfortaa">🐛 Debug Information</CardTitle>
            <CardDescription className="text-red-600">This panel shows raw data from the API</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm font-mono">
              <div>
                <p className="font-bold text-red-700 mb-2">Stats Object:</p>
                <pre className="bg-white p-4 rounded overflow-auto max-h-96 text-xs">
                  {JSON.stringify(stats, null, 2)}
                </pre>
              </div>
              {fallbackEvents.length > 0 && (
                <div>
                  <p className="font-bold text-red-700 mb-2">Fallback Events ({fallbackEvents.length}):</p>
                  <pre className="bg-white p-4 rounded overflow-auto max-h-96 text-xs">
                    {JSON.stringify(fallbackEvents, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// --- SUB-COMPONENTS ---

const StatCard = ({ title, value, icon: Icon, iconColor, bgColor }: { title: string, value: string, icon: React.ElementType, iconColor: string, bgColor: string }) => (
    <Card>
        <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center`}>
                    <Icon className={`h-6 w-6 ${iconColor}`} />
                </div>
            </div>
            <p className="text-gray-600 text-sm mb-1 font-body">{title}</p>
            <p className="text-3xl font-bold text-gray-900 font-comfortaa">{value}</p>
        </CardContent>
    </Card>
);

const EmptyState = () => {
    const router = useRouter();
    return (
        <div className="text-center py-16">
            <h1 className="text-4xl font-bold font-heading mb-4 text-gray-900">
                Welcome to Your <span className="gradient-text font-playful pr-2">Dashboard</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-xl mx-auto mb-8 font-body">
                This is where you'll manage your events, track sales, and see your growth. Let's get your first event set up!
            </p>
            <Card className="max-w-md mx-auto text-center p-8 bg-gray-50 border-dashed">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2 font-comfortaa">Create Your First Event</h3>
                <p className="text-gray-600 mb-6 font-body">
                    Start selling tickets in just a few minutes.
                </p>
                <Button onClick={() => router.push('/organizer/events/create')} size="lg">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Create Event
                </Button>
            </Card>
        </div>
    );
};