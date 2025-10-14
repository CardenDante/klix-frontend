'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Gift, TrendingUp, Clock, Award, Star, CheckCircle, 
  ArrowRight, Zap, Crown, Sparkles, Ticket,
  DollarSign, RefreshCw, Info, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

// --- INTERFACES ---
interface LoyaltyBalance {
  total_credits: number;
  available_credits: number;
  pending_credits: number;
  lifetime_earned: number;
}

interface LoyaltyTransaction {
  id: string;
  type: 'earned' | 'redeemed' | 'expired';
  amount: number;
  description: string;
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
  next_tier: string | null;
  credits_to_next_tier: number;
  member_since: string;
}

// --- TIER CONFIGURATION ---
const tiers = {
  bronze: { name: 'Bronze', color: 'text-orange-600', gradient: 'from-orange-500 to-yellow-500', icon: Award, threshold: 0, multiplier: '1x' },
  silver: { name: 'Silver', color: 'text-gray-500', gradient: 'from-gray-400 to-gray-600', icon: Star, threshold: 1000, multiplier: '1.25x' },
  gold: { name: 'Gold', color: 'text-yellow-500', gradient: 'from-yellow-400 to-amber-500', icon: Crown, threshold: 5000, multiplier: '1.5x' },
  platinum: { name: 'Platinum', color: 'text-purple-600', gradient: 'from-purple-500 to-indigo-600', icon: Sparkles, threshold: 10000, multiplier: '2x' },
};

// --- MAIN COMPONENT ---
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
      if (!refreshing) setLoading(true);
      const [balanceRes, transactionsRes, expiringRes, summaryRes] = await Promise.all([
        apiClient.get('/api/v1/loyalty/balance'),
        apiClient.get('/api/v1/loyalty/transactions'),
        apiClient.get('/api/v1/loyalty/credits/expiring'),
        apiClient.get('/api/v1/loyalty/summary')
      ]);

      setBalance(balanceRes.data);
      setTransactions(transactionsRes.data);
      setExpiringCredits(expiringRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error('Failed to load loyalty data:', error);
      toast.error('Could not fetch your loyalty rewards data.');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadLoyaltyData();
    setRefreshing(false);
    toast.success('Loyalty data refreshed!');
  };

  const currentTierKey = summary?.current_tier?.toLowerCase() as keyof typeof tiers || 'bronze';
  const currentTier = tiers[currentTierKey];
  const nextTierKey = summary?.next_tier?.toLowerCase() as keyof typeof tiers | null;
  const nextTier = nextTierKey ? tiers[nextTierKey] : null;
  
  const tierProgress = nextTier 
    ? ((balance?.lifetime_earned || 0) - (tiers[currentTierKey]?.threshold || 0)) / ((nextTier.threshold || 1) - (tiers[currentTierKey]?.threshold || 0)) * 100
    : 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-comfortaa">Loyalty Rewards</h1>
          <p className="text-gray-600 mt-1 font-body">Earn credits on every purchase and redeem for discounts.</p>
        </div>
        <Button variant="outline" onClick={refreshData} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Main Cards) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Balance & Tier Card */}
          <Card className={`bg-gradient-to-br ${currentTier.gradient} text-white overflow-hidden`}>
            <CardContent className="pt-8 relative">
              <currentTier.icon className="absolute -top-4 -right-4 w-32 h-32 opacity-10" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div>
                  <p className="text-white/80 text-sm font-body">Available Balance</p>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-5xl font-bold font-comfortaa">
                      {balance?.available_credits.toLocaleString() || 0}
                    </h2>
                    <span className="text-xl font-body">credits</span>
                  </div>
                  <p className="text-white/90 text-sm mt-1 font-body">
                    ≈ KSh {((balance?.available_credits || 0) * 10).toLocaleString()} in value
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-white/20 text-white border-none text-sm px-3 py-1 font-semibold">{currentTier.name} Tier</Badge>
                    {nextTier && <span className="text-sm font-semibold">{nextTier.name}</span>}
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2.5">
                    <div className="bg-white h-2.5 rounded-full" style={{ width: `${Math.min(tierProgress, 100)}%` }} />
                  </div>
                  {summary?.credits_to_next_tier && summary.credits_to_next_tier > 0 ? (
                    <p className="text-xs text-center text-white/90">
                      {summary.credits_to_next_tier.toLocaleString()} credits to the next tier
                    </p>
                  ) : (
                     <p className="text-xs text-center text-white/90">You're at the top tier!</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Expiring Credits Alert */}
          {expiringCredits.length > 0 && (
            <Card className="border-yellow-300 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-yellow-100 rounded-full mt-1">
                    <Clock className="w-5 h-5 text-yellow-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold font-comfortaa">Credits Expiring Soon!</h3>
                    {expiringCredits.slice(0, 2).map((credit, index) => (
                      <p key={index} className="text-sm text-gray-700 font-body">
                        <strong>{credit.amount}</strong> credits expire in <strong>{credit.days_until_expiry}</strong> days.
                      </p>
                    ))}
                     <Button size="sm" className="mt-3" asChild>
                       <a href="/events">
                          Use Credits Now <ArrowRight className="w-4 h-4 ml-2" />
                       </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle className="font-comfortaa">Transaction History</CardTitle>
              <CardDescription className="font-body">A record of your loyalty credits activity.</CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionList transactions={transactions} />
            </CardContent>
          </Card>
        </div>

        {/* Right Column (Info) */}
        <div className="space-y-8">
          {/* How to Earn */}
          <Card>
            <CardHeader>
              <CardTitle className="font-comfortaa flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                How to Earn
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p className="flex items-center gap-3"><Ticket className="w-4 h-4 text-gray-500" /><span>Earn <strong>1 credit</strong> per KSh 100 spent.</span></p>
              <p className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-gray-500" /><span>Get <strong>bonus credits</strong> for attending events.</span></p>
              <p className="flex items-center gap-3"><Star className="w-4 h-4 text-gray-500" /><span>Higher tiers get <strong>credit multipliers</strong>.</span></p>
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
            <CardContent className="space-y-4">
               <div className="p-4 bg-green-50 rounded-lg text-center">
                 <p className="font-semibold font-comfortaa text-green-800">1 Credit = KSh 10</p>
                 <p className="text-xs text-green-700">Apply your credits for discounts at checkout.</p>
               </div>
               <ul className="text-xs text-gray-600 space-y-1 pl-4 list-disc font-body">
                  <li>Minimum 10 credits to redeem.</li>
                  <li>Max 50% of ticket price redeemable.</li>
                  <li>Credits expire after 12 months.</li>
                </ul>
              <Button className="w-full" asChild>
                <a href="/events">
                  Browse Events <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---
function TransactionList({ transactions }: { transactions: LoyaltyTransaction[] }) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-10 bg-gray-50 rounded-lg">
        <Info className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-600 font-body">No transactions yet!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.slice(0, 5).map((tx) => (
        <div key={tx.id} className="flex items-center justify-between p-3 border-b last:border-b-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              tx.type === 'earned' ? 'bg-green-100' :
              tx.type === 'redeemed' ? 'bg-blue-100' : 'bg-red-100'
            }`}>
              {tx.type === 'earned' && <TrendingUp className="w-4 h-4 text-green-600" />}
              {tx.type === 'redeemed' && <DollarSign className="w-4 h-4 text-blue-600" />}
              {tx.type === 'expired' && <Clock className="w-4 h-4 text-red-600" />}
            </div>
            <div>
              <p className="font-semibold text-sm font-comfortaa">{tx.description}</p>
              <p className="text-xs text-gray-500 font-body">
                {new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
          <p className={`font-bold font-mono text-sm ${
            tx.type === 'earned' ? 'text-green-600' : 'text-gray-700'
          }`}>
            {tx.type === 'earned' ? '+' : '-'}{tx.amount}
          </p>
        </div>
      ))}
    </div>
  );
}