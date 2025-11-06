'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { ArrowRight, Loader2, UserCheck, ArrowLeft, CheckCircle2, AlertCircle, Plus, X } from 'lucide-react';

interface FormData {
  display_name: string;
  bio: string;
  experience: string;
  social_links: { platform: string; url: string }[];
}

export default function ApplyPromoterPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    display_name: '',
    bio: '',
    experience: '',
    social_links: [{ platform: '', url: '' }]
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // Redirect if user is already a promoter
  useEffect(() => {
    if (user && user.role === 'promoter') {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Load draft from localStorage
  useEffect(() => {
    const draft = localStorage.getItem('promoter_application_draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setFormData(parsed);
        toast.info('Draft restored from last session');
      } catch (err) {
        console.error('Failed to parse draft:', err);
      }
    }
  }, []);

  // Auto-save draft
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.display_name || formData.bio) {
        localStorage.setItem('promoter_application_draft', JSON.stringify(formData));
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const addSocialLink = () => {
    setFormData(prev => ({
      ...prev,
      social_links: [...prev.social_links, { platform: '', url: '' }]
    }));
  };

  const removeSocialLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      social_links: prev.social_links.filter((_, i) => i !== index)
    }));
  };

  const updateSocialLink = (index: number, field: 'platform' | 'url', value: string) => {
    setFormData(prev => ({
      ...prev,
      social_links: prev.social_links.map((link, i) =>
        i === index ? { ...link, [field]: value } : link
      )
    }));
  };

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (stepNumber === 1) {
      if (!formData.display_name.trim()) {
        newErrors.display_name = 'Display name is required';
      } else if (formData.display_name.length < 2) {
        newErrors.display_name = 'Display name must be at least 2 characters';
      }

      if (!formData.bio.trim()) {
        newErrors.bio = 'Bio is required';
      } else if (formData.bio.length < 50) {
        newErrors.bio = 'Bio must be at least 50 characters';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) return;

    try {
      setLoading(true);

      // Convert social links to JSON string (only non-empty links)
      const validSocialLinks = formData.social_links.filter(
        link => link.platform.trim() && link.url.trim()
      );

      const socialLinksJson = validSocialLinks.length > 0
        ? JSON.stringify(
            Object.fromEntries(
              validSocialLinks.map(link => [link.platform.toLowerCase(), link.url])
            )
          )
        : undefined;

      const payload = {
        display_name: formData.display_name,
        bio: formData.bio,
        ...(formData.experience && { experience: formData.experience }),
        ...(socialLinksJson && { social_links: socialLinksJson })
      };

      console.log('Submitting promoter application:', payload);

      await api.promoter.apply(payload);

      // Clear draft
      localStorage.removeItem('promoter_application_draft');

      toast.success('Application Submitted!', {
        description: "We've received your application and will review it shortly.",
      });

      router.push('/dashboard/promoter-application-status');
    } catch (error: any) {
      console.error('Application error:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'An unexpected error occurred';
      toast.error('Submission Failed', {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Become a <span className="gradient-text font-playful">Klix Promoter</span>
        </h1>
        <p className="text-gray-600">
          Join our network and start earning by sharing events you love
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Step {step} of {totalSteps}</span>
          <span className="text-sm text-gray-500">{Math.round(progress)}% complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <UserCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>
                {step === 1 && 'Promoter Profile'}
                {step === 2 && 'Social Links & Experience'}
                {step === 3 && 'Review & Submit'}
              </CardTitle>
              <CardDescription>
                {step === 1 && 'Tell us about yourself and why you want to be a promoter'}
                {step === 2 && 'Share your social media and experience (optional)'}
                {step === 3 && 'Review your application before submitting'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="display_name">
                  Display Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="display_name"
                  placeholder="e.g., DJ Awesome, EventProNairobi"
                  value={formData.display_name}
                  onChange={(e) => handleInputChange('display_name', e.target.value)}
                  className={errors.display_name ? 'border-red-500' : ''}
                />
                {errors.display_name && (
                  <p className="text-sm text-red-500">{errors.display_name}</p>
                )}
                <p className="text-sm text-gray-500">
                  This is how you'll be known to organizers and attendees
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">
                  Bio <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself, your audience, and how you plan to promote events..."
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  rows={5}
                  maxLength={500}
                  className={errors.bio ? 'border-red-500' : ''}
                />
                {errors.bio && (
                  <p className="text-sm text-red-500">{errors.bio}</p>
                )}
                <p className="text-sm text-gray-500 text-right">
                  {formData.bio.length}/500 characters (minimum 50)
                </p>
              </div>
            </>
          )}

          {/* Step 2: Social Links & Experience */}
          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="experience">Previous Promotion Experience</Label>
                <Textarea
                  id="experience"
                  placeholder="Share your experience promoting events, your success stories, or any relevant background..."
                  value={formData.experience}
                  onChange={(e) => handleInputChange('experience', e.target.value)}
                  rows={4}
                  maxLength={1000}
                />
                <p className="text-sm text-gray-500 text-right">
                  {formData.experience.length}/1000 characters
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Social Media Links</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSocialLink}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Link
                  </Button>
                </div>

                {formData.social_links.map((link, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Platform (e.g., Instagram, Twitter)"
                      value={link.platform}
                      onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="URL (e.g., https://instagram.com/...)"
                      value={link.url}
                      onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                      className="flex-[2]"
                    />
                    {formData.social_links.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSocialLink(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <p className="text-sm text-gray-500">
                  Add your social media profiles to help organizers verify your reach
                </p>
              </div>
            </>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Please review your information before submitting
                </AlertDescription>
              </Alert>

              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-sm text-gray-500 mb-1">Display Name</h3>
                  <p className="text-gray-900">{formData.display_name}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-sm text-gray-500 mb-1">Bio</h3>
                  <p className="text-gray-900 whitespace-pre-wrap">{formData.bio}</p>
                </div>

                {formData.experience && (
                  <div>
                    <h3 className="font-semibold text-sm text-gray-500 mb-1">Experience</h3>
                    <p className="text-gray-900 whitespace-pre-wrap">{formData.experience}</p>
                  </div>
                )}

                {formData.social_links.some(link => link.platform && link.url) && (
                  <div>
                    <h3 className="font-semibold text-sm text-gray-500 mb-1">Social Links</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.social_links
                        .filter(link => link.platform.trim() && link.url.trim())
                        .map((link, index) => (
                          <a
                            key={index}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100"
                          >
                            {link.platform}
                          </a>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Applications are typically reviewed within 48 hours.
                  You'll receive an email notification once your application is approved.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={step === 1 || loading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            {step < totalSteps ? (
              <Button
                type="button"
                onClick={handleNext}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Application
                    <CheckCircle2 className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-gray-500 text-center mt-6">
        By submitting this application, you agree to our Promoter Terms of Service.
      </p>
    </div>
  );
}
