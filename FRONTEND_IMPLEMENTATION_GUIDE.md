# Klix Frontend - Promoter Authorization UI Implementation Guide

**Date:** 2025-11-06
**Backend API:** ✅ Complete
**Frontend API Client:** ✅ Updated
**Frontend UI:** 🚧 Implementation Guide

---

## ✅ COMPLETED: API Integration Layer

### 1. Updated API Client (`src/lib/api-client.ts`)

**New Promoter Endpoints:**
```typescript
promoter: {
  // Profile Application
  apply: (data) => POST '/api/v1/promoters/apply'
  getProfile: () => GET '/api/v1/promoters/me'
  updateProfile: (data) => PATCH '/api/v1/promoters/me'

  // Event Promotion Requests
  requestToPromoteEvent: (data) => POST '/api/v1/promoter-requests/events/request'
  myRequests: (status?) => GET '/api/v1/promoter-requests/my-requests'
  approvedEvents: () => GET '/api/v1/promoter-requests/approved-events'

  // Code Management (existing, now with authorization)
  createCode: (data) => POST '/api/v1/promoters/codes'
  // ... other code endpoints
}
```

**New Admin Endpoints:**
```typescript
admin: {
  promoters: {
    pending: () => GET '/api/v1/admin/promoters/pending'
    approve: (id, data) => POST '/api/v1/admin/promoters/{id}/approve'
    reject: (id, data) => POST '/api/v1/admin/promoters/{id}/reject'
    suspend: (id, data) => POST '/api/v1/admin/promoters/{id}/suspend'
  }
}
```

**New Organizer Endpoints:**
```typescript
organizer: {
  promoterRequests: {
    list: (eventId?) => GET '/api/v1/promoter-requests/organizers/promoter-requests'
    approve: (id, data) => POST '/api/v1/promoter-requests/organizers/promoter-requests/{id}/approve'
    reject: (id, data) => POST '/api/v1/promoter-requests/organizers/promoter-requests/{id}/reject'
    approvedPromoters: (eventId) => GET '/api/v1/promoter-requests/organizers/events/{id}/approved-promoters'
  }
}
```

### 2. Updated TypeScript Types (`src/lib/types.ts`)

**New Enums:**
- `PromoterStatus`: PENDING, APPROVED, REJECTED, SUSPENDED
- `PromoterEventApprovalStatus`: PENDING, APPROVED, REJECTED, REVOKED

**New Interfaces:**
- `PromoterProfile` - Promoter application profile
- `PromoterApplicationCreate` - Apply to become promoter
- `PromoterEventApproval` - Event promotion request/approval
- `PromoterEventRequest` - Request to promote event
- `OrganizerPromoterApproval` - Organizer approval with commission
- `OrganizerPromoterRejection` - Organizer rejection

---

## 🚧 TODO: UI Component Updates

### STEP 1: Update Promoter Application Page

**File:** `src/app/(dashboard)/dashboard/apply-promoter/page.tsx`

**Changes Needed:**
1. Update schema to match backend:
```typescript
const promoterApplicationSchema = z.object({
  display_name: z.string().min(2).max(255),
  bio: z.string().max(1000).optional(),
  social_links: z.string().optional(), // JSON string
  experience: z.string().max(2000).optional(),
});
```

2. Update form submission:
```typescript
const onSubmit = async (data: PromoterApplicationFormValues) => {
  try {
    await api.promoter.apply(data);
    toast.success('Application Submitted!');
    router.push('/dashboard/promoter-application-status');
  } catch (error: any) {
    toast.error('Submission Failed', {
      description: error.response?.data?.detail || 'An error occurred'
    });
  }
};
```

3. Update form fields to match schema (display_name, bio, social_links, experience)

---

### STEP 2: Create Promoter Application Status Page

**File:** `src/app/(dashboard)/dashboard/promoter-application-status/page.tsx`

**Purpose:** Show promoter application status (PENDING, APPROVED, REJECTED, SUSPENDED)

**Implementation:**
```typescript
'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { PromoterProfile, PromoterStatus } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';

export default function PromoterApplicationStatusPage() {
  const [profile, setProfile] = useState<PromoterProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await api.promoter.getProfile();
      setProfile(response.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        // No profile found - redirect to apply page
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: PromoterStatus) => {
    switch (status) {
      case PromoterStatus.PENDING:
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" /> Pending Review</Badge>;
      case PromoterStatus.APPROVED:
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case PromoterStatus.REJECTED:
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      case PromoterStatus.SUSPENDED:
        return <Badge className="bg-gray-100 text-gray-800"><AlertCircle className="w-3 h-3 mr-1" /> Suspended</Badge>;
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!profile) return <div>No application found</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">Promoter Application Status</h1>
        {getStatusBadge(profile.status)}

        <div className="mt-6 space-y-4">
          <div>
            <label className="font-semibold">Display Name:</label>
            <p>{profile.display_name}</p>
          </div>

          {profile.status === PromoterStatus.REJECTED && profile.rejection_reason && (
            <div className="bg-red-50 border border-red-200 p-4 rounded">
              <p className="font-semibold text-red-800">Rejection Reason:</p>
              <p className="text-red-600">{profile.rejection_reason}</p>
            </div>
          )}

          {profile.status === PromoterStatus.APPROVED && (
            <div className="bg-green-50 border border-green-200 p-4 rounded">
              <p className="text-green-800">
                ✓ You're approved! You can now request to promote events.
              </p>
              <Button onClick={() => router.push('/promoter')} className="mt-4">
                Go to Promoter Dashboard
              </Button>
            </div>
          )}

          {profile.status === PromoterStatus.PENDING && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
              <p className="text-yellow-800">
                Your application is under review. We'll notify you once it's processed.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
```

---

### STEP 3: Update Admin Promoter Approvals Page

**File:** `src/app/(dashboard)/admin/promoters/page.tsx`

**Add Tab/Section for Pending Approvals:**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { PromoterProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function AdminPromotersPage() {
  const [pendingPromoters, setPendingPromoters] = useState<PromoterProfile[]>([]);
  const [selectedPromoter, setSelectedPromoter] = useState<PromoterProfile | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPendingPromoters();
  }, []);

  const loadPendingPromoters = async () => {
    try {
      const response = await api.admin.promoters.pending();
      setPendingPromoters(response.data);
    } catch (error) {
      toast.error('Failed to load pending promoters');
    }
  };

  const handleApprove = async (promoterId: string) => {
    setLoading(true);
    try {
      await api.admin.promoters.approve(promoterId, { notes: 'Approved by admin' });
      toast.success('Promoter approved successfully');
      loadPendingPromoters();
    } catch (error: any) {
      toast.error('Failed to approve promoter', {
        description: error.response?.data?.detail
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPromoter || !rejectionReason) return;

    setLoading(true);
    try {
      await api.admin.promoters.reject(selectedPromoter.id, { reason: rejectionReason });
      toast.success('Promoter application rejected');
      setShowRejectDialog(false);
      setRejectionReason('');
      loadPendingPromoters();
    } catch (error: any) {
      toast.error('Failed to reject promoter', {
        description: error.response?.data?.detail
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Promoter Management</h1>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending Approvals ({pendingPromoters.length})</TabsTrigger>
          <TabsTrigger value="active">Active Promoters</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <div className="space-y-4">
            {pendingPromoters.map((promoter) => (
              <Card key={promoter.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{promoter.display_name}</h3>
                    <p className="text-sm text-gray-600">{promoter.bio}</p>
                    {promoter.experience && (
                      <div className="mt-2">
                        <p className="text-sm font-semibold">Experience:</p>
                        <p className="text-sm">{promoter.experience}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApprove(promoter.id)}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedPromoter(promoter);
                        setShowRejectDialog(true);
                      }}
                      disabled={loading}
                      variant="destructive"
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            {pendingPromoters.length === 0 && (
              <p className="text-center text-gray-500 py-8">No pending applications</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Promoter Application</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                disabled={!rejectionReason || loading}
                variant="destructive"
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

---

### STEP 4: Create Promoter Request Flow (Promoter Dashboard)

**File:** `src/app/(dashboard)/promoter/page.tsx` or new `request-events` page

**Add Section to Request Event Promotion:**

```typescript
import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { Event, PromoterEventApproval, PromoterProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

export default function PromoterRequestsPage() {
  const [profile, setProfile] = useState<PromoterProfile | null>(null);
  const [myRequests, setMyRequests] = useState<PromoterEventApproval[]>([]);
  const [approvedEvents, setApprovedEvents] = useState<PromoterEventApproval[]>([]);
  const [availableEvents, setAvailableEvents] = useState<Event[]>([]);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [requestMessage, setRequestMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profileRes, requestsRes, approvedRes, eventsRes] = await Promise.all([
        api.promoter.getProfile(),
        api.promoter.myRequests(),
        api.promoter.approvedEvents(),
        api.events.list({ status: 'published' })
      ]);

      setProfile(profileRes.data);
      setMyRequests(requestsRes.data);
      setApprovedEvents(approvedRes.data);
      setAvailableEvents(eventsRes.data);
    } catch (error) {
      console.error('Failed to load data');
    }
  };

  const handleRequestToPromote = async () => {
    if (!selectedEvent) return;

    try {
      await api.promoter.requestToPromoteEvent({
        event_id: selectedEvent.id,
        message: requestMessage
      });
      toast.success('Request sent to organizer!');
      setShowRequestDialog(false);
      setRequestMessage('');
      loadData();
    } catch (error: any) {
      toast.error('Failed to send request', {
        description: error.response?.data?.detail
      });
    }
  };

  if (!profile || profile.status !== 'approved') {
    return <div>You must be an approved promoter to access this page</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Event Promotion Requests</h1>

      {/* Approved Events - Can Create Codes */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">Approved Events</h2>
        <p className="text-gray-600 mb-4">You can create promo codes for these events</p>
        <div className="grid gap-4">
          {approvedEvents.map((approval) => (
            <Card key={approval.id} className="p-4">
              <h3 className="font-bold">Event {approval.event_id}</h3>
              <p className="text-sm text-gray-600">
                Commission: {approval.commission_percentage}% |
                Discount: {approval.discount_percentage}%
              </p>
              <Button onClick={() => router.push(`/promoter/codes/create?event=${approval.event_id}`)}>
                Create Promo Code
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* Pending Requests */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">Pending Requests</h2>
        <div className="grid gap-4">
          {myRequests.filter(r => r.status === 'pending').map((request) => (
            <Card key={request.id} className="p-4">
              <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
              <h3 className="font-bold mt-2">Event {request.event_id}</h3>
              <p className="text-sm">{request.message}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Request New Event */}
      <section>
        <h2 className="text-xl font-bold mb-4">Request to Promote Event</h2>
        <Button onClick={() => setShowRequestDialog(true)}>
          + Request Event
        </Button>
      </section>

      {/* Request Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        {/* Event selection and message input */}
      </Dialog>
    </div>
  );
}
```

---

### STEP 5: Create Organizer Promoter Approval Page

**File:** `src/app/(dashboard)/organizer/promoters/page.tsx`

**Update to Handle Promoter Requests:**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { PromoterEventApproval } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

export default function OrganizerPromotersPage() {
  const [pendingRequests, setPendingRequests] = useState<PromoterEventApproval[]>([]);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PromoterEventApproval | null>(null);
  const [commissionPercentage, setCommissionPercentage] = useState('10');
  const [responseMessage, setResponseMessage] = useState('');

  useEffect(() => {
    loadPendingRequests();
  }, []);

  const loadPendingRequests = async () => {
    try {
      const response = await api.organizer.promoterRequests.list();
      setPendingRequests(response.data.filter(r => r.status === 'pending'));
    } catch (error) {
      toast.error('Failed to load promoter requests');
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      await api.organizer.promoterRequests.approve(selectedRequest.id, {
        commission_percentage: parseFloat(commissionPercentage),
        response_message: responseMessage
      });
      toast.success('Promoter approved for event!');
      setShowApproveDialog(false);
      loadPendingRequests();
    } catch (error: any) {
      toast.error('Failed to approve promoter', {
        description: error.response?.data?.detail
      });
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await api.organizer.promoterRequests.reject(requestId, {
        response_message: 'Not a good fit at this time'
      });
      toast.success('Request rejected');
      loadPendingRequests();
    } catch (error: any) {
      toast.error('Failed to reject request');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Promoter Requests</h1>

      <div className="space-y-4">
        {pendingRequests.map((request) => (
          <Card key={request.id} className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold">Promoter ID: {request.promoter_id}</h3>
                <p className="text-sm text-gray-600">Event ID: {request.event_id}</p>
                {request.message && (
                  <p className="mt-2 text-sm">{request.message}</p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setSelectedRequest(request);
                    setShowApproveDialog(true);
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Approve & Set Commission
                </Button>
                <Button
                  onClick={() => handleReject(request.id)}
                  variant="destructive"
                >
                  Reject
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {pendingRequests.length === 0 && (
          <p className="text-center text-gray-500 py-8">No pending requests</p>
        )}
      </div>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Promoter & Set Commission</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="font-semibold">Commission Percentage</label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={commissionPercentage}
                onChange={(e) => setCommissionPercentage(e.target.value)}
                placeholder="10.00"
              />
              <p className="text-sm text-gray-500">
                Promoter will earn {commissionPercentage}% commission on each sale
              </p>
            </div>

            <div>
              <label className="font-semibold">Message (optional)</label>
              <Textarea
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                placeholder="Welcome! Looking forward to working together..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
                Approve & Set Commission
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

---

### STEP 6: Update Promoter Code Creation

**File:** `src/app/(dashboard)/promoter/codes/create/page.tsx` (or wherever code creation happens)

**Key Changes:**
1. Remove commission/discount percentage input fields (organizer sets these)
2. Only show approved events in event dropdown
3. Display commission info when event is selected

```typescript
// When creating code:
const handleCreateCode = async (data) => {
  try {
    // Commission/discount now comes from approval, not user input
    await api.promoter.createCode({
      event_id: selectedEventId,
      code_type: data.code_type,
      usage_limit: data.usage_limit,
      // NO commission_percentage or discount_percentage here!
    });
    toast.success('Promo code created!');
  } catch (error: any) {
    if (error.response?.status === 403) {
      toast.error('Not Authorized', {
        description: 'You must request and receive organizer approval to promote this event'
      });
    } else {
      toast.error('Failed to create code');
    }
  }
};
```

---

## 📝 SUMMARY OF UI UPDATES NEEDED

### Required New Pages:
1. ✅ `src/app/(dashboard)/dashboard/apply-promoter/page.tsx` - Update with new API
2. 🆕 `src/app/(dashboard)/dashboard/promoter-application-status/page.tsx` - NEW
3. ✅ `src/app/(dashboard)/admin/promoters/page.tsx` - Add approval UI
4. 🆕 `src/app/(dashboard)/promoter/requests/page.tsx` - NEW
5. ✅ `src/app/(dashboard)/organizer/promoters/page.tsx` - Update with approval workflow

### Updates to Existing Pages:
1. Promoter code creation - Remove commission inputs, show approval status
2. Promoter dashboard - Show application status, approved events
3. Admin dashboard - Show pending promoter count

---

## 🎯 WORKFLOW DEMONSTRATION

### For Users (Attendees → Promoters):
1. Navigate to `/dashboard/apply-promoter`
2. Fill in: display_name, bio, social_links, experience
3. Submit application → Status: PENDING
4. View status at `/dashboard/promoter-application-status`
5. Wait for admin approval

### For Admins:
1. Navigate to `/admin/promoters`
2. See "Pending Approvals" tab with count
3. Review application details
4. Click "Approve" → User role changes to PROMOTER
5. Or click "Reject" and provide reason

### For Promoters (After Approval):
1. Navigate to `/promoter/requests`
2. Click "Request to Promote Event"
3. Select event, write pitch message
4. Submit → Wait for organizer approval
5. Once approved, can create codes with organizer-set commission

### For Organizers:
1. Navigate to `/organizer/promoters`
2. See pending requests for their events
3. Review promoter details and message
4. Click "Approve & Set Commission"
5. Enter commission percentage (e.g., 10%)
6. Promoter can now create codes at that rate

---

## 🚀 DEPLOYMENT CHECKLIST

1. ✅ Backend API deployed with migration
2. ✅ Frontend API client updated
3. ✅ TypeScript types updated
4. 🚧 UI pages created/updated (use this guide)
5. ⏳ Test complete workflow end-to-end
6. ⏳ Deploy frontend

---

## 📖 ADDITIONAL FEATURES TO CONSIDER

### Nice-to-Have Enhancements:
1. **Email notifications** - When application approved/rejected
2. **Real-time updates** - WebSocket for status changes
3. **Promoter analytics** - Show conversion rates in request
4. **Event search/filter** - When requesting to promote
5. **Bulk actions** - Admin approve multiple at once
6. **Promoter profiles** - Public profile pages
7. **Message thread** - Chat between promoter and organizer

---

## 🐛 COMMON ISSUES & SOLUTIONS

### Issue: "You must apply to become a promoter first"
**Solution:** User hasn't submitted promoter application yet. Redirect to `/dashboard/apply-promoter`

### Issue: "You must request and receive organizer approval"
**Solution:** Promoter is approved but hasn't requested this specific event. Show button to request.

### Issue: "Organizer has not set commission percentage"
**Solution:** Organizer approved but forgot to set commission. Show error to contact organizer.

### Issue: 403 Forbidden when creating code
**Solution:** Authorization check failed. User either:
- Doesn't have promoter profile (apply first)
- Promoter profile not approved (wait for admin)
- Not approved for this event (request from organizer)

---

## ✅ TESTING CHECKLIST

### User Journey Tests:
- [ ] User can submit promoter application
- [ ] Application appears in admin pending list
- [ ] Admin can approve application → User role changes to PROMOTER
- [ ] Admin can reject application with reason
- [ ] Approved promoter can request to promote event
- [ ] Request appears in organizer's pending list
- [ ] Organizer can approve with commission percentage
- [ ] Organizer can reject request
- [ ] Approved promoter can create code for approved event
- [ ] Promoter CANNOT create code without approval (403 error)
- [ ] Commission percentage comes from organizer approval, not promoter input

### Edge Cases:
- [ ] User tries to create code before being approved promoter
- [ ] Promoter tries to create code for event they're not approved for
- [ ] Organizer approves without setting commission percentage
- [ ] User submits multiple promoter applications
- [ ] Admin rejects then user reapplies

---

## 📞 SUPPORT

All API endpoints are documented at:
- **Swagger UI:** `http://localhost:8000/docs`
- **Backend Guide:** `API_ENDPOINTS_COMPLETE.md` in backend repo

For implementation questions, refer to:
- Backend implementation: `IMPLEMENTATION_SUMMARY.md`
- This frontend guide: You're reading it!

**All business logic is enforced in the backend. Frontend is primarily UI/UX.**
