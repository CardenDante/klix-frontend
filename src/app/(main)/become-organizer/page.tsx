'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useOrganizer } from '@/hooks/useOrganizer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Rocket,
  TrendingUp,
  Shield,
  Zap,
  Users,
  BarChart3,
  CreditCard,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  Star,
  DollarSign,
  Clock,
  Target,
  Award,
  UserPlus,
  Info
} from 'lucide-react'

export default function BecomeOrganizerPage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const { hasApplication, isApproved, isPending } = useOrganizer()

  const handleCTA = () => {
    if (!isAuthenticated) {
      // Show modal or redirect to register with explanation
      router.push('/register?next=organizer')
    } else if (isPending) {
      router.push('/dashboard/application-status')
    } else if (isApproved) {
      router.push('/dashboard/organizer')
    } else {
      router.push('/dashboard/apply-organizer')
    }
  }

  const getCtaText = () => {
    if (!isAuthenticated) return 'Create Free Account to Apply'
    if (isApproved) return 'Go to Dashboard'
    if (isPending) return 'Check Application Status'
    return 'Start Your Application'
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-white to-primary/5 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Info Banner for non-authenticated users */}
          {!isAuthenticated && (
            <Alert className="mb-8 bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                <strong>Quick setup:</strong> Create a free account first (takes 30 seconds), then apply to become an organizer. 
                We need your account to track your application status and send you updates.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-primary text-white">FOR ORGANIZERS</Badge>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 font-comfortaa">
                Turn Your Events Into 
                <span className="text-primary"> Revenue</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 font-body">
                Kenya's most powerful event ticketing platform. Zero upfront costs, 
                instant payouts, and tools to scale your events.
              </p>
              
              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Direct M-Pesa payments</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Real-time analytics</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Built-in promoters</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  size="lg" 
                  onClick={handleCTA}
                  className="text-lg px-8 py-6 w-full sm:w-auto bg-primary hover:bg-primary/90"
                >
                  {!isAuthenticated && <UserPlus className="w-5 h-5 mr-2" />}
                  {getCtaText()}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>

                {!isAuthenticated && (
                  <p className="text-sm text-gray-600 font-body flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Step 1: Create account (30 sec) • Step 2: Apply (2 min) • Step 3: Get approved (1-2 days)
                  </p>
                )}

                {isAuthenticated && !hasApplication && (
                  <p className="text-sm text-green-600 font-body flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Account ready! Click above to start your organizer application.
                  </p>
                )}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-4xl font-bold text-primary mb-2 font-heading">2.5%</div>
                  <div className="text-sm text-gray-600 font-body">Platform Fee</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-4xl font-bold text-primary mb-2 font-heading">KSh 0</div>
                  <div className="text-sm text-gray-600 font-body">Setup Cost</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-4xl font-bold text-primary mb-2 font-heading">100%</div>
                  <div className="text-sm text-gray-600 font-body">Payout Rate</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-4xl font-bold text-primary mb-2 font-heading">24/7</div>
                  <div className="text-sm text-gray-600 font-body">Support</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Rest of the sections remain the same... */}
      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 font-comfortaa">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto font-body">
              Powerful tools designed specifically for Kenyan event organizers
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 font-heading">Direct Payments</h3>
                <p className="text-gray-600 font-body">
                  Money goes straight to your M-Pesa. No waiting, no middleman, 
                  instant access to your earnings.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 font-heading">Real-Time Analytics</h3>
                <p className="text-gray-600 font-body">
                  Track ticket sales, revenue, and attendee demographics in real-time 
                  with beautiful dashboards.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 font-heading">Promoter Network</h3>
                <p className="text-gray-600 font-body">
                  Leverage influencers and affiliates to sell more tickets with 
                  built-in tracking and commissions.
                </p>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 font-heading">QR Code Security</h3>
                <p className="text-gray-600 font-body">
                  Prevent fraud with cryptographically signed QR codes. 
                  One scan only, 100% secure.
                </p>
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
                  <Smartphone className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 font-heading">Staff Management</h3>
                <p className="text-gray-600 font-body">
                  Assign staff for check-ins. They scan tickets on their phones 
                  - simple, fast, reliable.
                </p>
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 font-heading">Instant Setup</h3>
                <p className="text-gray-600 font-body">
                  Create events in minutes. Add tickets, set prices, publish. 
                  No technical knowledge required.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works - UPDATED to clarify account requirement */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 font-comfortaa">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 font-body">
              From signup to your first sold-out event
            </p>
          </div>

          <div className="space-y-8">
            {/* Step 1 - UPDATED */}
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 font-heading">Create Your Free Account</h3>
                <p className="text-gray-600 font-body">
                  Sign up with email or Google. Takes 30 seconds. 
                  This account lets us track your application and notify you of updates.
                </p>
              </div>
            </div>

            {/* Step 2 - UPDATED */}
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 font-heading">Apply to Become Organizer</h3>
                <p className="text-gray-600 font-body">
                  Fill out a simple form with your business details. 
                  Takes about 2 minutes. No complex paperwork required.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 font-heading">Get Approved</h3>
                <p className="text-gray-600 font-body">
                  We review applications within 1-2 business days. 
                  You'll get an email notification once approved.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg">
                4
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 font-heading">Set Up M-Pesa</h3>
                <p className="text-gray-600 font-body">
                  Add your Paybill or Till Number credentials. 
                  Payments go directly to your account - we never hold your money.
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg">
                5
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 font-heading">Create & Sell</h3>
                <p className="text-gray-600 font-body">
                  Create events, add tickets, set prices, publish. 
                  Share your event link and watch the tickets sell!
                </p>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Button size="lg" onClick={handleCTA} className="bg-primary hover:bg-primary/90">
              {getCtaText()}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Section - Add clarification about account */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 font-comfortaa">
              Frequently Asked Questions
            </h2>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {/* NEW FAQ */}
            <AccordionItem value="item-0" className="bg-gray-50 rounded-lg px-6 border">
              <AccordionTrigger className="text-left font-semibold font-heading">
                Do I need an account before applying?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 font-body">
                Yes! You need to create a free Klix account first (takes 30 seconds with email or Google). 
                This lets us link your organizer application to your account, track your application status, 
                and send you email updates when approved. After approval, your account is upgraded to organizer role.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-1" className="bg-gray-50 rounded-lg px-6 border">
              <AccordionTrigger className="text-left font-semibold font-heading">
                How much does it cost to become an organizer?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 font-body">
                Zero upfront costs. We charge a small 2.5% platform fee on each ticket sold. 
                That's it. No monthly subscriptions, no hidden fees.
              </AccordionContent>
            </AccordionItem>

            {/* Rest of FAQs... */}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary to-primary/80 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 font-comfortaa">
            Ready to Start Organizing?
          </h2>
          <p className="text-xl mb-8 text-white/90 font-body">
            Join hundreds of successful event organizers on Kenya's leading ticketing platform
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={handleCTA}
            className="text-lg px-8 py-6"
          >
            {getCtaText()}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <p className="text-sm mt-4 text-white/80 font-body">
            {!isAuthenticated ? 'Free account • ' : ''}No credit card required • Approval within 1-2 days
          </p>
        </div>
      </section>
    </div>
  )
}