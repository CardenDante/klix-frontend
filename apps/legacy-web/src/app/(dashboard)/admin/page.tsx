'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Tag,
  Award,
  UserCheck,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Statistics {
  pending_organizer_applications: number;
  revenue_today: number;
  users_registered_today: number;
  active_issues: number;
  discounts_given_today: number;
  loyalty_redeemed_today: number;
}

export default function AdminDashboardPage() {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.admin.statistics();
      setStatistics(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to fetch statistics';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !statistics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Error Loading Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchStatistics} className="w-full">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = [
    {
      title: 'Pending Organizer Applications',
      value: statistics?.pending_organizer_applications || 0,
      icon: UserCheck,
      description: 'Applications awaiting review',
      href: '/admin/organizers?tab=pending',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      urgent: (statistics?.pending_organizer_applications || 0) > 0,
    },
    {
      title: 'Revenue Today',
      value: formatCurrency(statistics?.revenue_today || 0),
      icon: DollarSign,
      description: 'Platform earnings today',
      href: '/admin/analytics?view=revenue',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'New Users Today',
      value: statistics?.users_registered_today || 0,
      icon: Users,
      description: 'Registered today',
      href: '/admin/users?filter=new',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Active Issues',
      value: statistics?.active_issues || 0,
      icon: AlertCircle,
      description: 'Flagged events requiring attention',
      href: '/admin/events?filter=flagged',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      urgent: (statistics?.active_issues || 0) > 0,
    },
    {
      title: 'Discounts Given Today',
      value: statistics?.discounts_given_today || 0,
      icon: Tag,
      description: 'Promo codes used today',
      href: '/admin/analytics?view=promotions',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Loyalty Redeemed Today',
      value: statistics?.loyalty_redeemed_today || 0,
      icon: Award,
      description: 'Credits redeemed today',
      href: '/admin/analytics?view=loyalty',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
  ];

  const quickActions = [
    {
      title: 'Review Organizer Applications',
      description: 'Approve or reject pending applications',
      href: '/admin/organizers?tab=pending',
      icon: UserCheck,
      badge: statistics?.pending_organizer_applications || 0,
    },
    {
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      href: '/admin/users',
      icon: Users,
    },
    {
      title: 'Event Moderation',
      description: 'Review flagged events and content',
      href: '/admin/events',
      icon: Calendar,
      badge: statistics?.active_issues || 0,
    },
    {
      title: 'Analytics & Reports',
      description: 'View platform performance metrics',
      href: '/admin/analytics',
      icon: TrendingUp,
    },
    {
      title: 'Audit Logs',
      description: 'View admin activity history',
      href: '/admin/audit-logs',
      icon: Activity,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of platform activity and pending tasks
        </p>
      </div>

      {/* Statistics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link href={stat.href} key={index}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-full ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between">
                    <div className="text-2xl font-bold">
                      {stat.value}
                      {stat.urgent && (
                        <Badge variant="destructive" className="ml-2 text-xs">
                          Urgent
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link href={action.href} key={index}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            {action.title}
                          </CardTitle>
                        </div>
                      </div>
                      {action.badge !== undefined && action.badge > 0 && (
                        <Badge variant="default">{action.badge}</Badge>
                      )}
                    </div>
                    <CardDescription className="mt-2">
                      {action.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Platform health and recent activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium">All systems operational</span>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/analytics">
                View Details
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
