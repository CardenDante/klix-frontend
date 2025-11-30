'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users, Plus, UserCheck, UserX, Mail, Calendar,
  CheckCircle, XCircle, Shield
} from 'lucide-react';

interface Event {
  id: string;
  title: string;
  start_datetime: string;
  slug: string;
}

interface StaffMember {
  id: string;
  user_id: string;
  event_id: string;
  role: string;
  is_active: boolean;
  assigned_at: string;
  user: {
    email: string;
    full_name: string | null;
  };
  event: {
    title: string;
    start_datetime: string;
  };
}

export default function StaffManagementPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    role: 'Staff'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tempPassword, setTempPassword] = useState<string>('');

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchEventStaff(selectedEventId);
    }
  }, [selectedEventId]);

  const fetchEvents = async () => {
    try {
      const response = await api.events.myEvents({ page_size: 100 });
      const eventList = response.data.data;
      setEvents(eventList);
      if (eventList.length > 0) {
        setSelectedEventId(eventList[0].id);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventStaff = async (eventId: string) => {
    try {
      const response = await api.staff.list(eventId, true);
      setStaff(response.data.staff || []);
    } catch (err) {
      console.error('Failed to load staff:', err);
      setStaff([]);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setTempPassword('');

    if (!selectedEventId) {
      setError('Please select an event');
      return;
    }

    try {
      console.log('📝 [STAFF ADD] Adding staff member:', {
        eventId: selectedEventId,
        email: formData.email,
        role: formData.role
      });

      const response = await api.staff.add(selectedEventId, {
        email: formData.email,
        role: formData.role
      });

      console.log('✅ [STAFF ADD] Staff member added successfully:', response.data);

      // Check if a temporary password was returned (new user created)
      if (response.data.temp_password) {
        setTempPassword(response.data.temp_password);
        setSuccess(`Staff member added! A new account was created for ${formData.email}.`);
      } else {
        setSuccess('Staff member added successfully!');
      }

      setFormData({ email: '', role: 'Staff' });
      setShowAddForm(false);
      fetchEventStaff(selectedEventId);
    } catch (err: any) {
      console.error('❌ [STAFF ADD] Failed to add staff member:', err);
      console.error('❌ [STAFF ADD] Error response:', err.response?.data);
      console.error('❌ [STAFF ADD] Error status:', err.response?.status);

      if (err.response?.status === 401) {
        setError('Authentication error. Please refresh the page and try again.');
      } else {
        setError(err.response?.data?.detail || err.response?.data?.message || 'Failed to add staff member');
      }
    }
  };

  const handleRemoveStaff = async (staffId: string) => {
    if (!confirm('Are you sure you want to remove this staff member?')) {
      return;
    }

    try {
      await api.staff.remove(selectedEventId, staffId);
      setSuccess('Staff member removed successfully');
      fetchEventStaff(selectedEventId);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to remove staff member');
    }
  };

  const handleToggleStatus = async (staffId: string, currentStatus: boolean) => {
    try {
      await api.staff.update(selectedEventId, staffId, {
        is_active: !currentStatus
      });
      setSuccess(`Staff member ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      fetchEventStaff(selectedEventId);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update staff status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#EB7D30] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading staff...</p>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Events Yet</h3>
        <p className="text-gray-600 mb-4">Create an event first to manage staff</p>
        <Button onClick={() => window.location.href = '/organizer/events/create'}>
          Create Event
        </Button>
      </div>
    );
  }

  const selectedEvent = events.find(e => e.id === selectedEventId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Comfortaa' }}>
          Staff Management
        </h1>
        <p className="text-gray-600 mt-1">Manage event staff and their permissions</p>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Temporary Password Display */}
      {tempPassword && (
        <Card className="border-green-500 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Account Created - Temporary Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-4 rounded border-2 border-green-200">
              <p className="text-sm text-gray-600 mb-2">Temporary Password (share with staff member):</p>
              <div className="flex items-center gap-2">
                <code className="text-lg font-mono font-bold text-green-700 bg-green-100 px-4 py-2 rounded flex-1">
                  {tempPassword}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(tempPassword);
                    alert('Password copied to clipboard!');
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Important Instructions:</h4>
              <ul className="space-y-1 text-sm text-yellow-900">
                <li>• Share this temporary password with {formData.email || 'the staff member'} securely</li>
                <li>• They should log in at the staff portal and change their password</li>
                <li>• This password will only be shown once - make sure to save it</li>
                <li>• The staff member will be prompted to verify their email on first login</li>
              </ul>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setTempPassword('')}
            >
              I've Saved the Password
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Event Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Select Event
            </span>
            <Button onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Staff
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <select
            className="w-full px-4 py-2 border rounded-lg"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
          >
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title} - {new Date(event.start_datetime).toLocaleDateString()}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* Add Staff Form */}
      {showAddForm && (
        <Card className="border-[#EB7D30]">
          <CardHeader>
            <CardTitle>Add New Staff Member</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddStaff} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Staff Email</label>
                <Input
                  type="email"
                  placeholder="staff@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  If this user doesn't have an account, we'll create one and show you their temporary password
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role/Title</label>
                <Input
                  type="text"
                  placeholder="e.g., Ticket Scanner, Door Manager"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Add Staff Member</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Staff List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Event Staff ({staff.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <div className="text-center py-12">
              <UserCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No staff members assigned yet</p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Staff Member
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {staff.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#EB7D30] text-white rounded-full flex items-center justify-center">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold flex items-center gap-2">
                        {member.user.full_name || member.user.email}
                        {member.is_active ? (
                          <Badge className="bg-green-500">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </h4>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {member.user.email}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Role: {member.role} • Added {new Date(member.assigned_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(member.id, member.is_active)}
                    >
                      {member.is_active ? (
                        <>
                          <XCircle className="w-4 h-4 mr-1" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Activate
                        </>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveStaff(member.id)}
                    >
                      <UserX className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Staff Permissions
          </h4>
          <ul className="space-y-1 text-sm text-gray-700">
            <li>• Staff can check-in tickets via QR code scanner</li>
            <li>• Staff can view event check-in statistics</li>
            <li>• Staff cannot access financial data or event management</li>
            <li>• You can activate/deactivate staff access at any time</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}