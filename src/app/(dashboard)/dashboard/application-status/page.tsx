// app/(dashboard)/dashboard/application-status/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganizer } from '@/hooks/useOrganizer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Loader2, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  ArrowRight,
  Mail,
  Calendar,
  Edit,
  Sparkles,
  FileText
} from 'lucide-react'
import confetti from 'canvas-confetti'

export default function ApplicationStatusPage() {
  const router = useRouter()
  const { organizerProfile, isApproved, isPending, isRejected, isSuspended, loading, hasApplication } = useOrganizer()
  const [showConfetti, setShowConfetti] = useState(false)

  // Redirect to dashboard if approved
  useEffect(() => {
    if (isApproved && !showConfetti) {
      setShowConfetti(true)
      
      const duration = 3000
      const end = Date.now() + duration

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#EB7D30', '#000000', '#FFD700']
        })
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#EB7D30', '#000000', '#FFD700']
        })

        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      }
      frame()

      const timer = setTimeout(() => {
        router.push('/organizer');
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [isApproved, showConfetti, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!hasApplication) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-12 h-12 text-gray-400" />
        </div>
        <h1 className="text-3xl font-bold font-comfortaa mb-2">No Application Found</h1>
        <p className="text-gray-600 mb-6 font-body">
          You haven't applied to become an organizer yet.
        </p>
        <Button onClick={() => router.push('/dashboard/apply-organizer')} size="lg">
          Start Your Application
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    )
  }

  // --- APPROVED STATE ---
  if (isApproved) {
    return (
      <div className="max-w-3xl mx-auto py-8 text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-12 h-12 text-green-600" />
        </div>
        <h1 className="text-4xl font-bold font-heading mb-4 text-gray-900">
          Congratulations! You're an <span className="gradient-text font-playful pr-2">Organizer</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-xl mx-auto mb-8 font-body">
          Your application has been approved. You can now create events, manage tickets, and grow your audience.
        </p>
        <div className="bg-white rounded-2xl shadow-xl border p-8 space-y-4">
          <p className="font-semibold">What's next?</p>
          <ul className="text-gray-600 font-body space-y-2">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>Set up your M-Pesa payment credentials to get paid.</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>Create your first event and start selling tickets.</span>
              </li>
          </ul>
          <Button onClick={() => router.push('/organizer')} size="lg" className="w-full mt-4">
            Go to Organizer Dashboard
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <p className="text-sm text-gray-500">Redirecting automatically in 5 seconds...</p>
        </div>
      </div>
    )
  }

  // --- PENDING / REJECTED / SUSPENDED STATES ---
  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 font-comfortaa">
          Application Status
        </h1>
        <p className="text-gray-600 mt-1 font-body">Here's the current status of your organizer application.</p>
      </div>

      {isPending && (
        <Card className="border-yellow-200 bg-yellow-50/80">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <CardTitle className="text-yellow-900 font-comfortaa">Application Under Review</CardTitle>
                <CardDescription className="text-yellow-700 font-body">
                  We're reviewing your application, usually within 24-48 hours.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {isRejected && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle className="font-comfortaa">Application Not Approved</AlertTitle>
          <AlertDescription className="font-body mt-2">
            <p className="font-semibold">Reason:</p>
            <p>{organizerProfile?.rejection_reason || 'No specific reason provided.'}</p>
          </AlertDescription>
        </Alert>
      )}
      
      {isSuspended && (
         <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="font-comfortaa">Account Suspended</AlertTitle>
            <AlertDescription className="font-body mt-2">
              <p>Your organizer account has been temporarily suspended. Please contact support for more information.</p>
            </AlertDescription>
        </Alert>
      )}

      {/* Application Details */}
      <Card>
        <CardHeader>
          <CardTitle className="font-comfortaa">Your Application</CardTitle>
          <CardDescription className="font-body">Submitted on {new Date(organizerProfile.created_at).toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-semibold text-gray-500 font-body">Business Name</dt>
              <dd className="text-gray-900 font-body">{organizerProfile.business_name}</dd>
            </div>
            {organizerProfile.business_registration && (
              <div>
                <dt className="text-sm font-semibold text-gray-500 font-body">Registration Number</dt>
                <dd className="text-gray-900 font-body">{organizerProfile.business_registration}</dd>
              </div>
            )}
            {organizerProfile.website && (
              <div>
                <dt className="text-sm font-semibold text-gray-500 font-body">Website</dt>
                <dd>
                  <a 
                    href={organizerProfile.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-body"
                  >
                    {organizerProfile.website}
                  </a>
                </dd>
              </div>
            )}
             {organizerProfile.description && (
              <div>
                <dt className="text-sm font-semibold text-gray-500 font-body">Description</dt>
                <dd className="text-gray-700 font-body whitespace-pre-wrap">{organizerProfile.description}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button onClick={() => router.push('/dashboard/apply-organizer')}>
          <Edit className="w-4 h-4 mr-2" />
          {isRejected ? 'Update & Reapply' : 'Edit Application'}
        </Button>
        <Button 
          variant="outline"
          onClick={() => window.location.href = 'mailto:support@e-klix.com'}
        >
          <Mail className="w-4 h-4 mr-2" />
          Contact Support
        </Button>
      </div>

    </div>
  )
}