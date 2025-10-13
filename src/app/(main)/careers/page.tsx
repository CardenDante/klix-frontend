'use client';

import { Briefcase, MapPin, Clock, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function CareersPage() {
  const jobs = [
    {
      title: 'Senior Full Stack Developer',
      location: 'Remote',
      type: 'Full-time',
      description: 'We\'re looking for an experienced developer to help build and scale our platform using React, Next.js, and FastAPI.',
      requirements: ['5+ years experience', 'React & TypeScript', 'Python/FastAPI', 'PostgreSQL']
    },
    {
      title: 'Product Designer',
      location: 'Nairobi',
      type: 'Full-time',
      description: 'Join our design team to create beautiful, intuitive experiences for our users.',
      requirements: ['3+ years experience', 'Figma expertise', 'UI/UX design', 'Mobile-first thinking']
    },
    {
      title: 'Customer Success Manager',
      location: 'Nairobi',
      type: 'Full-time',
      description: 'Help our organizers and users get the most out of the Klix platform.',
      requirements: ['2+ years experience', 'Excellent communication', 'Problem solving', 'Customer-focused']
    },
    {
      title: 'Marketing Lead',
      location: 'Hybrid',
      type: 'Full-time',
      description: 'Drive growth through creative marketing campaigns and partnerships.',
      requirements: ['3+ years experience', 'Digital marketing', 'Content creation', 'Analytics']
    }
  ];

  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 font-comfortaa">Join Our Team</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-body">
            Help us build the future of event experiences in Kenya. 
            We're a passionate team creating something special.
          </p>
        </div>

        {/* Why Join Us */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2 font-comfortaa">Impactful Work</h3>
              <p className="text-sm text-gray-600 font-body">
                Build products that thousands of Kenyans use every day
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2 font-comfortaa">Flexible Schedule</h3>
              <p className="text-sm text-gray-600 font-body">
                Work-life balance with remote and hybrid options
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2 font-comfortaa">Great Culture</h3>
              <p className="text-sm text-gray-600 font-body">
                Collaborative environment with passionate teammates
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Open Positions */}
        <div>
          <h2 className="text-3xl font-bold mb-8 font-comfortaa">Open Positions</h2>
          <div className="space-y-6">
            {jobs.map((job, index) => (
              <Card key={index} className="hover:shadow-lg transition">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold font-comfortaa">{job.title}</h3>
                        <Badge variant="secondary">{job.type}</Badge>
                      </div>
                      <p className="text-gray-600 mb-3 font-body">{job.description}</p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1 font-body">
                          <MapPin className="w-4 h-4" />
                          {job.location}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {job.requirements.map((req, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs font-body">
                              {req}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <Button className="bg-primary hover:bg-primary/90">
                      Apply Now
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-4 font-comfortaa">Don't See Your Role?</h2>
          <p className="text-lg mb-6 text-white/90 font-body">
            We're always looking for talented people. Send us your resume!
          </p>
          <Button variant="secondary" size="lg">
            Send Application
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}