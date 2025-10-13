'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Gift, TrendingUp, Clock, Award, Star, CheckCircle, 
  ArrowRight, Zap, Crown, Sparkles, Calendar, Ticket,
  DollarSign, RefreshCw, Info, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface LoyaltyBalance {
  total_credits: number;
  available_credits: number;
  pending_credits: number;
  expired_credits: number;
  lifetime_earned: number;
}

interface LoyaltyTransaction {
  id: string;
  type: 'earned' | 'redeemed' | 'expired';
  amount: number;
  description: string;
  reference_type?: string;
  reference_id?: string;
  created_at: string;
  expires_at?: string;
}

interface ExpiringCredit {
  amount: number;
  expires_at: string;
  days_until_expiry: number;
}

interface LoyaltySummary {
  current_tier: string;
  next_tier: string;
  credits_to_next_tier: number;
  total_events_attended: number;
  total_tickets_purchased: number;
  member_since: string;
}

export default function LoyaltyPage() {
  const [balance, setBalance] = useState<LoyaltyBalance | null>(null);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [expiringCredits, setExpiringCredits] = useState<ExpiringCredit[]>([]);
  const [summary, setSummary] = useState<LoyaltySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLoyaltyData();
  }, []);

  const loadLoyaltyData = async () => {
    try {
      setLoading(true);
      const [balanceRes, transactionsRes, expiringRes, summaryRes] = await Promise.all([
        apiClient.get<LoyaltyBalance>('/api/v1/loyalty/balance'),
        apiClient.get<LoyaltyTransaction[]>('/api/v1/loyalty/transactions'),
        apiClient.get<ExpiringCredit[]>('/api/v1/loyalty/credits/expiring'),
        apiClient.get<LoyaltySummary>('/api/v1/loyalty/summary')
      ]);

      setBalance(balanceRes.data);
      setTransactions(transactionsRes.data);
      setExpiringCredits(expiringRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error('Failed to load loyalty data:', error);
      toast.error('Failed to load loyalty data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadLoyaltyData();
    setRefreshing(false);
    toast.success('Loyalty data refreshed');
  };

  const getTierIcon = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'bronze':
        return <Award className="w-8 h-8 text-orange-600" />;
      case 'silver':
        return <Star className="w-8 h-8 text-gray-400" />;
      case 'gold':
        return <Crown className="w-8 h-8 text-yellow-500" />;
      case 'platinum':
        return <Sparkles className="w-8 h-8 text-purple-600" />;
      default:
        return <Gift className="w-8 h-8 text-primary" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'bronze':
        return 'from-orange-500 to-orange-600';
      case 'silver':
        return 'from-gray-400 to-gray-500';
      case 'gold':
        return 'from-yellow-400 to-yellow-500';
      case 'platinum':
        return 'from-purple-500 to-purple-600';
      default:
        return 'from-primary to-primary/80';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600 font-body">Loading loyalty rewards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-comfortaa">Loyalty Rewards</h1>
          <p className="text-gray-600 mt-1 font-body">Earn credits on every purchase and redeem for discounts</p>
        </div>
        <Button variant="outline" onClick={refreshData} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Balance Card */}
      <Card className={`bg-gradient-to-r ${getTierColor(summary?.current_tier || 'bronze')} text-white overflow-hidden relative`}>
        <div className="absolute top-0 right-0 opacity-10">
          {getTierIcon(summary?.current_tier || 'bronze')}
        </div>
        <CardContent className="pt-6 pb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-white/80 text-sm mb-1 font-body">Available Balance</p>
              <div className="flex items-baseline gap-2">
                <h2 className="text-5xl font-bold font-comfortaa">
                  {balance?.available_credits.toLocaleString() || 0}
                </h2>
                <span className="text-2xl font-body">credits</span>
              </div>
              <p className="text-white/80 text-sm mt-2 font-body">
                = KSh {((balance?.available_credits || 0) * 10).toLocaleString()} value
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end mb-2">
                {getTierIcon(summary?.current_tier || 'bronze')}
                <Badge className="bg-white/20 text-white border-white/30 text-lg px-3 py-1">
                  {summary?.current_tier || 'Bronze'} Tier
                </Badge>
              </div>
              <p className="text-white/80 text-sm font-body">Member since {summary?.member_since ? new Date(summary.member_since).getFullYear() : 'N/A'}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
            <div>
              <p className="text-white/70 text-xs mb-1 font-body">Lifetime Earned</p>
              <p className="text-xl font-bold font-comfortaa">{balance?.lifetime_earned.toLocaleString() || 0}</p>
            </div>
            <div>
              <p className="text-white/70 text-xs mb-1 font-body">Pending</p>
              <p className="text-xl font-bold font-comfortaa">{balance?.pending_credits.toLocaleString() || 0}</p>
            </div>
            <div>
              <p className="text-white/70 text-xs mb-1 font-body">Total Tickets</p>
              <p className="text-xl font-bold font-comfortaa">{summary?.total_tickets_purchased || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expiring Credits Alert */}
      {expiringCredits.length > 0 && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-yellow-200 rounded-full">
                <Clock className="w-6 h-6 text-yellow-700" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2 font-comfortaa">Credits Expiring Soon!</h3>
                <div className="space-y-2">
                  {expiringCredits.map((credit, index) => (
                    <p key={index} className="text-sm text-gray-700 font-body">
                      <strong>{credit.amount}</strong> credits expire in <strong>{credit.days_until_expiry}</strong> days
                      ({new Date(credit.expires_at).toLocaleDateString()})
                    </p>
                  ))}
                </div>
                <Button size="sm" className="mt-3" onClick={() => window.location.href = '/events'}>
                  Use Credits Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* How to Earn */}
        <Card>
          <CardHeader>
            <CardTitle className="font-comfortaa flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              How to Earn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-full mt-1">
                  <Ticket className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm font-comfortaa">Buy Tickets</h4>
                  <p className="text-xs text-gray-600 font-body">Earn 1 credit per KSh 100 spent</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-full mt-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm font-comfortaa">Attend Events</h4>
                  <p className="text-xs text-gray-600 font-body">Bonus credits for checking in</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-full mt-1">
                  <Star className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm font-comfortaa">Tier Bonuses</h4>
                  <p className="text-xs text-gray-600 font-body">Higher tiers earn more per purchase</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-100 rounded-full mt-1">
                  <Gift className="w-4 h-4 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm font-comfortaa">Special Promotions</h4>
                  <p className="text-xs text-gray-600 font-body">Watch for bonus credit events</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How to Redeem */}
        <Card>
          <CardHeader>
            <CardTitle className="font-comfortaa flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              How to Redeem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-semibold mb-2 font-comfortaa">Ticket Discounts</h4>
                <p className="text-sm text-gray-700 mb-3 font-body">
                  Apply credits at checkout to get instant discounts
                </p>
                <div className="text-xs text-gray-600 font-body">
                  <strong>1 credit</strong> = <strong>KSh 10</strong> off
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-sm mb-1 font-comfortaa">Requirements</h4>
                <ul className="text-xs text-gray-600 space-y-1 font-body">
                  <li>• Minimum 10 credits to redeem</li>
                  <li>• Maximum 50% of ticket price</li>
                  <li>• Cannot combine with some promo codes</li>
                  <li>• Credits valid for 12 months</li>
                </ul>
              </div>

              <Button className="w-full" onClick={() => window.location.href = '/events'}>
                Browse Events
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tier Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="font-comfortaa flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Tier Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold font-comfortaa">Current: {summary?.current_tier || 'Bronze'}</span>
                  <span className="text-sm font-semibold font-comfortaa">Next: {summary?.next_tier || 'Silver'}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`bg-gradient-to-r ${getTierColor(summary?.current_tier || 'bronze')} h-3 rounded-full transition-all`}
                    style={{ width: `${Math.min((balance?.lifetime_earned || 0) / 1000 * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-2 font-body">
                  {summary?.credits_to_next_tier || 0} more credits to {summary?.next_tier || 'Silver'}
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t">
                {[
                  { tier: 'Bronze', min: 0, max: 999, color: 'text-orange-600', benefit: '1x credits' },
                  { tier: 'Silver', min: 1000, max: 4999, color: 'text-gray-500', benefit: '1.25x credits' },
                  { tier: 'Gold', min: 5000, max: 9999, color: 'text-yellow-600', benefit: '1.5x credits' },
                  { tier: 'Platinum', min: 10000, max: 999999, color: 'text-purple-600', benefit: '2x credits' }
                ].map((tier) => (
                  <div key={tier.tier} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        summary?.current_tier?.toLowerCase() === tier.tier.toLowerCase() 
                          ? 'bg-current ' + tier.color
                          : 'bg-gray-300'
                      }`} />
                      <span className={`text-sm font-semibold font-comfortaa ${
                        summary?.current_tier?.toLowerCase() === tier.tier.toLowerCase() 
                          ? tier.color
                          : 'text-gray-600'
                      }`}>
                        {tier.tier}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-500 font-body">{tier.benefit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="font-comfortaa">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="earned">Earned</TabsTrigger>
              <TabsTrigger value="redeemed">Redeemed</TabsTrigger>
              <TabsTrigger value="expired">Expired</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <TransactionList transactions={transactions} />
            </TabsContent>

            <TabsContent value="earned" className="mt-4">
              <TransactionList transactions={transactions.filter(t => t.type === 'earned')} />
            </TabsContent>

            <TabsContent value="redeemed" className="mt-4">
              <TransactionList transactions={transactions.filter(t => t.type === 'redeemed')} />
            </TabsContent>

            <TabsContent value="expired" className="mt-4">
              <TransactionList transactions={transactions.filter(t => t.type === 'expired')} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function TransactionList({ transactions }: { transactions: LoyaltyTransaction[] }) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <Info className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600 font-body">No transactions found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => (
        <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              transaction.type === 'earned' ? 'bg-green-100' :
              transaction.type === 'redeemed' ? 'bg-blue-100' :
              'bg-red-100'
            }`}>
              {transaction.type === 'earned' && <TrendingUp className="w-5 h-5 text-green-600" />}
              {transaction.type === 'redeemed' && <DollarSign className="w-5 h-5 text-blue-600" />}
              {transaction.type === 'expired' && <Clock className="w-5 h-5 text-red-600" />}
            </div>
            <div>
              <p className="font-semibold font-comfortaa">{transaction.description}</p>
              <p className="text-sm text-gray-600 font-body">
                {new Date(transaction.created_at).toLocaleDateString()} at {new Date(transaction.created_at).toLocaleTimeString()}
              </p>
              {transaction.expires_at && (
                <p className="text-xs text-gray-500 font-body">
                  Expires: {new Date(transaction.expires_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className={`text-lg font-bold font-comfortaa ${
              transaction.type === 'earned' ? 'text-green-600' :
              transaction.type === 'redeemed' ? 'text-blue-600' :
              'text-red-600'
            }`}>
              {transaction.type === 'earned' ? '+' : '-'}{transaction.amount}
            </p>
            <p className="text-xs text-gray-500 font-body">credits</p>
          </div>
        </div>
      ))}
    </div>
  );
}