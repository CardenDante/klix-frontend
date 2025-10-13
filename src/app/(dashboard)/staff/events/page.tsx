'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import  apiClient  from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Calendar, QrCode, MapPin, Clock, CheckCircle,
  Users, Search, ExternalLink, TrendingUp
} from 'lucide-react';

interface StaffAssignment {
  id: string;
  event_id: string;
  role: string;
  is_active: boolean;
  assigned_at: string;
  event: {
    id: string;
    title: string;
    location: string;
    start_datetime: string;
    end_datetime: string;
    status: string;
    is_published: boolean;
  };
}

interface EventStats {
  total_tickets: number;
  checked_in: number;
  check_in_rate: number;
}

export default function StaffEventsPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<StaffAssignment[]>([]);
  const [stats, setStats] = useState<Record<string, EventStats>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'upcoming' | 'completed'>('active');

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await apiClient.get('/staff/my-staff-assignments', {
        params: { active_only: false }
      });
      const allAssignments = response.data.assignments || [];
      setAssignments(allAssignments);

      // Fetch stats for each event
      for (const assignment of allAssignments) {
        fetchEventStats(assignment.event_id);
      }
    } catch (err) {
      console.error('Failed to load assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventStats = async (eventId: string) => {
    try {
      const response = await apiClient.get(`/tickets/events/${eventId}/checkin-stats`);
      setStats(prev => ({ ...prev, [eventId]: response.data }));
    } catch (err) {
      console.error('Failed to load stats for event:', eventId);
    }
  };

  const getFilteredAssignments = () => {
    let filtered = assignments;

    // Filter by status
    if (filterStatus === 'active') {
      filtered = filtered.filter(a => a.is_active);
    } else if (filterStatus === 'upcoming') {
      filtered = filtered.filter(a => {
        const eventDate = new Date(a.event.start_datetime);
        return eventDate > new Date() && a.event.status !== 'completed';
      });
    } else if (filterStatus === 'completed') {
      filtered = filtered.filter(a => a.event.status === 'completed');
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(a =>
        a.event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.event.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredAssignments = getFilteredAssignments();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#EB7D30] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Comfortaa' }}>
          My Events
        </h1>
        <p className="text-gray-600 mt-1">Events where you're assigned as staff</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Total Events</p>
            <p className="text-2xl font-bold">{assignments.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Active</p>
            <p className="text-2xl font-bold text-green-600">
              {assignments.filter(a => a.is_active).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Upcoming</p>
            <p className="text-2xl font-bold text-blue-600">
              {assignments.filter(a => {
                const eventDate = new Date(a.event.start_datetime);
                return eventDate > new Date() && a.event.status !== 'completed';
              }).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-gray-600">
              {assignments.filter(a => a.event.status === 'completed').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('all')}
              >
                All
              </Button>
              <Button
                variant={filterStatus === 'active' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('active')}
              >
                Active
              </Button>
              <Button
                variant={filterStatus === 'upcoming' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('upcoming')}
              >
                Upcoming
              </Button>
              <Button
                variant={filterStatus === 'completed' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('completed')}
              >
                Completed
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredAssignments.map((assignment) => {
          const eventStats = stats[assignment.event_id];
          const eventDate = new Date(assignment.event.start_datetime);
          const isToday = eventDate.toDateString() === new Date().toDateString();
          const isPast = eventDate < new Date();

          return (
            <Card key={assignment.id} className={isToday ? 'border-[#EB7D30] bg-orange-50' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-semibold">{assignment.event.title}</h3>
                      {isToday && <Badge className="bg-[#EB7D30]">Today</Badge>}
                      <Badge variant={assignment.is_active ? 'default' : 'secondary'}>
                        {assignment.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {assignment.event.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{eventDate.toLocaleDateString('en-US', { 
                          weekday: 'short',
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{eventDate.toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{assignment.event.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>Role: {assignment.role}</span>
                      </div>
                    </div>

                    {/* Check-in Stats */}
                    {eventStats && (
                      <div className="flex items-center gap-6 p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-xs text-gray-600">Total Tickets</p>
                          <p className="text-lg font-bold">{eventStats.total_tickets}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Checked In</p>
                          <p className="text-lg font-bold text-green-600">{eventStats.checked_in}</p>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-600">Check-in Rate</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${eventStats.check_in_rate}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-semibold">{eventStats.check_in_rate.toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      size="sm"
                      onClick={() => router.push(`/staff/scanner?event=${assignment.event_id}`)}
                      disabled={!assignment.is_active || isPast}
                    >
                      <QrCode className="w-4 h-4 mr-1" />
                      Scan Tickets
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/events/${assignment.event.id}`, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      View Event
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredAssignments.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                {assignments.length === 0 
                  ? 'No events assigned yet' 
                  : 'No events match your filters'}
              </p>
              <p className="text-sm text-gray-500">
                Contact the event organizer to get assigned to events
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}