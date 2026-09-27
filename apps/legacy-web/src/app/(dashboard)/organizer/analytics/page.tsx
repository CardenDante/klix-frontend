'use client';

import { useState, useEffect } from 'react';
import { organizersApi } from '@/lib/api/organizers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DollarSign,
  Ticket,
  BarChart3,
  TrendingUp,
  Loader2,
  Calendar as CalendarIcon,
  Crown
} from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { toast } from 'sonner';

// --- INTERFACES (based on OpenAPI spec) ---
interface RevenueByPeriod {
  period: string;
  revenue: number;
  net_revenue: number;
  tickets_sold: number;
}

interface RevenueAnalytics {
  total_revenue: number;
  total_net_revenue: number;
  total_tickets_sold: number;
  average_ticket_price: number;
  revenue_by_period: RevenueByPeriod[];
  revenue_by_event: { event_name: string; revenue: number; tickets_sold: number }[];
  revenue_by_ticket_type: { ticket_type_name: string; revenue: number; tickets_sold: number }[];
  best_performing_event: { event_name: string; revenue: number } | null;
}

// --- MAIN COMPONENT ---
export default function OrganizerAnalyticsPage() {
  const [analytics, setAnalytics] = useState<RevenueAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!date?.from || !date?.to) return;
      try {
        setLoading(true);
        const params = {
          start_date: date.from.toISOString(),
          end_date: date.to.toISOString(),
        };
        const response = await organizersApi.getRevenue(params);
        setAnalytics(response.data);
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
        toast.error("Could not load analytics data.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [date]);
  
  const chartData = analytics?.revenue_by_period.map(item => ({
    ...item,
    name: format(new Date(item.period), 'MMM d'),
  })) || [];

  return (
    <div className="space-y-8">
      {/* Header & Date Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-comfortaa">Revenue Analytics</h1>
          <p className="text-gray-600 mt-1 font-body">An overview of your event sales performance.</p>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className="w-full sm:w-[300px] justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                  </>
                ) : (
                  format(date.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !analytics || analytics.total_tickets_sold === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title="Gross Revenue" 
              value={`KSh ${analytics.total_revenue.toLocaleString()}`} 
              icon={DollarSign}
            />
            <StatCard 
              title="Net Revenue" 
              value={`KSh ${analytics.total_net_revenue.toLocaleString()}`} 
              icon={TrendingUp}
            />
            <StatCard 
              title="Tickets Sold" 
              value={analytics.total_tickets_sold.toLocaleString()} 
              icon={Ticket}
            />
            <StatCard 
              title="Avg. Ticket Price" 
              value={`KSh ${analytics.average_ticket_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
              icon={BarChart3}
            />
          </div>

          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="font-comfortaa">Revenue Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `KSh ${value / 1000}k`}/>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #ddd' }} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#EB7D30" strokeWidth={2} name="Gross Revenue" />
                  <Line type="monotone" dataKey="net_revenue" stroke="#8884d8" strokeWidth={2} name="Net Revenue" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Breakdowns */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="font-comfortaa">Sales by Event</CardTitle>
              </CardHeader>
              <CardContent>
                <BreakdownTable data={analytics.revenue_by_event} nameKey="event_name" />
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="font-comfortaa">Sales by Ticket Type</CardTitle>
              </CardHeader>
              <CardContent>
                <BreakdownTable data={analytics.revenue_by_ticket_type} nameKey="ticket_type_name" />
              </CardContent>
            </Card>
          </div>
          
          {/* Best Performer */}
          {analytics.best_performing_event && (
            <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-primary/20">
              <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white rounded-full border border-primary/20">
                      <Crown className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="font-comfortaa">Top Performing Event</CardTitle>
                      <CardDescription className="font-body">Your best-selling event in this period.</CardDescription>
                    </div>
                  </div>
              </CardHeader>
              <CardContent>
                  <h3 className="text-2xl font-bold text-gray-900 font-comfortaa">{analytics.best_performing_event.event_name}</h3>
                  <p className="text-lg font-semibold text-primary">
                    KSh {analytics.best_performing_event.revenue.toLocaleString()} in revenue
                  </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// --- SUB-COMPONENTS ---

const StatCard = ({ title, value, icon: Icon }: { title: string, value: string, icon: React.ElementType }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-gray-600 font-body">{title}</CardTitle>
      <Icon className="h-4 w-4 text-gray-400" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold font-comfortaa">{value}</div>
    </CardContent>
  </Card>
);

const BreakdownTable = ({ data, nameKey }: { data: any[], nameKey: string }) => {
  if (!data || data.length === 0) {
    return <p className="text-center text-sm text-gray-500 py-4">No data available for this period.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Tickets</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.slice(0, 5).map((item, index) => (
            <TableRow key={index}>
              <TableCell className="font-semibold text-sm truncate">{item[nameKey]}</TableCell>
              <TableCell className="text-right font-mono text-sm">{item.tickets_sold.toLocaleString()}</TableCell>
              <TableCell className="text-right font-mono text-sm text-green-700">KSh {item.revenue.toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const EmptyState = () => (
    <Card className="text-center py-16 bg-gray-50 border-dashed">
        <CardContent>
            <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2 font-comfortaa">No Sales Data Yet</h3>
            <p className="text-gray-600 font-body">
                Once you start selling tickets, your analytics will appear here.
            </p>
        </CardContent>
    </Card>
);