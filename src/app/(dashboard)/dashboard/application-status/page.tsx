// app/(dashboard)/application-status/page.tsx
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
  Sparkles
} from 'lucide-react'
import confetti from 'canvas-confetti'

export default function ApplicationStatusPage() {
  const router = useRouter()
  const { organizerProfile, status, isApproved, isPending, isRejected, isSuspended, loading } = useOrganizer()
  const [showConfetti, setShowConfetti] = useState(false)

  // Redirect to dashboard if approved
  useEffect(() => {
    if (isApproved && !showConfetti) {
      setShowConfetti(true)
      
      // Trigger confetti
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

      // Auto redirect after 5 seconds
      const timer = setTimeout(() => {
        router.push('/dashboard/organizer')
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

  if (!organizerProfile) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <Card>
          <CardHeader>
            <CardTitle>No Application Found</CardTitle>
            <CardDescription>You haven't submitted an organizer application yet</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/dashboard/apply-organizer')}>
              Start Application
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Organizer Application
        </h1>
        <p className="text-gray-600">
          Track the status of your application
        </p>
      </div>

      {/* Status Card - PENDING */}
      {isPending && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <CardTitle className="text-yellow-900">Application Under Review</CardTitle>
                  <CardDescription className="text-yellow-700">
                    We're reviewing your application
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="bg-yellow-200 text-yellow-800">
                Pending
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Timeline */}
            <div className="bg-white rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Application Timeline</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Application Submitted</p>
                    <p className="text-sm text-gray-500">
                      {new Date(organizerProfile.created_at).toLocaleDateString('en-KE', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Under Review</p>
                    <p className="text-sm text-gray-500">
                      Our team is reviewing your application
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 opacity-40">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-500">Decision</p>
                    <p className="text-sm text-gray-400">
                      You'll be notified via email
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertTitle>What happens next?</AlertTitle>
              <AlertDescription className="mt-2 space-y-1">
                <p>• Our team typically reviews applications within 1-2 business days</p>
                <p>• We'll verify your business information</p>
                <p>• You'll receive an email notification once approved</p>
                <p>• Check your spam folder if you don't see our email</p>
              </AlertDescription>
            </Alert>

            {/* Application Details */}
            <div className="bg-white rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Your Application</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Business Name</dt>
                  <dd className="text-gray-900">{organizerProfile.business_name}</dd>
                </div>
                {organizerProfile.business_registration && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Registration Number</dt>
                    <dd className="text-gray-900">{organizerProfile.business_registration}</dd>
                  </div>
                )}
                {organizerProfile.website && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Website</dt>
                    <dd>
                      <a 
                        href={organizerProfile.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {organizerProfile.website}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={() => router.push('/dashboard/apply-organizer')}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Application
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Card - APPROVED */}
      {isApproved && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-green-900 flex items-center gap-2">
                    Congratulations! 🎉
                    <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
                  </CardTitle>
                  <CardDescription className="text-green-700">
                    Your application has been approved
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-200 text-green-800">
                Approved
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="border-green-300 bg-green-100">
              <Sparkles className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-900">Welcome to Klix Organizers!</AlertTitle>
              <AlertDescription className="text-green-800 mt-2">
                You can now create events, manage tickets, and grow your audience on Kenya's leading event platform.
              </AlertDescription>
            </Alert>

            {/* Approval Details */}
            <div className="bg-white rounded-lg p-6">
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Business Name</dt>
                  <dd className="text-gray-900 font-medium">{organizerProfile.business_name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Approved On</dt>
                  <dd className="text-gray-900">
                    {organizerProfile.approved_at && new Date(organizerProfile.approved_at).toLocaleDateString('en-KE', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Next Steps */}
            <div className="bg-white rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Next Steps</h3>
              <ol className="space-y-3 list-decimal list-inside text-gray-700">
                <li>Set up your M-Pesa payment credentials</li>
                <li>Create your first event</li>
                <li>Add ticket types and pricing</li>
                <li>Invite promoters to help sell tickets</li>
                <li>Assign staff for check-ins</li>
              </ol>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={() => router.push('/dashboard/organizer')}
                className="flex-1"
              >
                Go to Organizer Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <p className="text-sm text-center text-gray-500">
              Redirecting automatically in 5 seconds...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Status Card - REJECTED */}
      {isRejected && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 rounded-full">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-red-900">Application Not Approved</CardTitle>
                  <CardDescription className="text-red-700">
                    We were unable to approve your application at this time
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="bg-red-200 text-red-800">
                Rejected
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Reason for Rejection</AlertTitle>
              <AlertDescription className="mt-2">
                {organizerProfile.rejection_reason || 'No specific reason provided. Please contact support for more information.'}
              </AlertDescription>
            </Alert>

            <div className="bg-white rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">What You Can Do</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Review the rejection reason above</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Update your application with the requested information</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Contact support if you need clarification</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Resubmit your application</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={() => router.push('/dashboard/apply-organizer')}
                className="flex-1"
              >
                <Edit className="w-4 h-4 mr-2" />
                Update & Reapply
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = 'mailto:support@klix.co.ke'}
              >
                <Mail className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Card - SUSPENDED */}
      {isSuspended && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-full">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-orange-900">Account Suspended</CardTitle>
                  <CardDescription className="text-orange-700">
                    Your organizer account has been temporarily suspended
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="bg-orange-200 text-orange-800">
                Suspended
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="border-orange-300 bg-orange-100">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertTitle className="text-orange-900">Why was my account suspended?</AlertTitle>
              <AlertDescription className="text-orange-800 mt-2">
                Your account may have been suspended due to policy violations, reported issues, or pending verification. 
                Please contact support for more details.
              </AlertDescription>
            </Alert>

            <div className="bg-white rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">To Resolve This</h3>
              <p className="text-gray-700 mb-4">
                Please reach out to our support team to discuss your account status and steps for reinstatement.
              </p>
              <Button 
                variant="outline"
                onClick={() => window.location.href = 'mailto:support@klix.co.ke'}
              >
                <Mail className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}