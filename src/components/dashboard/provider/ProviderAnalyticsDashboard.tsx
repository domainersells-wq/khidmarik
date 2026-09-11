'use client';

import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  CheckCircle2, 
  XCircle, 
  DollarSign, 
  Star, 
  Eye, 
  Calendar, 
  TrendingUp, 
  Clock, 
  Sparkles,
  Loader2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { AnalyticsDateRangePicker } from '@/components/analytics/AnalyticsDateRangePicker';
import { MetricKpiCard } from '@/components/analytics/MetricKpiCard';
import type { ProviderAnalytics, DateRangeFilter } from '@/types/analytics';

interface ProviderAnalyticsDashboardProps {
  providerId?: string;
}

export function ProviderAnalyticsDashboard({ providerId = 'prv_1' }: ProviderAnalyticsDashboardProps) {
  const [filter, setFilter] = useState<DateRangeFilter>({ range: '30d' });
  const [data, setData] = useState<ProviderAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      let url = `/api/analytics/provider/${providerId}?range=${filter.range}`;
      if (filter.range === 'custom' && filter.startDate && filter.endDate) {
        url += `&startDate=${filter.startDate}&endDate=${filter.endDate}`;
      }
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (e) {
      console.error('Failed to fetch provider analytics:', e);
      toast({ title: 'خطأ', description: 'تعذر جلب تحليلات مقدم الخدمة', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [providerId, filter]);

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
        <span className="text-xs text-muted-foreground font-bold">جاري تحميل إحصائيات الخدمات والحجوزات...</span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 text-right font-sans animate-fade-in pb-10">
      {/* Top Header & Range Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-5 rounded-3xl border border-border/80 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground">
            لوحة تحليلات أداء مقدم الخدمة (Provider Performance & Jobs)
          </h1>
          <p className="text-xs text-muted-foreground">
            متابعة طلبات الخدمات الميدانية، وتيرة إنجاز المهام، صافي الإيرادات، ومؤشرات رضا الزبائن.
          </p>
        </div>

        <AnalyticsDateRangePicker value={filter} onChange={setFilter} />
      </div>

      {/* 1. Provider KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricKpiCard
          title="صافي الإيرادات والأرباح"
          metric={data.kpis.netRevenue}
          icon={<DollarSign className="h-5 w-5" />}
          subtitle={`متوسط المهمة: ${data.kpis.averageJobValue.formattedValue}`}
          tooltipText="إجمالي أتعاب الحجوزات والمهام المكتملة بعد خصم عمولة المنصة"
        />
        <MetricKpiCard
          title="المهام والأعمال المكتملة"
          metric={data.kpis.completedJobs}
          icon={<CheckCircle2 className="h-5 w-5" />}
          subtitle={`نسبة الإنجاز: ${data.kpis.completionRate.value}%`}
        />
        <MetricKpiCard
          title="طلبات الحجز المستلمة"
          metric={data.kpis.totalRequests}
          icon={<Wrench className="h-5 w-5" />}
          subtitle={`نسبة الإلغاء: ${data.kpis.cancellationRate.value}%`}
          isInverseTrend={false}
        />
        <MetricKpiCard
          title="مشاهدات عروض الخدمات"
          metric={data.kpis.serviceViews}
          icon={<Eye className="h-5 w-5" />}
          subtitle={`زوار فريدين: ${data.kpis.uniqueVisitors.formattedValue}`}
        />
      </div>

      {/* 2. Charts: Bookings & Revenue Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 rounded-3xl border border-border/80 bg-card shadow-sm text-right overflow-hidden">
          <CardHeader className="bg-muted/20 border-b pb-4">
            <CardTitle className="text-base font-black">حركة إنجاز المهام والأرباح اليومية</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">مخطط تطور إيرادات الخدمات وعدد المهام الميدانية المنفذة</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.timeSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorProviderRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="label" fontSize={11} tickLine={false} />
                  <YAxis fontSize={11} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      `${Number(value).toLocaleString('fr-DZ')} DA`,
                      name === 'revenue' ? 'الإيرادات' : 'العمولة'
                    ]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2.5} fillOpacity={1} fill="url(#colorProviderRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Reviews & Quality Card */}
        <Card className="rounded-3xl border border-border/80 bg-card shadow-sm text-right overflow-hidden">
          <CardHeader className="bg-muted/20 border-b pb-4">
            <div className="flex items-center justify-between">
              <Badge className="bg-amber-500 text-white font-bold text-xs gap-1">
                <Star className="h-3.5 w-3.5 fill-current" />
                <span>مؤشر الجودة والرضا</span>
              </Badge>
              <span className="text-xs font-mono font-bold text-foreground">{data.reviews.totalReviews} تقييم</span>
            </div>
            <CardTitle className="text-base font-black pt-1">تقييمات الزبائن وجودة التنفيذ</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-center p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
              <div>
                <div className="text-3xl font-black font-mono text-amber-600 dark:text-amber-400">
                  {data.kpis.averageRating} ★
                </div>
                <div className="text-xs text-muted-foreground pt-1">متوسط تقييم الخدمة العام</div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span>5 نجوم (ممتاز)</span>
                <span className="font-mono font-bold">{data.reviews.starDistribution.star5}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>4 نجوم (جيد جداً)</span>
                <span className="font-mono font-bold">{data.reviews.starDistribution.star4}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>3 نجوم أو أقل</span>
                <span className="font-mono font-bold">{data.reviews.starDistribution.star3 + data.reviews.starDistribution.star2 + data.reviews.starDistribution.star1}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Top Services Table */}
      <Card className="rounded-3xl border border-border/80 bg-card shadow-sm text-right overflow-hidden">
        <CardHeader className="bg-muted/20 border-b pb-3">
          <CardTitle className="text-base font-black">أفضل عروض الخدمات طلباً وإيراداً</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-right font-bold text-xs">عنوان الخدمة</TableHead>
                <TableHead className="text-right font-bold text-xs">السعر الأساسي</TableHead>
                <TableHead className="text-right font-bold text-xs">المهام المنفذة</TableHead>
                <TableHead className="text-right font-bold text-xs">المشاهدات</TableHead>
                <TableHead className="text-right font-bold text-xs">إجمالي الإيرادات</TableHead>
                <TableHead className="text-right font-bold text-xs">التقييم</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.topServices.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-bold text-xs">{s.title}</TableCell>
                  <TableCell className="font-mono text-xs">{s.price.toLocaleString('fr-DZ')} DA</TableCell>
                  <TableCell className="font-mono font-bold text-xs text-primary">{s.completedJobs} مهمة</TableCell>
                  <TableCell className="font-mono text-xs">{s.views.toLocaleString('fr-DZ')}</TableCell>
                  <TableCell className="font-mono font-bold text-xs text-emerald-600">{s.revenue.toLocaleString('fr-DZ')} DA</TableCell>
                  <TableCell className="font-mono font-bold text-xs text-amber-500">★ {s.rating}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
