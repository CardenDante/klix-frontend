'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowRight, Loader2, UserCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

const promoterApplicationSchema = z.object({
  social_media_links: z.string().url({ message: 'Please enter a valid URL.' }).min(1, 'Social media link is required.'),
  reason_to_join: z.string().min(50, { message: 'Please tell us a bit more (at least 50 characters).' }).max(500, 'Message is too long (max 500 characters).'),
});

type PromoterApplicationFormValues = z.infer<typeof promoterApplicationSchema>;

export default function ApplyPromoterPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Redirect if user is already a promoter or organizer
  useEffect(() => {
    if (user && (user.role === 'promoter' || user.role === 'organizer')) {
      router.push('/dashboard');
    }
  }, [user, router]);


  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PromoterApplicationFormValues>({
    resolver: zodResolver(promoterApplicationSchema),
  });

  const onSubmit = async (data: PromoterApplicationFormValues) => {
    setLoading(true);
    try {
      // NOTE: This API endpoint will need to be created in your backend.
      // Example: await api.promoters.apply(data); 
      console.log("Submitting application:", data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Application Submitted!', {
        description: "We've received your application and will review it shortly.",
      });
      router.push('/dashboard/promoter-application-status');
    } catch (error: any) {
      toast.error('Submission Failed', {
        description: error.message || 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 font-heading tracking-tight">
          Become a <span className="gradient-text font-playful pr-2">Promoter</span>
        </h1>
        <p className="text-lg text-gray-600 mt-2 font-body">
          Join our network and start earning by sharing events you love.
        </p>
      </div>

      <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-xl border">
        <div className="flex items-start gap-4 mb-8">
            <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-gray-800 font-comfortaa">Promoter Application</h2>
                <p className="text-gray-600 font-body">Tell us why you'd be a great fit for the Klix promoter program.</p>
            </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="social_media_links" className="font-semibold text-gray-700">
              Primary Social Media Link
            </Label>
            <p className="text-sm text-gray-500 mb-2 font-body">e.g., your Instagram, Twitter, or TikTok profile.</p>
            <Input
              id="social_media_links"
              placeholder="https://instagram.com/yourprofile"
              {...register('social_media_links')}
            />
            {errors.social_media_links && <p className="mt-2 text-sm text-red-600">{errors.social_media_links.message}</p>}
          </div>

          <div>
            <Label htmlFor="reason_to_join"  className="font-semibold text-gray-700">
              Why do you want to be a Klix Promoter?
            </Label>
             <p className="text-sm text-gray-500 mb-2 font-body">Tell us about your audience and how you plan to promote events.</p>
            <Textarea
              id="reason_to_join"
              placeholder="I have a strong following of event-goers and I'm excited to..."
              rows={5}
              {...register('reason_to_join')}
            />
            {errors.reason_to_join && <p className="mt-2 text-sm text-red-600">{errors.reason_to_join.message}</p>}
          </div>

          <div>
            <Button type="submit" size="lg" className="w-full font-bold text-lg py-6" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Application
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>
           <p className="text-xs text-gray-500 text-center font-body pt-4">
              By submitting this application, you agree to our Promoter Terms of Service. Applications are typically reviewed within 48 hours.
            </p>
        </form>
      </div>
    </div>
  );
}