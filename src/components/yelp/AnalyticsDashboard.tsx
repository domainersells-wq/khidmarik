'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import { 
  BarChart3, Eye, Phone, Globe, MessageSquare, 
  CalendarCheck, TrendingUp, DollarSign, RefreshCw 
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip as RechartsTooltip, CartesianGrid 
} from 'recharts';

const MOCK_ANALYTICS_DATA = [
  { day: 'Sat', views: 120, clicks: 45, calls: 12, bookings: 5 },
  { day: 'Sun', views: 180, clicks: 65, calls: 18, bookings: 8 },
  { day: 'Mon', views: 150, clicks: 55, calls: 15, bookings: 6 },
  { day: 'Tue', views: 210, clicks: 80, calls: 24, bookings: 12 },
  { day: 'Wed', views: 240, clicks: 95, calls: 28, bookings: 15 },
  { day: 'Thu', views: 320, clicks: 140, calls: 42, bookings: 22 },
  { day: 'Fri', views: 290, clicks: 120, calls: 35, bookings: 18 }
];

export function AnalyticsDashboard() {
  const { language } = useLanguage();
  const [timeframe, setTimeframe] = useState<'week' | 'month'>('week');

  const totalViews = MOCK_ANALYTICS_DATA.reduce((acc, curr) => acc + curr.views, 0);
  const totalClicks = MOCK_ANALYTICS_DATA.reduce((acc, curr) => acc + curr.clicks, 0);
  const totalCalls = MOCK_ANALYTICS_DATA.reduce((acc, curr) => acc + curr.calls, 0);
  const totalBookings = MOCK_ANALYTICS_DATA.reduce((acc, curr) => acc + curr.bookings, 0);

  const isRtl = language === 'ar';

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-headline font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            {isRtl ? 'إحصائيات النشاط التجاري' : 'Business Performance Analytics'}
          </h2>
          <CardDescription>
            {isRtl ? 'تتبع الزيارات، النقرات، المكالمات والحجوزات لصفحة نشاطك.' : 'Track profile views, call-to-actions, and reservation conversions.'}
          </CardDescription>
        </div>

        <div className="flex items-center gap-1.5 self-start">
          <Button
            variant={timeframe === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeframe('week')}
            className="text-xs h-8"
          >
            {isRtl ? 'هذا الأسبوع' : 'This Week'}
          </Button>
          <Button
            variant={timeframe === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeframe('month')}
            className="text-xs h-8"
          >
            {isRtl ? 'هذا الشهر' : 'This Month'}
          </Button>
        </div>
      </header>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Impressions */}
        <Card className="shadow border bg-card">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">{isRtl ? 'مرات الظهور' : 'Impressions'}</span>
            <Eye className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold font-mono text-foreground">
              {timeframe === 'week' ? totalViews : totalViews * 4}
            </div>
            <p className="text-[10px] text-green-500 font-bold mt-1">▲ 14.5% vs last week</p>
          </CardContent>
        </Card>

        {/* Profile Clicks */}
        <Card className="shadow border bg-card">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">{isRtl ? 'زيارات الصفحة' : 'Profile Clicks'}</span>
            <Globe className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold font-mono text-foreground">
              {timeframe === 'week' ? totalClicks : totalClicks * 4}
            </div>
            <p className="text-[10px] text-green-500 font-bold mt-1">▲ 8.2% vs last week</p>
          </CardContent>
        </Card>

        {/* Call clicks */}
        <Card className="shadow border bg-card">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">{isRtl ? 'نقرات الاتصال' : 'Phone Calls'}</span>
            <Phone className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold font-mono text-foreground">
              {timeframe === 'week' ? totalCalls : totalCalls * 4}
            </div>
            <p className="text-[10px] text-green-500 font-bold mt-1">▲ 20.1% vs last week</p>
          </CardContent>
        </Card>

        {/* Bookings */}
        <Card className="shadow border bg-card">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">{isRtl ? 'الحجوزات المؤكدة' : 'Bookings'}</span>
            <CalendarCheck className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold font-mono text-foreground">
              {timeframe === 'week' ? totalBookings : totalBookings * 4}
            </div>
            <p className="text-[10px] text-purple-500 font-bold mt-1">38% conversion rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Recharts Area Timeline */}
      <Card className="shadow border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-primary" />
            {isRtl ? 'خط التفاعل البياني' : 'Engagement Timeline'}
          </CardTitle>
          <CardDescription>
            {isRtl ? 'تحليل مقارن لعدد المشاهدات مقابل الإجراءات والنقرات المباشرة.' : 'Visual breakdown of listing views versus customer clicks.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_ANALYTICS_DATA}>
                <defs>
                  <linearGradient id="colorViews" cx="0" cy="0" r="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="colorClicks" cx="0" cy="0" r="1">
                    <stop offset="5%" stopColor="rgb(16, 185, 129)" stopOpacity="0.4" />
                    <stop offset="95%" stopColor="rgb(16, 185, 129)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="day" />
                <YAxis />
                <RechartsTooltip />
                <Area 
                  type="monotone" 
                  dataKey="views" 
                  stroke="hsl(var(--primary))" 
                  fillOpacity={1} 
                  fill="url(#colorViews)" 
                  name={isRtl ? 'المشاهدات' : 'Views'}
                />
                <Area 
                  type="monotone" 
                  dataKey="clicks" 
                  stroke="rgb(16, 185, 129)" 
                  fillOpacity={1} 
                  fill="url(#colorClicks)" 
                  name={isRtl ? 'النقرات' : 'Clicks'}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AnalyticsDashboard;
