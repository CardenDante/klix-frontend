'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePromoter } from '@/hooks/usePromoter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, CheckCircle, XCircle, AlertCircle, ArrowRight, 
  RefreshCw, Calendar, User, Phone, Globe, Target, Award,
  TrendingUp, Loader2
} from 'lucide-react';

export default function PromoterApplicationStatusPage() {
  const router = useRouter();
  const { promoterProfile, loading, isPending, isApproved, isRejected, refetch } = usePromoter();

  useEffect(() => {
    // If approved, redirect to promoter dashboard
    if (isApproved) {
      router.push('/promoter');
    }
  }, [isApproved, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600 font-body">Loading application status...</p>
        </div>
      </div>
    );
  }

  // No application found
  if (!promoterProfile) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold mb-4 font-comfortaa">No Application Found</h2>
            <p className="text-gray-600 mb-6 font-body">
              You haven't applied to become a promoter yet.
            </p>
            <Button onClick={() => router.push('/become-promoter')}>
              Apply Now
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      {/* Status Header */}
      <Card className={`border-l-4 ${
        isPending ? 'border-l-yellow-500 bg-yellow-50' :
        isRejected ? 'border-l-red-500 bg-red-50' :
        'border-l-green-500 bg-green-50'
      }`}>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-full ${
                isPending ? 'bg-yellow-200' :
                isRejected ? 'bg-red-200' :
                'bg-green-200'
              }`}>
                {isPending && <Clock className="w-8 h-8 text-yellow-700" />}
                {isRejected && <XCircle className="w-8 h-8 text-red-700" />}
                {isApproved && <CheckCircle className="w-8 h-8 text-green-700" />}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold font-comfortaa">
                    {isPending && 'Application Under Review'}
                    {isRejected && 'Application Not Approved'}
                    {isApproved && 'Application Approved!'}
                  </h1>
                  <Badge className={
                    isPending ? 'bg-yellow-500' :
                    isRejected ? 'bg-red-500' :
                    'bg-green-500'
                  }>
                    {promoterProfile.status}
                  </Badge>
                </div>
                <p className="text-gray-700 font-body">
                  {isPending && "We're reviewing your application. This usually takes 24-48 hours."}
                  {isRejected && "Your application wasn't approved at this time. See details below."}
                  {isApproved && "Congratulations! You're now an approved promoter."}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={refetch}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="font-comfortaa">Application Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Submitted */}
            <div className="flex items-start gap-4">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold font-comfortaa">Application Submitted</h4>
                  <span className="text-sm text-gray-500 font-body">
                    {new Date(promoterProfile.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 font-body">Your application has been received</p>
              </div>
            </div>

            {/* Under Review */}
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-full ${
                isPending ? 'bg-yellow-100 animate-pulse' : 
                isApproved || isRejected ? 'bg-green-100' : 
                'bg-gray-100'
              }`}>
                {isPending ? (
                  <Clock className="w-5 h-5 text-yellow-600" />
                ) : isApproved || isRejected ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <Clock className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold font-comfortaa">Under Review</h4>
                <p className="text-sm text-gray-600 font-body">
                  {isPending ? 'Currently being reviewed by our team' : 'Review completed'}
                </p>
              </div>
            </div>

            {/* Decision */}
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-full ${
                isApproved ? 'bg-green-100' :
                isRejected ? 'bg-red-100' :
                'bg-gray-100'
              }`}>
                {isApproved ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : isRejected ? (
                  <XCircle className="w-5 h-5 text-red-600" />
                ) : (
                  <Clock className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold font-comfortaa">Decision</h4>
                  {(isApproved || isRejected) && (
                    <span className="text-sm text-gray-500 font-body">
                      {new Date(promoterProfile.approved_at || promoterProfile.rejected_at || '').toLocaleDateString()}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 font-body">
                  {isApproved && 'Your application has been approved!'}
                  {isRejected && 'Your application was not approved'}
                  {isPending && 'Pending review'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rejection Reason */}
      {isRejected && promoterProfile.rejection_reason && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900 font-comfortaa">Reason for Rejection</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-800 font-body">{promoterProfile.rejection_reason}</p>
            <div className="mt-4">
              <Button onClick={() => router.push('/become-promoter')}>
                Submit New Application
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Application Details */}
      <Card>
        <CardHeader>
          <CardTitle className="font-comfortaa">Application Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <User className="w-4 h-4" />
                <span className="font-body">Business Name</span>
              </div>
              <p className="font-semibold font-comfortaa">{promoterProfile.business_name}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <Phone className="w-4 h-4" />
                <span className="font-body">Phone</span>
              </div>
              <p className="font-semibold font-comfortaa">{promoterProfile.phone_number}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <Target className="w-4 h-4" />
                <span className="font-body">Audience Size</span>
              </div>
              <p className="font-semibold font-comfortaa">{promoterProfile.audience_size}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="font-body">Applied On</span>
              </div>
              <p className="font-semibold font-comfortaa">
                {new Date(promoterProfile.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <Globe className="w-4 h-4" />
              <span className="font-body">Social Media</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(promoterProfile.social_media_links || {} as Record<string, string | null>)
                .filter(([, url]) => Boolean(url))
                .map(([platform, url]) => (
                  <Badge key={platform} variant="outline" className="font-body">
                    {platform}: <a href={url as string} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">View</a>
                  </Badge>
                ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <Award className="w-4 h-4" />
              <span className="font-body">Experience</span>
            </div>
            <p className="text-gray-700 font-body">{promoterProfile.experience_description}</p>
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="font-body">Why Join</span>
            </div>
            <p className="text-gray-700 font-body">{promoterProfile.why_join}</p>
          </div>
        </CardContent>
      </Card>

      {/* Pending - What's Next */}
      {isPending && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="font-comfortaa">What Happens Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 font-body">
              <li className="flex items-start gap-3">
                <div className="p-1 bg-blue-200 rounded-full mt-1">
                  <CheckCircle className="w-4 h-4 text-blue-700" />
                </div>
                <span>Our team is reviewing your application and social media presence</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="p-1 bg-blue-200 rounded-full mt-1">
                  <CheckCircle className="w-4 h-4 text-blue-700" />
                </div>
                <span>You'll receive an email notification once we make a decision</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="p-1 bg-blue-200 rounded-full mt-1">
                  <CheckCircle className="w-4 h-4 text-blue-700" />
                </div>
                <span>If approved, you'll get immediate access to create promo codes</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Approved - Get Started */}
      {isApproved && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <Award className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2 font-comfortaa">Welcome to the Team!</h3>
              <p className="text-gray-700 mb-6 font-body">
                You're now an approved promoter. Start creating promo codes and earning commission.
              </p>
              <Button onClick={() => router.push('/promoter')} size="lg">
                Go to Promoter Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}