'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  DollarSign, Users, TrendingUp, Star, Award, Target,
  Check, ArrowRight, Instagram, Twitter, Facebook, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export default function BecomePromoterPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    business_name: '',
    phone_number: '',
    social_media_links: {
      instagram: '',
      twitter: '',
      facebook: '',
      tiktok: '',
      youtube: ''
    },
    audience_size: '',
    experience_description: '',
    why_join: '',
    sample_content: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Please login first');
      router.push('/login?redirect=/become-promoter');
      return;
    }

    setLoading(true);

    try {
      await apiClient.post('/api/v1/promoters/apply', formData);
      
      toast.success('Application submitted successfully!');
      router.push('/dashboard/promoter-application-status');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    {
      icon: DollarSign,
      title: 'Earn Commission',
      description: 'Get 5-10% commission on every ticket sold through your codes',
      color: 'text-green-600',
      bg: 'bg-green-100'
    },
    {
      icon: TrendingUp,
      title: 'Track Performance',
      description: 'Real-time analytics dashboard to monitor your earnings',
      color: 'text-blue-600',
      bg: 'bg-blue-100'
    },
    {
      icon: Users,
      title: 'Flexible Work',
      description: 'Promote multiple events at your own pace and schedule',
      color: 'text-purple-600',
      bg: 'bg-purple-100'
    },
    {
      icon: Award,
      title: 'Leaderboards',
      description: 'Compete with top promoters and earn recognition',
      color: 'text-orange-600',
      bg: 'bg-orange-100'
    }
  ];

  const requirements = [
    'Active social media presence',
    'Engaged audience (minimum 1,000 followers recommended)',
    'Experience in content creation or marketing (preferred)',
    'Reliable internet connection',
    'Professional communication skills'
  ];

  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-block p-3 bg-primary/10 rounded-full mb-4">
            <Star className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-5xl font-bold mb-4 font-comfortaa">Become a Promoter</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-body">
            Turn your influence into income. Promote amazing events and earn commission on every ticket sold.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <Card key={index}>
                <CardContent className="pt-6 text-center">
                  <div className={`w-12 h-12 ${benefit.bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <Icon className={`w-6 h-6 ${benefit.color}`} />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 font-comfortaa">{benefit.title}</h3>
                  <p className="text-sm text-gray-600 font-body">{benefit.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* How It Works */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-center font-comfortaa">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { step: '1', title: 'Apply', description: 'Fill out the application form below' },
                { step: '2', title: 'Get Approved', description: 'Our team reviews within 48 hours' },
                { step: '3', title: 'Create Codes', description: 'Generate promo codes for events' },
                { step: '4', title: 'Earn Money', description: 'Get paid for each ticket sold' }
              ].map((item, index) => (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold font-comfortaa">
                    {item.step}
                  </div>
                  <h4 className="font-semibold mb-1 font-comfortaa">{item.title}</h4>
                  <p className="text-sm text-gray-600 font-body">{item.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Requirements */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="font-comfortaa">Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {requirements.map((req, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="p-1 bg-green-100 rounded-full mt-1">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-gray-700 font-body">{req}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Application Form */}
        <Card>
          <CardHeader>
            <CardTitle className="font-comfortaa">Application Form</CardTitle>
            <p className="text-sm text-gray-600 font-body">
              Tell us about yourself and your audience
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 font-body">
                    Full Name / Business Name *
                  </label>
                  <Input
                    value={formData.business_name}
                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                    placeholder="John Doe / Doe Events"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 font-body">
                    Phone Number *
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    placeholder="+254 712 345 678"
                    required
                  />
                </div>
              </div>

              {/* Social Media */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 font-body">
                  Social Media Links
                </label>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      value={formData.social_media_links.instagram}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        social_media_links: { ...formData.social_media_links, instagram: e.target.value }
                      })}
                      placeholder="Instagram profile URL"
                      className="pl-11"
                    />
                  </div>
                  <div className="relative">
                    <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      value={formData.social_media_links.twitter}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        social_media_links: { ...formData.social_media_links, twitter: e.target.value }
                      })}
                      placeholder="Twitter/X profile URL"
                      className="pl-11"
                    />
                  </div>
                  <div className="relative">
                    <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      value={formData.social_media_links.facebook}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        social_media_links: { ...formData.social_media_links, facebook: e.target.value }
                      })}
                      placeholder="Facebook profile URL"
                      className="pl-11"
                    />
                  </div>
                  <Input
                    value={formData.social_media_links.tiktok}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      social_media_links: { ...formData.social_media_links, tiktok: e.target.value }
                    })}
                    placeholder="TikTok profile URL (optional)"
                  />
                </div>
              </div>

              {/* Audience Size */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-body">
                  Total Audience Size (Followers/Subscribers) *
                </label>
                <Input
                  value={formData.audience_size}
                  onChange={(e) => setFormData({ ...formData, audience_size: e.target.value })}
                  placeholder="e.g., 5,000 followers on Instagram, 2,000 on TikTok"
                  required
                />
                <p className="text-xs text-gray-500 mt-1 font-body">
                  Combine all platforms. Minimum 1,000 recommended.
                </p>
              </div>

              {/* Experience */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-body">
                  Marketing/Promotion Experience *
                </label>
                <Textarea
                  value={formData.experience_description}
                  onChange={(e) => setFormData({ ...formData, experience_description: e.target.value })}
                  placeholder="Describe your experience in content creation, marketing, or event promotion..."
                  rows={4}
                  required
                />
              </div>

              {/* Why Join */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-body">
                  Why do you want to become a promoter? *
                </label>
                <Textarea
                  value={formData.why_join}
                  onChange={(e) => setFormData({ ...formData, why_join: e.target.value })}
                  placeholder="Tell us your motivation and how you plan to promote events..."
                  rows={4}
                  required
                />
              </div>

              {/* Sample Content */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-body">
                  Sample Content/Portfolio (Optional)
                </label>
                <Textarea
                  value={formData.sample_content}
                  onChange={(e) => setFormData({ ...formData, sample_content: e.target.value })}
                  placeholder="Share links to your best posts, campaigns, or promotional content..."
                  rows={3}
                />
              </div>

              {/* Submit */}
              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Application
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-gray-500 text-center font-body">
                By applying, you agree to our Terms of Service and Promoter Agreement
              </p>
            </form>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 font-body">
            Have questions? <a href="/contact" className="text-primary hover:underline">Contact us</a>
          </p>
        </div>
      </div>
    </div>
  );
}