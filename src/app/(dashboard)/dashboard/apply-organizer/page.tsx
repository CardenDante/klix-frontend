// app/(dashboard)/apply-organizer/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useOrganizer } from '@/hooks/useOrganizer'
import { organizersApi } from '@/lib/api/organizers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Upload, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

interface FormData {
  business_name: string
  business_registration: string
  description: string
  website: string
  logo_url: string
}

export default function ApplyOrganizerPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { organizerProfile, hasApplication, loading: orgLoading } = useOrganizer()

  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    business_name: '',
    business_registration: '',
    description: '',
    website: '',
    logo_url: ''
  })
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [submitting, setSubmitting] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  // Redirect if already has application
  useEffect(() => {
    if (!orgLoading && hasApplication) {
      router.push('/dashboard/application-status')
    }
  }, [hasApplication, orgLoading, router])

  // Load draft from localStorage
  useEffect(() => {
    const draft = localStorage.getItem('organizer_application_draft')
    if (draft) {
      try {
        const parsed = JSON.parse(draft)
        setFormData(parsed)
        toast.info('Draft restored from last session')
      } catch (err) {
        console.error('Failed to parse draft:', err)
      }
    }
  }, [])

  // Auto-save draft
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.business_name || formData.description) {
        localStorage.setItem('organizer_application_draft', JSON.stringify(formData))
      }
    }, 1000)
    return () => clearTimeout(timer)
  }, [formData])

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Partial<FormData> = {}

    if (stepNumber === 1) {
      if (!formData.business_name.trim()) {
        newErrors.business_name = 'Business name is required'
      } else if (formData.business_name.length < 2) {
        newErrors.business_name = 'Business name must be at least 2 characters'
      }
    }

    if (stepNumber === 2) {
      if (formData.website && !formData.website.match(/^https?:\/\/.+/)) {
        newErrors.website = 'Please enter a valid URL (e.g., https://example.com)'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    setStep(prev => prev - 1)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    try {
      setUploadingLogo(true)
      
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      formDataUpload.append('upload_type', 'organizer_logo')
      formDataUpload.append('entity_id', user?.id || '')

      const response = await fetch('/api/v1/uploads/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: formDataUpload
      })

      if (!response.ok) throw new Error('Upload failed')

      const data = await response.json()
      setFormData(prev => ({ ...prev, logo_url: data.url }))
      toast.success('Logo uploaded successfully!')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleSubmit = async () => {
    if (!validateStep(3)) return

    try {
      setSubmitting(true)

      const payload = {
        business_name: formData.business_name,
        ...(formData.business_registration && { business_registration: formData.business_registration }),
        ...(formData.description && { description: formData.description }),
        ...(formData.website && { website: formData.website }),
        ...(formData.logo_url && { logo_url: formData.logo_url })
      }

      await organizersApi.apply(payload)

      // Clear draft
      localStorage.removeItem('organizer_application_draft')
      
      toast.success('Application submitted successfully!')
      router.push('/dashboard/application-status')
    } catch (error: any) {
      console.error('Application error:', error)
      toast.error(error.response?.data?.detail || 'Failed to submit application')
    } finally {
      setSubmitting(false)
    }
  }

  if (orgLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const totalSteps = 3
  const progress = (step / totalSteps) * 100

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Become a Klix Organizer
        </h1>
        <p className="text-gray-600">
          Start creating and managing events on Kenya's leading ticketing platform
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
          <CardTitle>
            {step === 1 && 'Business Information'}
            {step === 2 && 'Additional Details'}
            {step === 3 && 'Review & Submit'}
          </CardTitle>
          <CardDescription>
            {step === 1 && 'Tell us about your business or organization'}
            {step === 2 && 'Help us know you better (optional but recommended)'}
            {step === 3 && 'Review your application before submitting'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Business Info */}
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="business_name">
                  Business Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="business_name"
                  placeholder="e.g., Amazing Events Ltd"
                  value={formData.business_name}
                  onChange={(e) => handleInputChange('business_name', e.target.value)}
                  className={errors.business_name ? 'border-red-500' : ''}
                />
                {errors.business_name && (
                  <p className="text-sm text-red-500">{errors.business_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_registration">
                  Business Registration Number
                </Label>
                <Input
                  id="business_registration"
                  placeholder="e.g., PVT-ABC123"
                  value={formData.business_registration}
                  onChange={(e) => handleInputChange('business_registration', e.target.value)}
                />
                <p className="text-sm text-gray-500">
                  Optional but helps build trust with attendees
                </p>
              </div>
            </>
          )}

          {/* Step 2: Additional Details */}
          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="description">About Your Business</Label>
                <Textarea
                  id="description"
                  placeholder="Tell us about the types of events you organize..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={5}
                  maxLength={2000}
                />
                <p className="text-sm text-gray-500 text-right">
                  {formData.description.length}/2000 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://yourwebsite.com"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className={errors.website ? 'border-red-500' : ''}
                />
                {errors.website && (
                  <p className="text-sm text-red-500">{errors.website}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Business Logo</Label>
                <div className="flex items-center gap-4">
                  {formData.logo_url ? (
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                      <img 
                        src={formData.logo_url} 
                        alt="Logo" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center bg-gray-50">
                      <Upload className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      className="cursor-pointer"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      PNG, JPG up to 5MB. Recommended: 400x400px
                    </p>
                  </div>

                  {uploadingLogo && (
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  )}
                </div>
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
                  <h3 className="font-semibold text-sm text-gray-500 mb-1">Business Name</h3>
                  <p className="text-gray-900">{formData.business_name}</p>
                </div>

                {formData.business_registration && (
                  <div>
                    <h3 className="font-semibold text-sm text-gray-500 mb-1">Registration Number</h3>
                    <p className="text-gray-900">{formData.business_registration}</p>
                  </div>
                )}

                {formData.description && (
                  <div>
                    <h3 className="font-semibold text-sm text-gray-500 mb-1">Description</h3>
                    <p className="text-gray-900 whitespace-pre-wrap">{formData.description}</p>
                  </div>
                )}

                {formData.website && (
                  <div>
                    <h3 className="font-semibold text-sm text-gray-500 mb-1">Website</h3>
                    <a 
                      href={formData.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {formData.website}
                    </a>
                  </div>
                )}

                {formData.logo_url && (
                  <div>
                    <h3 className="font-semibold text-sm text-gray-500 mb-1">Logo</h3>
                    <img 
                      src={formData.logo_url} 
                      alt="Logo" 
                      className="w-24 h-24 rounded-lg object-cover border"
                    />
                  </div>
                )}
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your application will be reviewed within 1-2 business days. 
                  We'll notify you via email once approved.
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
              disabled={step === 1 || submitting}
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
                disabled={submitting}
              >
                {submitting ? (
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
    </div>
  )
}