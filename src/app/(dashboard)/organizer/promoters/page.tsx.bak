'use client';

import { useState, useEffect } from 'react';
import { organizersApi } from '@/lib/api/organizers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Ticket,
  DollarSign,
  PlusCircle,
  ArrowRight,
  Loader2,
  Megaphone,
  UserPlus
} from 'lucide-react';
import { toast } from 'sonner';

// --- INTERFACES ---
interface PromoterStat {
  promoter_id: string;
  promoter_name: string;
  tickets_sold: number;
  total_revenue: number;
  promo_codes_count: number;
}

// --- MAIN COMPONENT ---
export default function OrganizerPromotersPage() {
  const [promoters, setPromoters] = useState<PromoterStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPromoterData = async () => {
      try {
        setLoading(true);
        // Assuming the API returns a list of promoters with their stats
        const response = await organizersApi.getTopPromoters(50); // Fetch up to 50 promoters
        setPromoters(response.data.promoters || []);
      } catch (error) {
        console.error("Failed to fetch promoter data:", error);
        toast.error("Could not load your promoter data.");
      } finally {
        setLoading(false);
      }
    };

    fetchPromoterData();
  }, []);

  const totalPromoTickets = promoters.reduce((sum, p) => sum + p.tickets_sold, 0);
  const totalPromoRevenue = promoters.reduce((sum, p) => sum + p.total_revenue, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (promoters.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-comfortaa">Promoters</h1>
          <p className="text-gray-600 mt-1 font-body">Manage and track your event promoters.</p>
        </div>
        <Button size="lg" onClick={() => toast.info('Invite promoter functionality coming soon!')}>
          <UserPlus className="w-5 h-5 mr-2" />
          Invite Promoter
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
            title="Active Promoters" 
            value={promoters.length.toString()} 
            icon={Users}
            iconColor="text-blue-600"
            bgColor="bg-blue-100"
        />
        <StatCard 
            title="Promo Tickets Sold" 
            value={totalPromoTickets.toLocaleString()} 
            icon={Ticket}
            iconColor="text-orange-600"
            bgColor="bg-orange-100"
        />
        <StatCard 
            title="Promo Revenue" 
            value={`KSh ${totalPromoRevenue.toLocaleString()}`} 
            icon={DollarSign}
            iconColor="text-green-600"
            bgColor="bg-green-100"
        />
      </div>

      {/* Promoters Table */}
      <Card>
        <CardHeader>
          <CardTitle className="font-comfortaa">Promoter Leaderboard</CardTitle>
          <CardDescription className="font-body">Ranking of your promoters by tickets sold.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Rank</TableHead>
                  <TableHead>Promoter</TableHead>
                  <TableHead className="text-right">Tickets Sold</TableHead>
                  <TableHead className="text-right">Revenue Generated</TableHead>
                  <TableHead className="text-center">Active Codes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promoters.sort((a, b) => b.tickets_sold - a.tickets_sold).map((promoter, index) => (
                  <TableRow key={promoter.promoter_id}>
                    <TableCell className="font-bold text-gray-500">#{index + 1}</TableCell>
                    <TableCell className="font-semibold">{promoter.promoter_name}</TableCell>
                    <TableCell className="text-right font-mono">{promoter.tickets_sold.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono text-green-700">KSh {promoter.total_revenue.toLocaleString()}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{promoter.promo_codes_count || 0}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// --- SUB-COMPONENTS ---

const StatCard = ({ title, value, icon: Icon, iconColor, bgColor }: { title: string, value: string, icon: React.ElementType, iconColor: string, bgColor: string }) => (
    <Card>
        <CardContent className="pt-6">
            <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center mb-4`}>
                <Icon className={`h-6 w-6 ${iconColor}`} />
            </div>
            <p className="text-gray-600 text-sm mb-1 font-body">{title}</p>
            <p className="text-3xl font-bold text-gray-900 font-comfortaa">{value}</p>
        </CardContent>
    </Card>
);

const EmptyState = () => (
    <div className="text-center py-16">
        <h1 className="text-4xl font-bold font-heading mb-4 text-gray-900">
            Build Your <span className="gradient-text font-playful pr-2">Promoter Network</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-xl mx-auto mb-8 font-body">
          Invite promoters to help sell tickets and track their performance right here.
        </p>
        <Card className="max-w-md mx-auto text-center p-8 bg-gray-50 border-dashed">
            <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2 font-comfortaa">No Promoters Yet</h3>
            <p className="text-gray-600 mb-6 font-body">
                Invite your first promoter to get started.
            </p>
            <Button onClick={() => toast.info('Invite promoter functionality coming soon!')} size="lg">
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Promoter
            </Button>
        </Card>
    </div>
);