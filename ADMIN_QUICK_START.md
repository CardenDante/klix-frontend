# Admin Dashboard - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Admin user account with `role = 'ADMIN'`
- Backend API running at configured URL
- Frontend development server running

### Access
Navigate to: **[/admin](http://localhost:3000/admin)**

---

## 📋 Main Features

### 1. Dashboard ([/admin](src/app/(dashboard)/admin/page.tsx))
**What you see:**
- Pending organizer applications count
- Today's revenue
- New users today
- Active issues (flagged events)
- Discounts and loyalty credits used

**Quick Actions:**
- Click any stat card to navigate to details
- Use quick action cards to access key features

---

### 2. User Management ([/admin/users](src/app/(dashboard)/admin/users/page.tsx))

**Common Tasks:**

#### Change User Role
1. Click **Role** button next to user
2. Select new role from dropdown
3. Click **Confirm**

#### Suspend User
1. Click **Suspend** button
2. Add reason (optional)
3. Click **Confirm**

#### Delete User
1. Click **Delete** button
2. **Required:** Provide deletion reason
3. Review warning about irreversibility
4. Click **Confirm**

**Filters:**
- Search by email/name
- Filter by role
- Filter by status (Active/Suspended)

---

### 3. Organizer Management ([/admin/organizers](src/app/(dashboard)/admin/organizers/page.tsx))

**Approval Workflow:**

#### Approve Organizer
1. Go to **Pending** tab
2. Review business information
3. Click **Approve**
4. Add notes (optional)
5. Click **Confirm Approve**
   - Status → APPROVED
   - User role → ORGANIZER
   - Email sent to applicant
   - Can now create events

#### Reject Organizer
1. Click **Reject**
2. **Required:** Provide rejection reason
3. Click **Confirm Reject**
   - Status → REJECTED
   - Email sent with reason
   - User stays as ATTENDEE

#### Suspend Organizer
1. Go to **Approved** tab
2. Click **Suspend** on organizer
3. **Required:** Provide suspension reason
4. Click **Confirm Suspend**
   - All events unpublished
   - Email sent
   - Organizer cannot create new events

**Tabs:**
- **Pending**: Awaiting your review
- **Approved**: Active organizers
- **Rejected**: Declined applications
- **Suspended**: Temporarily disabled

---

### 4. Event Moderation ([/admin/events](src/app/(dashboard)/admin/events/page.tsx))

**Flag System:**

#### Flag an Event
1. Click **Flag** button
2. Select severity:
   - **LOW**: Minor issue (stays published)
   - **MEDIUM**: Moderate concern (stays published)
   - **HIGH**: Serious issue (auto-unpublished) ⚠️
   - **CRITICAL**: Severe violation (auto-unpublished) ⚠️
3. **Required:** Provide flagging reason
4. Click **Confirm**

#### Unflag an Event
1. Click **Unflag** button
2. Add reason (optional)
3. Click **Confirm**

#### Force Delete Event
1. Click **Delete** button
2. **Required:** Provide deletion reason
3. Check "Refund all tickets" if applicable
4. Click **Confirm**
   - ⚠️ **Warning**: Irreversible action!

**Filters:**
- Search by event name, organizer, category
- Filter by status (Published/Draft/Cancelled/Completed)

---

### 5. Analytics ([/admin/analytics](src/app/(dashboard)/admin/analytics/page.tsx))

**Dashboard Metrics:**
- Total users + growth rate
- Total revenue + trends
- Platform earnings
- Total events created

**Tabs:**

#### Top Organizers
- Ranked by total revenue
- Shows events count, tickets sold, earnings
- Platform commission breakdown

#### Top Events
- Ranked by ticket sales
- Category and organizer info
- Revenue generated

#### Category Performance
- Events per category
- Tickets sold
- Revenue by category

#### System Health
- System status indicator
- API response time
- Database connection status
- Cache hit rate
- Active users (24h)

---

### 6. Audit Logs ([/admin/audit-logs](src/app/(dashboard)/admin/audit-logs/page.tsx))

**What's Logged:**
- All admin actions
- User who performed action
- Timestamp and IP address
- Resource affected
- Changes made

**Filters:**
- Search by action, resource, or user
- Filter by action type (Approve, Reject, Suspend, Delete, etc.)
- Filter by resource type (User, Organizer, Event, Promoter)

**View Details:**
- Click "View changes" to see JSON diff
- All logs are immutable (cannot be deleted)

---

## 🎯 Common Workflows

### New Organizer Application Review
1. Dashboard → Check "Pending Organizer Applications"
2. Click stat or "Review Organizer Applications"
3. Review business details and contact info
4. Decide: Approve or Reject
5. Provide feedback/notes
6. Confirm action
7. Check Audit Logs to verify

### Handle Flagged Event
1. Dashboard → Check "Active Issues"
2. Go to Events page
3. Find flagged events (red flag icon)
4. Review flag reason
5. Decide: Unflag, Suspend Organizer, or Delete Event
6. Take appropriate action

### Investigate User Issue
1. Go to User Management
2. Search by email/name
3. Review user activity (tickets, spending)
4. Check Audit Logs for user history
5. Take action if needed (suspend/delete/change role)

### Monthly Platform Review
1. Go to Analytics
2. Check growth percentages
3. Review Top Organizers performance
4. Check Top Events
5. Analyze Category Performance
6. Monitor System Health metrics

---

## ⚠️ Important Notes

### Safety Checks
- **Always provide reasons** for rejections, suspensions, and deletions
- **Irreversible actions** show clear warnings
- **Confirmation dialogs** prevent accidental actions
- **Audit trail** tracks everything you do

### Best Practices
1. ✅ Review pending applications daily
2. ✅ Check flagged events regularly
3. ✅ Monitor system health weekly
4. ✅ Review audit logs for anomalies
5. ✅ Provide clear, professional reasons for rejections
6. ✅ Use appropriate severity levels when flagging
7. ✅ Verify organizer details before approval

### Don'ts
1. ❌ Don't delete users without valid reasons
2. ❌ Don't approve organizers without verification
3. ❌ Don't flag events without investigation
4. ❌ Don't share admin credentials
5. ❌ Don't bypass confirmation dialogs

---

## 🆘 Troubleshooting

### Can't Access Admin Dashboard
- Check if you're logged in
- Verify your role is `ADMIN`
- Clear browser cache
- Check API connection

### Actions Failing
- Check network connection
- Verify API is running
- Check browser console for errors
- Ensure required fields are filled

### Data Not Loading
- Click refresh button
- Check backend API status
- Verify authentication token
- Review browser console logs

---

## 📞 Support

### For Issues:
1. Check browser console for errors
2. Review audit logs for recent actions
3. Verify API connectivity
4. Check backend logs

### For Features:
- See `ADMIN_DASHBOARD_README.md` for detailed documentation
- Review backend API documentation
- Check code comments in source files

---

## 🎨 UI Reference

### Status Badges
- 🟢 **Green**: Approved, Active, Success
- 🟡 **Yellow**: Pending, Warning, Low Severity
- 🟠 **Orange**: Suspended, Medium/High Severity
- 🔴 **Red**: Rejected, Critical, Deleted

### Icons
- 📊 Dashboard
- 👥 Users
- 🛡️ Organizers
- 📅 Events
- 📈 Analytics
- 📝 Audit Logs

---

**Quick Tip:** Hover over buttons and icons for tooltips and additional information!

---

*Last Updated: January 2025*
