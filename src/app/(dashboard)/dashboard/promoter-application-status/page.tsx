'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePromoter } from '@/hooks/usePromoter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Loader2, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  Mail,
  Edit,
  Sparkles,
  FileText,
  Megaphone
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function PromoterApplicationStatusPage() {
  const router = useRouter();
  const { promoterProfile, isApproved, isPending, isRejected, loading, hasApplication } = usePromoter();
  const [showConfetti, setShowConfetti] = useState(false);

  // Redirect to promoter dashboard if approved
  useEffect(() => {
    if (isApproved && !showConfetti) {
      setShowConfetti(true);
      
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#EB7D30', '#000000', '#FFD700']
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#EB7D30', '#000000', '#FFD700']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();

      const timer = setTimeout(() => {
        router.push('/promoter');
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isApproved, showConfetti, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasApplication) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-12 h-12 text-gray-400" />
        </div>
        <h1 className="text-3xl font-bold font-comfortaa mb-2">No Application Found</h1>
        <p className="text-gray-600 mb-6 font-body">
          You haven't applied to become a promoter yet.
        </p>
        <Button onClick={() => router.push('/dashboard/apply-promoter')} size="lg">
          Start Your Application
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    );
  }

  // --- APPROVED STATE ---
  if (isApproved) {
    return (
      <div className="max-w-3xl mx-auto py-8 text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-12 h-12 text-green-600" />
        </div>
        <h1 className="text-4xl font-bold font-heading mb-4 text-gray-900">
          Welcome to the <span className="gradient-text font-playful pr-2">Promoter Program!</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-xl mx-auto mb-8 font-body">
          Your application is approved! You can now generate unique promo codes and start earning commissions.
        </p>
        <div className="bg-white rounded-2xl shadow-xl border p-8 space-y-4">
          <p className="font-semibold">What's next?</p>
          <ul className="text-gray-600 font-body space-y-2">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>Generate your first promo code for an event.</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>Share your code and track your earnings.</span>
              </li>
          </ul>
          <Button onClick={() => router.push('/promoter')} size="lg" className="w-full mt-4">
            Go to Promoter Dashboard
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <p className="text-sm text-gray-500">Redirecting automatically in 5 seconds...</p>
        </div>
      </div>
    );
  }

  // --- PENDING / REJECTED STATES ---
  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 font-comfortaa">
          Promoter Application Status
        </h1>
        <p className="text-gray-600 mt-1 font-body">Here's the current status of your promoter application.</p>
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
            <p>{promoterProfile?.rejection_reason || 'No specific reason provided.'}</p>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Application Details */}
      <Card>
        <CardHeader>
          <CardTitle className="font-comfortaa">Your Application</CardTitle>
          <CardDescription className="font-body">Submitted on {new Date(promoterProfile.created_at).toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-semibold text-gray-500 font-body">Promotion Methods</dt>
              <dd className="text-gray-700 font-body whitespace-pre-wrap">{promoterProfile.promotion_methods}</dd>
            </div>
            {promoterProfile.social_media_handles && (
              <div>
                <dt className="text-sm font-semibold text-gray-500 font-body">Social Media / Website</dt>
                <dd className="text-gray-900 font-body">{promoterProfile.social_media_handles}</dd>
              </div>
            )}
             {promoterProfile.audience_description && (
              <div>
                <dt className="text-sm font-semibold text-gray-500 font-body">Audience Description</dt>
                <dd className="text-gray-700 font-body whitespace-pre-wrap">{promoterProfile.audience_description}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button onClick={() => router.push('/dashboard/apply-promoter')}>
          <Edit className="w-4 h-4 mr-2" />
          {isRejected ? 'Update & Reapply' : 'Edit Application'}
        </Button>
        <Button 
          variant="outline"
          onClick={() => window.location.href = 'mailto:support@chach-a.com'}
        >
          <Mail className="w-4 h-4 mr-2" />
          Contact Support
        </Button>
      </div>

    </div>
  );
}