'use client';

import { useState, useEffect } from 'react';
import  apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  TrendingUp, DollarSign, Ticket, Users, Award, 
  Search, Filter, Target, BarChart 
} from 'lucide-react';

interface PromoterPerformance {
  promoter_code: string;
  promoter_name: string | null;
  code_type: string;
  discount_percentage: number | null;
  commission_percentage: number | null;
  times_used: number;
  tickets_sold: number;
  revenue_generated: number;
  total_discount_given: number;
  total_commission_earned: number;
  conversion_rate: number | null;
}

interface TopPromotersResponse {
  total_promoters: number;
  total_commission_owed: number;
  total_discounts_given: number;
  promoters: PromoterPerformance[];
}

export default function PromoterManagementPage() {
  const [data, setData] = useState<TopPromotersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'tickets' | 'revenue' | 'commission'>('tickets');

  useEffect(() => {
    fetchPromoters();
  }, []);

  const fetchPromoters = async () => {
    try {
      const response = await apiClient.get('/analytics/organizer/promoters', {
        params: { limit: 50 }
      });
      setData(response.data);
    } catch (err) {
      console.error('Failed to load promoters:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `KSh ${amount.toLocaleString()}`;
  };

  const filteredPromoters = data?.promoters.filter(p => 
    p.promoter_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.promoter_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    switch (sortBy) {
      case 'tickets':
        return b.tickets_sold - a.tickets_sold;
      case 'revenue':
        return b.revenue_generated - a.revenue_generated;
      case 'commission':
        return b.total_commission_earned - a.total_commission_earned;
      default:
        return 0;
    }
  }) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#EB7D30] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading promoter data...</p>
        </div>
      </div>
    );
  }

  if (!data || data.promoters.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Promoter Activity Yet</h3>
        <p className="text-gray-600">Promoters will appear here once they start selling tickets</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Comfortaa' }}>
          Promoter Management
        </h1>
        <p className="text-gray-600 mt-1">Track and manage promoter performance</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Promoters</p>
                <p className="text-3xl font-bold text-gray-900">{data.total_promoters}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Commissions Owed</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(data.total_commission_owed)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Discounts Given</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(data.total_discounts_given)}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Target className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by code or promoter name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <select
                className="px-4 py-2 border rounded-lg"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="tickets">Sort by Tickets Sold</option>
                <option value="revenue">Sort by Revenue</option>
                <option value="commission">Sort by Commission</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Promoters Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Promoter Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredPromoters.map((promoter, index) => (
              <div
                key={promoter.promoter_code}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-[#EB7D30] to-orange-600 text-white font-bold">
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">
                        {promoter.promoter_name || 'Anonymous Promoter'}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {promoter.promoter_code}
                      </Badge>
                      <Badge className={promoter.code_type === 'commission' ? 'bg-green-500' : 'bg-blue-500'}>
                        {promoter.code_type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {promoter.discount_percentage && (
                        <span>{promoter.discount_percentage}% discount</span>
                      )}
                      {promoter.commission_percentage && (
                        <span>{promoter.commission_percentage}% commission</span>
                      )}
                      <span>Used {promoter.times_used} times</span>
                      {promoter.conversion_rate && (
                        <span className="text-[#EB7D30] font-medium">
                          {promoter.conversion_rate.toFixed(1)}% conversion
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                      <Ticket className="w-4 h-4" />
                    </div>
                    <p className="text-xl font-bold">{promoter.tickets_sold}</p>
                    <p className="text-xs text-gray-500">Tickets</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                      <BarChart className="w-4 h-4" />
                    </div>
                    <p className="text-xl font-bold">{formatCurrency(promoter.revenue_generated)}</p>
                    <p className="text-xs text-gray-500">Revenue</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <p className="text-xl font-bold text-[#EB7D30]">
                      {formatCurrency(promoter.total_commission_earned)}
                    </p>
                    <p className="text-xs text-gray-500">Commission</p>
                  </div>
                </div>
              </div>
            ))}

            {filteredPromoters.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No promoters found matching "{searchTerm}"
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold text-orange-900 mb-2">Top Performer</p>
              {filteredPromoters[0] && (
                <p className="text-orange-800">
                  <strong>{filteredPromoters[0].promoter_name || filteredPromoters[0].promoter_code}</strong> has sold{' '}
                  <strong>{filteredPromoters[0].tickets_sold} tickets</strong> generating{' '}
                  <strong>{formatCurrency(filteredPromoters[0].revenue_generated)}</strong>
                </p>
              )}
            </div>
            <div>
              <p className="font-semibold text-orange-900 mb-2">Average Commission</p>
              <p className="text-orange-800">
                Each promoter earns an average of{' '}
                <strong>
                  {formatCurrency(data.total_commission_owed / Math.max(data.total_promoters, 1))}
                </strong>{' '}
                in commissions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}