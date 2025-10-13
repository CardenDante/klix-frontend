'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import  apiClient  from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  QrCode, Calendar, CheckCircle, Users, Clock,
  MapPin, Ticket, TrendingUp, Shield
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
  };
}

interface CheckinStats {                                                                                            
  total_tickets: number;
  checked_in: number;
  not_checked_in: number;
  check_in_rate: number;
}

export default function StaffDashboardPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<StaffAssignment[]>([]);
  const [todayEvents, setTodayEvents] = useState<StaffAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await apiClient.get('/staff/my-staff-assignments', {
        params: { active_only: true }
      });
      const allAssignments = response.data.assignments || [];
      setAssignments(allAssignments);

      // Filter today's events
      const today = new Date().toDateString();
      const todayEvents = allAssignments.filter((a: StaffAssignment) => {
        const eventDate = new Date(a.event.start_datetime).toDateString();
        return eventDate === today;
      });
      setTodayEvents(todayEvents);
    } catch (err) {
      console.error('Failed to load assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  const upcomingEvents = assignments.filter(a => {
    const eventDate = new Date(a.event.start_datetime);
    const now = new Date();
    return eventDate > now && a.event.status !== 'completed';
  }).slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#EB7D30] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Comfortaa' }}>
            Staff Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Manage event check-ins and access</p>
        </div>
        <Button onClick={() => router.push('/staff/scanner')} className="gap-2">
          <QrCode className="w-5 h-5" />
          Open Scanner
        </Button>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Assignments</p>
                <p className="text-3xl font-bold text-gray-900">{assignments.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Events</p>
                <p className="text-3xl font-bold text-gray-900">
                  {assignments.filter(a => a.is_active).length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Events Today</p>
                <p className="text-3xl font-bold text-gray-900">{todayEvents.length}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Your Role</p>
                <p className="text-xl font-bold text-gray-900">Event Staff</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Events */}
      {todayEvents.length > 0 && (
        <Card className="border-[#EB7D30] bg-gradient-to-r from-orange-50 to-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Events Today ({todayEvents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayEvents.map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between p-4 bg-white border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{assignment.event.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(assignment.event.start_datetime).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {assignment.event.location}
                      </span>
                      <Badge variant="outline">{assignment.role}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/staff/events/${assignment.event_id}`)}
                    >
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => router.push(`/staff/scanner?event=${assignment.event_id}`)}
                    >
                      <QrCode className="w-4 h-4 mr-1" />
                      Scan Tickets
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Upcoming Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {upcomingEvents.map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition">
                  <div className="flex-1">
                    <h4 className="font-semibold">{assignment.event.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(assignment.event.start_datetime).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {assignment.event.location}
                      </span>
                      <Badge variant="outline">{assignment.role}</Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/staff/events/${assignment.event_id}`)}
                  >
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No upcoming assignments</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:border-[#EB7D30] transition" onClick={() => router.push('/staff/events')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold">My Events</h4>
                <p className="text-sm text-gray-600">View all assignments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-[#EB7D30] transition" onClick={() => router.push('/staff/scanner')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-full">
                <QrCode className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h4 className="font-semibold">QR Scanner</h4>
                <p className="text-sm text-gray-600">Check in attendees</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-[#EB7D30] transition" onClick={() => router.push('/dashboard/settings')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-full">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold">Settings</h4>
                <p className="text-sm text-gray-600">Manage preferences</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-200 rounded-full">
              <Shield className="w-6 h-6 text-blue-700" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-lg mb-2">Staff Responsibilities</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• Check in attendees using QR code scanner</li>
                <li>• Verify ticket validity and event access</li>
                <li>• Report any suspicious tickets or activities</li>
                <li>• Provide excellent customer service to attendees</li>
                <li>• Maintain accurate check-in records</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}