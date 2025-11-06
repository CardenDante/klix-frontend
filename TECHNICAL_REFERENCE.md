# Klix Frontend - Technical Reference Guide

## Quick Reference

### API Client Location
`src/lib/api-client.ts` - Complete REST API wrapper with Axios

### Authentication Hook
`src/hooks/useAuth.ts` - Zustand store with Firebase + JWT integration

### Protected Routes
`src/components/auth/ProtectedRoute.tsx` - Role-based access control component

### Navigation/Sidebar
`src/components/dashboard/Sidebar.tsx` - Role-aware navigation menu

### Type Definitions
`src/lib/types.ts` - Complete TypeScript interfaces and enums

### UI Components
`src/components/ui/` - shadcn/ui component library

---

## File Structure Quick Reference

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout
│   ├── globals.css              # Global styles
│   ├── page.tsx                 # Home page
│   ├── (auth)/                  # Auth routes
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── (main)/                  # Public routes
│   ├── (dashboard)/             # Protected routes
│   │   ├── layout.tsx           # Dashboard layout
│   │   ├── dashboard/           # Attendee dashboard
│   │   ├── organizer/           # Organizer routes
│   │   ├── promoter/            # Promoter routes
│   │   ├── staff/               # Staff routes
│   │   └── admin/               # DELETED
│   └── checkout/
│
├── components/
│   ├── ui/                      # shadcn/ui components
│   ├── auth/                    # ProtectedRoute
│   ├── dashboard/               # Sidebar
│   ├── shared/                  # Reusable components
│   ├── events/                  # Event components
│   └── landing/                 # Landing page sections
│
├── lib/
│   ├── api-client.ts           # Main API wrapper
│   ├── types.ts                # TypeScript definitions
│   ├── utils.ts                # Utility functions
│   ├── firebase.ts             # Firebase config
│   └── api/
│       ├── organizers.ts       # Organizer-specific API
│       ├── events.ts           # Events API
│       ├── tickets.ts          # Tickets API
│       └── uploads.ts          # Uploads API
│
└── hooks/
    ├── useAuth.ts              # Auth store (Zustand)
    ├── useOrganizer.ts         # Organizer profile hook
    └── usePromoter.ts          # Promoter profile hook
```

---

## Configuration Files

### Environment Variables
Location: `.env` (root)

```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### TypeScript
Location: `tsconfig.json` - Standard Next.js config

### Tailwind CSS
Location: `tailwind.config.ts` - Tailwind v4 config

### ESLint
Location: `eslint.config.mjs` - Next.js ESLint rules

### PostCSS
Location: `postcss.config.mjs` - CSS processing

### UI Library Config
Location: `components.json` - shadcn/ui configuration

---

## Key Dependencies

### Frontend Framework
- `next` 15.5.4 - React framework
- `react` 19.1.0 - UI library
- `react-dom` 19.1.0 - DOM rendering

### State Management
- `zustand` 5.0.8 - Lightweight state store

### API & Authentication
- `axios` 1.12.2 - HTTP client
- `firebase` 12.4.0 - Authentication

### UI & Components
- Radix UI family - Headless components
  - `@radix-ui/react-dialog`
  - `@radix-ui/react-select`
  - `@radix-ui/react-tabs`
  - `@radix-ui/react-accordion`
  - etc.
- `lucide-react` 0.545.0 - Icon library
- `recharts` 3.2.1 - Charts

### Forms & Validation
- `react-hook-form` 7.65.0 - Form state management
- `@hookform/resolvers` 5.2.2 - Validation resolvers
- `zod` 4.1.12 - Schema validation

### Styling
- `tailwindcss` 4 - Utility CSS
- `class-variance-authority` 0.7.1 - Component variants
- `clsx` 2.1.1 - Class merging
- `tailwind-merge` 3.3.1 - Tailwind class merging

### Rich Text
- `@tiptap/react` 3.6.6 - Rich text editor
- `@tiptap/starter-kit` 3.6.6 - Editor extensions

### Utilities
- `date-fns` 4.1.0 - Date manipulation
- `sonner` 2.0.7 - Toast notifications
- `next-themes` 0.4.6 - Theme management
- `canvas-confetti` 1.9.3 - Celebration effects

---

## Common Patterns

### Using the Auth Store
```typescript
import { useAuth } from '@/hooks/useAuth'

export function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth()
  
  if (!isAuthenticated) return <div>Not logged in</div>
  
  return <div>Welcome {user?.email}</div>
}
```

### Protected Routes
```typescript
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export function AdminOnly() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminDashboard />
    </ProtectedRoute>
  )
}
```

### API Calls
```typescript
import { api } from '@/lib/api-client'

// Get user data
const response = await api.auth.me()

// Create organizer
await api.organizer.profile()

// Get admin stats
await api.admin.statistics()

// List pending promoters
const promoters = await api.admin.promoters.pending()
```

### Form Handling
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export function LoginForm() {
  const form = useForm({
    resolver: zodResolver(schema),
  })
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('email')} />
      {form.formState.errors.email && (
        <span>{form.formState.errors.email.message}</span>
      )}
    </form>
  )
}
```

### UI Components
```typescript
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function Dashboard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={handleClick}>Click me</Button>
      </CardContent>
    </Card>
  )
}
```

---

## Development Workflow

### Start Development Server
```bash
npm run dev          # With Turbopack
# Server runs on http://localhost:3000
```

### Build for Production
```bash
npm run build        # With Turbopack
```

### Run Production Build
```bash
npm start
```

### Linting
```bash
npm run lint
```

---

## Important Notes

### Admin Status
- Admin pages were deleted in commit f51b5c0
- Admin API endpoints still exist and are functional
- Admin menu items in sidebar reference deleted routes (404 errors)
- Implementation was based on organizer/promoter approval workflows

### API Endpoints
- All endpoints are defined in `src/lib/api-client.ts`
- Use `api.admin.*` namespace for admin operations
- Automatic token injection in all requests
- Automatic token refresh on 401 response

### Authentication
- Uses Firebase for user management
- Backend issues JWT for API authentication
- Tokens stored in localStorage
- Auto-logout on token refresh failure

### Type Safety
- Full TypeScript throughout
- Zod for runtime validation
- Type inference for forms
- Interface definitions for all data

### Mobile Responsive
- Mobile-first CSS approach
- Tailwind breakpoints: sm, md, lg, xl, 2xl
- Responsive navigation (sidebar + bottom nav on mobile)
- Touch-friendly component sizing

