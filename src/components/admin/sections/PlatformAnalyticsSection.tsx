'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  LineChart, 
  Users, 
  DollarSign, 
  ShoppingCart, 
  MapPin, 
  TrendingUp, 
  TrendingDown, 
  CalendarDays, 
  Download, 
  Filter, 
  ListChecks,
  Percent,
  Timer
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

const mockTopServicesStores = [
  { id: 'item1', name: 'Tech Universe Algérie', type: 'Store', requests: 1500, earnings: '500,000 DA' },
  { id: 'item2', name: 'Rapid Rooter Plumbing', type: 'Service', requests: 1200, earnings: '300,000 DA' },
  { id: 'item3', name: 'Oran Fashion Hub', type: 'Store', requests: 1100, earnings: '250,000 DA' },
];

const mockGeoData = [
  { city: 'Algiers', value: 40, details: '40% of activity', color: 'bg-primary' },
  { city: 'Oran', value: 25, details: '25% of activity', color: 'bg-blue-500' },
  { city: 'Constantine', value: 15, details: '15% of activity', color: 'bg-purple-500' },
  { city: 'Sidi Bel Abbès', value: 10, details: '10% of activity', color: 'bg-teal-500' },
  { city: 'Other', value: 10, details: '10% from other regions', color: 'bg-slate-400' },
];

export function PlatformAnalyticsSection() {
  const { toast } = useToast();
  const [timePeriod, setTimePeriod] = useState('30d');

  const handleExport = () => {
    toast({
      title: "Generating Analytics Report",
      description: "Compiling financial graphs and exporting PDF data...",
    });
  };

  return (
    <div className="space-y-6 font-sans text-left rtl:text-right">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" /> Reports & Analytics Hub
          </h1>
          <p className="text-xs text-muted-foreground">Trace overall platform revenue growth, customer conversion indices, active subscriptions, and geo-demographic allocations.</p>
        </div>

        <div className="flex gap-2">
          <SelectPeriod value={timePeriod} onChange={setTimePeriod} />
          <Button onClick={handleExport} className="rounded-xl h-10 text-xs flex items-center gap-1.5 bg-primary text-primary-foreground">
            <Download className="h-4 w-4" /> Export Report
          </Button>
        </div>
      </header>

      {/* Main KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Revenue', value: '2,500,000 DA', icon: DollarSign, trend: '+12.4%', color: 'text-green-600' },
          { title: 'New Registrations', value: '1,420 Users', icon: Users, trend: '+8.2%', color: 'text-green-600' },
          { title: 'Conversion Rate', value: '3.82%', icon: Percent, trend: '+1.5%', color: 'text-green-600' },
          { title: 'Retention Index', value: '84.6%', icon: Timer, trend: '-0.4%', color: 'text-red-600' },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Card key={idx} className="border rounded-2xl shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground">{kpi.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-lg font-bold text-slate-800 dark:text-slate-100">{kpi.value}</div>
                <p className={`text-[10px] font-bold mt-1 ${kpi.color}`}>{kpi.trend} from last month</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Growth Trend (Dynamic SVG chart) */}
        <Card className="border rounded-2xl shadow-sm bg-card">
          <CardHeader className="p-4 border-b">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-1.5"><LineChart className="h-4.5 w-4.5 text-primary" /> Monthly Revenue & Growth Trend</CardTitle>
            <CardDescription className="text-xs">Visual curve plotting commissions earnings and order values.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex flex-col justify-between min-h-[300px]">
            {/* SVG line chart */}
            <div className="flex-1 w-full relative">
              <svg className="w-full h-44" viewBox="0 0 500 200" preserveAspectRatio="none">
                {/* Grids */}
                <line x1="0" y1="50" x2="500" y2="50" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="100" x2="500" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="150" x2="500" y2="150" stroke="#f1f5f9" strokeWidth="1" />
                
                {/* Chart Path */}
                <path 
                  d="M 0 170 Q 100 130 200 140 T 300 80 T 400 90 T 500 40" 
                  fill="none" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth="3.5" 
                  strokeLinecap="round"
                />
                
                {/* Dots */}
                <circle cx="100" cy="150" r="4.5" fill="hsl(var(--primary))" />
                <circle cx="200" cy="140" r="4.5" fill="hsl(var(--primary))" />
                <circle cx="300" cy="80" r="4.5" fill="hsl(var(--primary))" />
                <circle cx="400" cy="90" r="4.5" fill="hsl(var(--primary))" />
                <circle cx="500" cy="40" r="4.5" fill="hsl(var(--primary))" />
              </svg>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1 uppercase pt-4 border-t">
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
            </div>
          </CardContent>
        </Card>

        {/* Geographic Distribution (Progress Bars) */}
        <Card className="border rounded-2xl shadow-sm bg-card">
          <CardHeader className="p-4 border-b">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-1.5"><MapPin className="h-4.5 w-4.5 text-primary" /> Geographic Activity Distribution</CardTitle>
            <CardDescription className="text-xs">Platform utilization ratio segmented by wilaya and major cities.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {mockGeoData.map((geo, idx) => (
              <div key={idx} className="space-y-1 text-xs">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>{geo.city}</span>
                  <span>{geo.value}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                  <div className={`h-full ${geo.color} transition-all`} style={{ width: `${geo.value}%` }}></div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Top Performers Table */}
      <Card className="border rounded-2xl shadow-sm bg-card overflow-hidden">
        <CardHeader className="p-4 border-b">
          <CardTitle className="text-sm font-bold text-slate-800">Top Performing Stores & Service Providers</CardTitle>
          <CardDescription className="text-xs">Leaderboard generated based on completed order commissions and customer bookings.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="text-xs font-bold">Store / Service Provider Name</TableHead>
                <TableHead className="text-xs font-bold">Type</TableHead>
                <TableHead className="text-xs font-bold text-right font-mono">Completed Transactions</TableHead>
                <TableHead className="text-xs font-bold text-right font-mono">Platform Earnings Commission</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTopServicesStores.map((item) => (
                <TableRow key={item.id} className="hover:bg-slate-50/30 transition-colors">
                  <TableCell className="text-xs font-semibold text-slate-800 dark:text-slate-100">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant={item.type === 'Store' ? 'secondary' : 'outline'} className="text-[10px]">
                      {item.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-right font-mono">{item.requests.toLocaleString()}</TableCell>
                  <TableCell className="text-xs text-right font-bold text-slate-800 dark:text-slate-200 font-mono">{item.earnings}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

interface SelectPeriodProps {
  value: string;
  onChange: (val: string) => void;
}

function SelectPeriod({ value, onChange }: SelectPeriodProps) {
  return (
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className="bg-slate-50 border border-input rounded-xl text-xs px-3 h-10 font-bold text-slate-600 focus:outline-none"
    >
      <option value="7d">Last 7 Days</option>
      <option value="30d">Last 30 Days</option>
      <option value="90d">Last 90 Days</option>
      <option value="1y">Last 1 Year</option>
    </select>
  );
}
