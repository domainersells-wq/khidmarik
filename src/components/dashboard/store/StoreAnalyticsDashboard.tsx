'use client';

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  Eye, 
  Sparkles, 
  Megaphone, 
  Download, 
  Star, 
  Check, 
  Clock, 
  Layers,
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
import { ConversionFunnelChart } from '@/components/analytics/ConversionFunnelChart';
import type { StoreOwnerAnalytics, DateRangeFilter } from '@/types/analytics';

interface StoreAnalyticsDashboardProps {
  storeId?: string;
}

export function StoreAnalyticsDashboard({ storeId = 'str_1' }: StoreAnalyticsDashboardProps) {
  const [filter, setFilter] = useState<DateRangeFilter>({ range: '30d' });
  const [data, setData] = useState<StoreOwnerAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      let url = `/api/analytics/store/${storeId}?range=${filter.range}`;
      if (filter.range === 'custom' && filter.startDate && filter.endDate) {
        url += `&startDate=${filter.startDate}&endDate=${filter.endDate}`;
      }
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (e) {
      console.error('Failed to fetch store analytics:', e);
      toast({ title: 'خطأ', description: 'تعذر جلب تحليلات المتجر', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [storeId, filter]);

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
        <span className="text-xs text-muted-foreground font-bold">جاري تحميل إحصائيات وأداء المتجر...</span>
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
            لوحة تحليلات وأداء المتجر (Store Analytics & Sales)
          </h1>
          <p className="text-xs text-muted-foreground">
            متابعة دقيقة لحجم المبيعات، كفاءة التحويل، تنبيهات نفاد المخزون، وعائد الحملات الإعلانية.
          </p>
        </div>

        <AnalyticsDateRangePicker value={filter} onChange={setFilter} />
      </div>

      {/* 1. Store KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricKpiCard
          title="إجمالي المبيعات (Gross Sales)"
          metric={data.kpis.grossSales}
          icon={<DollarSign className="h-5 w-5" />}
          subtitle={`صافي الأرباح: ${data.kpis.netRevenue.formattedValue}`}
          tooltipText="مجموع قيمة كافة الطلبات المستلمة خلال الفترة المحددة"
        />
        <MetricKpiCard
          title="عدد الطلبات المكتملة"
          metric={data.kpis.totalOrders}
          icon={<ShoppingCart className="h-5 w-5" />}
          subtitle={`متوسط السلة (AOV): ${data.kpis.averageOrderValue.formattedValue}`}
        />
        <MetricKpiCard
          title="زيارات المتجر (Store Visits)"
          metric={data.kpis.storeVisits}
          icon={<Eye className="h-5 w-5" />}
          subtitle={`زوار فريدين: ${data.kpis.uniqueVisitors.formattedValue}`}
        />
        <MetricKpiCard
          title="معدل التحويل (Store Conversion)"
          metric={data.kpis.conversionRate}
          icon={<Sparkles className="h-5 w-5" />}
          subtitle="نسبة الزوار الذين تحولوا لزبائن فعليين"
        />
      </div>

      {/* 2. Low Stock Alerts & Fast Selling Estimation */}
      {data.lowStockAlerts.length > 0 && (
        <Card className="rounded-3xl border-2 border-amber-500/40 bg-amber-500/5 shadow-sm text-right overflow-hidden">
          <CardHeader className="bg-amber-500/10 border-b border-amber-500/20 pb-3">
            <div className="flex items-center justify-between">
              <Badge className="bg-amber-500 text-white font-bold text-xs gap-1 px-3 py-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>تنبيهات المخزون الحرج ({data.lowStockAlerts.length} منتجات)</span>
              </Badge>
              <span className="text-xs text-muted-foreground">حساب تقديري لموعد نفاد المخزون</span>
            </div>
            <CardTitle className="text-base font-black pt-1">منتجات أوشكت على النفاد بناءً على معدل المبيعات اليومي</CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-amber-500/5">
                  <TableHead className="text-right font-bold text-xs">المنتج / الرمز (SKU)</TableHead>
                  <TableHead className="text-right font-bold text-xs">المخزون الحالي</TableHead>
                  <TableHead className="text-right font-bold text-xs">حد التنبيه</TableHead>
                  <TableHead className="text-right font-bold text-xs">المبيعات اليومية</TableHead>
                  <TableHead className="text-right font-bold text-xs">المدة التقديرية المتبقية</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.lowStockAlerts.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-bold text-xs">
                      <div>{item.title}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{item.sku || 'SKU-GEN'}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 font-bold font-mono text-xs">
                        {item.currentStock} قطع متبقية
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{item.threshold} قطع</TableCell>
                    <TableCell className="font-mono text-xs font-bold">{item.averageDailySales} قطعة/يوم</TableCell>
                    <TableCell>
                      <Badge className="bg-amber-600 text-white font-bold text-xs gap-1">
                        <Clock className="h-3 w-3" />
                        <span>يكفي لمدة {item.estimatedDaysRemaining} أيام فقط</span>
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* 3. Sales Timeline & Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 rounded-3xl border border-border/80 bg-card shadow-sm text-right overflow-hidden">
          <CardHeader className="bg-muted/20 border-b pb-4">
            <CardTitle className="text-base font-black">حركة المبيعات والطلبات اليومية للمتجر</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">مخطط تطور إجمالي المبيعات وعدد الطلبات المستلمة</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.timeSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorStoreSales" x1="0" y1="0" x2="0" y2="1">
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
                      name === 'revenue' ? 'المبيعات' : 'العمولة'
                    ]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2.5} fillOpacity={1} fill="url(#colorStoreSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Store Funnel */}
        <ConversionFunnelChart 
          title="مسار تحويل الزوار إلى مشترين"
          description="مراحل رحلة العميل داخل متجرك من الزيارة وحتى تأكيد الشراء"
          stages={data.conversionFunnel} 
        />
      </div>

      {/* 4. Best Sellers & Advertising Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Sellers */}
        <Card className="rounded-3xl border border-border/80 bg-card shadow-sm text-right overflow-hidden">
          <CardHeader className="bg-muted/20 border-b pb-3">
            <CardTitle className="text-base font-black">المنتجات الأكثر مبيعاً (Best Sellers)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-right font-bold text-xs">المنتج</TableHead>
                  <TableHead className="text-right font-bold text-xs">السعر</TableHead>
                  <TableHead className="text-right font-bold text-xs">الوحدات المباعة</TableHead>
                  <TableHead className="text-right font-bold text-xs">الإيرادات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.bestSellers.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-bold text-xs">{p.title}</TableCell>
                    <TableCell className="font-mono text-xs">{p.price.toLocaleString('fr-DZ')} DA</TableCell>
                    <TableCell className="font-mono font-bold text-xs text-primary">{p.unitsSold} قطعة</TableCell>
                    <TableCell className="font-mono font-bold text-xs text-emerald-600">{p.revenue.toLocaleString('fr-DZ')} DA</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Store Ads Performance */}
        <Card className="rounded-3xl border border-border/80 bg-card shadow-sm text-right overflow-hidden">
          <CardHeader className="bg-muted/20 border-b pb-3">
            <div className="flex items-center justify-between">
              <Badge className="bg-blue-600 text-white font-bold text-xs gap-1">
                <Megaphone className="h-3.5 w-3.5" />
                <span>إعلانات المتجر الممولة</span>
              </Badge>
              <span className="text-xs font-mono font-bold text-emerald-600">ROAS: {data.advertising.roas}x</span>
            </div>
            <CardTitle className="text-base font-black pt-1">مردودية الإعلانات الممولة للمتجر</CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 rounded-2xl bg-muted/30 border space-y-0.5">
                <div className="text-[10px] text-muted-foreground">الظهور</div>
                <div className="text-sm font-black font-mono">{data.advertising.impressions.toLocaleString('fr-DZ')}</div>
              </div>
              <div className="p-3 rounded-2xl bg-muted/30 border space-y-0.5">
                <div className="text-[10px] text-muted-foreground">النقرات (CTR {data.advertising.ctr}%)</div>
                <div className="text-sm font-black font-mono">{data.advertising.clicks.toLocaleString('fr-DZ')}</div>
              </div>
              <div className="p-3 rounded-2xl bg-muted/30 border space-y-0.5">
                <div className="text-[10px] text-muted-foreground">الطلبات الناتجة</div>
                <div className="text-sm font-black font-mono text-primary">{data.advertising.conversions} طلب</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-muted/30 border flex items-center justify-between text-xs">
              <span className="text-muted-foreground">الإنفاق الإعلاني: <strong className="text-foreground">{data.advertising.spend.toLocaleString('fr-DZ')} DA</strong></span>
              <span className="text-muted-foreground">المبيعات الناتجة: <strong className="text-emerald-600 font-bold">{data.advertising.revenue.toLocaleString('fr-DZ')} DA</strong></span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
