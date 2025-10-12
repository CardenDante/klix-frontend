'use client';

import { useState, useEffect } from 'react';
import  apiClient  from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Trophy, Medal, Award, Star, TrendingUp, 
  Ticket, DollarSign, Target, Crown, Zap
} from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  promoter_id: string;
  promoter_name: string;
  total_tickets_sold: number;
  total_revenue_generated: number;
  total_commission_earned: number;
  active_codes_count: number;
  is_current_user: boolean;
}

interface Leaderboard {
  period: string;
  total_promoters: number;
  leaderboard: LeaderboardEntry[];
  current_user_rank: number | null;
}

export default function PromoterLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'all-time' | 'month' | 'week'>('all-time');
  const [limit, setLimit] = useState(50);

  useEffect(() => {
    fetchLeaderboard();
  }, [period, limit]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/analytics/promoter/leaderboard', {
        params: { period, limit }
      });
      setLeaderboard(response.data);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `KSh ${amount.toLocaleString()}`;

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full">
            <Crown className="w-6 h-6 text-yellow-900" />
            <span className="font-bold text-yellow-900">1st</span>
          </div>
        );
      case 2:
        return (
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full">
            <Medal className="w-6 h-6 text-gray-700" />
            <span className="font-bold text-gray-700">2nd</span>
          </div>
        );
      case 3:
        return (
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full">
            <Award className="w-6 h-6 text-orange-900" />
            <span className="font-bold text-orange-900">3rd</span>
          </div>
        );
      default:
        return (
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100 text-gray-700 font-bold text-lg">
            {rank}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#EB7D30] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if (!leaderboard) {
    return <div className="text-center py-12 text-gray-600">Failed to load leaderboard</div>;
  }

  const currentUser = leaderboard.leaderboard.find(e => e.is_current_user);
  const top3 = leaderboard.leaderboard.slice(0, 3);
  const rest = leaderboard.leaderboard.slice(3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-4">
          <Trophy className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Comfortaa' }}>
          Promoter Leaderboard
        </h1>
        <p className="text-gray-600">Compete with other promoters and climb the ranks!</p>
      </div>

      {/* Period Selector */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant={period === 'all-time' ? 'default' : 'outline'}
          onClick={() => setPeriod('all-time')}
        >
          All Time
        </Button>
        <Button
          variant={period === 'month' ? 'default' : 'outline'}
          onClick={() => setPeriod('month')}
        >
          This Month
        </Button>
        <Button
          variant={period === 'week' ? 'default' : 'outline'}
          onClick={() => setPeriod('week')}
        >
          This Week
        </Button>
      </div>

      {/* Current User Rank */}
      {currentUser && (
        <Card className="border-[#EB7D30] bg-gradient-to-r from-orange-50 to-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#EB7D30] rounded-full">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Your Current Rank</p>
                  <p className="text-3xl font-bold text-gray-900">#{currentUser.rank}</p>
                  <p className="text-sm text-gray-600">out of {leaderboard.total_promoters} promoters</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Your Stats</p>
                <p className="text-xl font-bold">{currentUser.total_tickets_sold} tickets</p>
                <p className="text-lg font-semibold text-[#EB7D30]">
                  {formatCurrency(currentUser.total_commission_earned)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top 3 Podium */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">🏆 Top Performers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 2nd Place */}
            {top3[1] && (
              <div className="order-1 md:order-1">
                <Card className="border-2 border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100">
                  <CardContent className="pt-6 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full mb-3">
                      <Medal className="w-8 h-8 text-gray-700" />
                    </div>
                    <h3 className="font-bold text-xl mb-1">{top3[1].promoter_name}</h3>
                    <Badge className="bg-gray-400 mb-3">2nd Place</Badge>
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        <Ticket className="w-4 h-4 text-gray-600" />
                        <span className="font-semibold">{top3[1].total_tickets_sold} tickets</span>
                      </div>
                      <div className="text-lg font-bold text-gray-700">
                        {formatCurrency(top3[1].total_commission_earned)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 1st Place */}
            {top3[0] && (
              <div className="order-2 md:order-2 transform md:scale-110">
                <Card className="border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100">
                  <CardContent className="pt-6 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full mb-3">
                      <Crown className="w-10 h-10 text-yellow-900" />
                    </div>
                    <h3 className="font-bold text-2xl mb-1">{top3[0].promoter_name}</h3>
                    <Badge className="bg-yellow-500 mb-3">👑 Champion</Badge>
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        <Ticket className="w-5 h-5 text-yellow-700" />
                        <span className="font-bold text-lg">{top3[0].total_tickets_sold} tickets</span>
                      </div>
                      <div className="text-2xl font-bold text-yellow-700">
                        {formatCurrency(top3[0].total_commission_earned)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 3rd Place */}
            {top3[2] && (
              <div className="order-3 md:order-3">
                <Card className="border-2 border-orange-400 bg-gradient-to-br from-orange-50 to-orange-100">
                  <CardContent className="pt-6 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full mb-3">
                      <Award className="w-8 h-8 text-orange-900" />
                    </div>
                    <h3 className="font-bold text-xl mb-1">{top3[2].promoter_name}</h3>
                    <Badge className="bg-orange-500 mb-3">3rd Place</Badge>
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        <Ticket className="w-4 h-4 text-orange-600" />
                        <span className="font-semibold">{top3[2].total_tickets_sold} tickets</span>
                      </div>
                      <div className="text-lg font-bold text-orange-700">
                        {formatCurrency(top3[2].total_commission_earned)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Full Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Full Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {rest.map((entry) => (
              <div
                key={entry.promoter_id}
                className={`flex items-center justify-between p-4 border rounded-lg transition ${
                  entry.is_current_user 
                    ? 'border-[#EB7D30] bg-orange-50' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-4 flex-1">
                  {getRankBadge(entry.rank)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-lg">{entry.promoter_name}</h4>
                      {entry.is_current_user && (
                        <Badge className="bg-[#EB7D30]">You</Badge>
                      )}
                      {entry.rank <= 10 && (
                        <Zap className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{entry.active_codes_count} active codes</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                      <Ticket className="w-4 h-4" />
                    </div>
                    <p className="text-lg font-bold">{entry.total_tickets_sold}</p>
                    <p className="text-xs text-gray-500">Tickets</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <p className="text-lg font-bold">{formatCurrency(entry.total_revenue_generated)}</p>
                    <p className="text-xs text-gray-500">Revenue</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <p className="text-lg font-bold text-[#EB7D30]">
                      {formatCurrency(entry.total_commission_earned)}
                    </p>
                    <p className="text-xs text-gray-500">Commission</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {rest.length === 0 && top3.length > 0 && (
            <p className="text-center text-gray-500 py-8">
              Only {top3.length} promoter{top3.length > 1 ? 's' : ''} on the leaderboard
            </p>
          )}

          {leaderboard.leaderboard.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              No promoters on the leaderboard yet. Start selling to be the first!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Motivational Card */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-200 rounded-full">
              <Target className="w-8 h-8 text-purple-700" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-lg mb-1">Keep Climbing! 🚀</h4>
              <p className="text-sm text-gray-700">
                {currentUser && currentUser.rank > 3 
                  ? `You're in position #${currentUser.rank}. Keep promoting to reach the top 3!`
                  : currentUser && currentUser.rank === 1
                  ? "You're #1! Keep up the amazing work to maintain your position!"
                  : currentUser
                  ? `Amazing! You're in the top 3. Push harder to reach #1!`
                  : "Start promoting events and see your name on the leaderboard!"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}