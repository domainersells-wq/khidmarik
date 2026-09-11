'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Percent, 
  Calendar, 
  Download, 
  Sparkles, 
  TrendingUp, 
  ArrowUpRight, 
  Layers, 
  Store, 
  Wrench, 
  ShieldAlert, 
  CreditCard, 
  Megaphone,
  Star,
  MapPin,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { AnalyticsDateRangePicker } from '@/components/analytics/AnalyticsDateRangePicker';
import { MetricKpiCard } from '@/components/analytics/MetricKpiCard';
import { ConversionFunnelChart } from '@/components/analytics/ConversionFunnelChart';
import type { PlatformAdminAnalytics, DateRangeFilter } from '@/types/analytics';

export function PlatformAnalyticsSection() {
  const [filter, setFilter] = useState<DateRangeFilter>({ range: '30d' });
  const [data, setData] = useState<PlatformAdminAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'categories' | 'products' | 'services' | 'stores' | 'providers' | 'geo'>('categories');

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      let url = `/api/analytics/platform?range=${filter.range}`;
      if (filter.range === 'custom' && filter.startDate && filter.endDate) {
        url += `&startDate=${filter.startDate}&endDate=${filter.endDate}`;
      }
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (e) {
      console.error('Failed to load platform analytics:', e);
      toast({ title: 'خطأ', description: 'تعذر جلب بيانات التحليلات', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [filter]);

  const handleExportReport = () => {
    window.print();
    toast({
      title: 'تصدير التقرير التحليلي',
      description: 'جاري تجهيز وتصدير التقرير المالي والإحصائي للطباعة والـ PDF.',
    });
  };

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-xs text-muted-foreground font-bold">جاري تحميل المؤشرات والتحليلات البيانية...</span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 text-right font-sans pb-12 animate-fade-in">
      {/* Top Header & Date Range Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-3xl border border-border/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-primary text-primary-foreground">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-foreground">
                مركز التحليلات وذكاء الأعمال (Platform Analytics & BI)
              </h1>
              <p className="text-xs text-muted-foreground">
                متابعة حركة الإيرادات الإجمالية، عمولات المنصة، كفاءة التحويل، وأداء المتاجر والمقدمين.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <AnalyticsDateRangePicker value={filter} onChange={setFilter} />
          <Button
            variant="outline"
            onClick={handleExportReport}
            className="rounded-2xl text-xs font-bold gap-1.5 h-10 border-border shadow-sm hover:border-primary"
          >
            <Download className="h-4 w-4" />
            <span>تصدير PDF / طباعة</span>
          </Button>
        </div>
      </div>

      {/* 1. Primary Financial & Activity KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricKpiCard
          title="حجم التداول الإجمالي (Gross GMV)"
          metric={data.kpis.grossRevenue}
          icon={<DollarSign className="h-5 w-5" />}
          subtitle="إجمالي قيمة مشتريات المنتجات وحجوزات الخدمات"
          tooltipText="مجموع المبالغ المالية المعالجة عبر المنصة خلال الفترة المحددة"
        />
        <MetricKpiCard
          title="عمولة منصة خدماتك (Net Commission)"
          metric={data.kpis.platformCommission}
          icon={<Percent className="h-5 w-5" />}
          subtitle="أرباح المنصة الصافية من العمولات والاشتراكات"
          tooltipText="إجمالي العمولات المقتطعة من المبيعات والحجوزات المكتملة"
        />
        <MetricKpiCard
          title="إجمالي الطلبات والحجوزات"
          metric={data.kpis.totalOrders}
          icon={<ShoppingCart className="h-5 w-5" />}
          subtitle={`طلبات: ${data.kpis.totalOrders.value} | حجوزات: ${data.kpis.totalBookings.value}`}
        />
        <MetricKpiCard
          title="معدل التحويل العام (Conversion Rate)"
          metric={data.kpis.conversionRate}
          icon={<Sparkles className="h-5 w-5" />}
          subtitle="نسبة الزوار الذين أتموا عملية شراء أو حجز"
          tooltipText="الطلبات المكتملة مقسومة على إجمالي الزيارات الفريدة"
        />
      </div>

      {/* 2. Secondary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-card border text-right space-y-1">
          <div className="text-[11px] text-muted-foreground font-bold">المستخدمين النشطين</div>
          <div className="text-lg font-black font-mono text-foreground">{data.kpis.activeUsers.formattedValue}</div>
          <div className="text-[10px] text-emerald-600 font-bold" dir="ltr">+{data.kpis.activeUsers.percentageChange}%</div>
        </div>
        <div className="p-4 rounded-2xl bg-card border text-right space-y-1">
          <div className="text-[11px] text-muted-foreground font-bold">المستخدمين الجدد</div>
          <div className="text-lg font-black font-mono text-foreground">{data.kpis.newUsers.formattedValue}</div>
          <div className="text-[10px] text-emerald-600 font-bold" dir="ltr">+{data.kpis.newUsers.percentageChange}%</div>
        </div>
        <div className="p-4 rounded-2xl bg-card border text-right space-y-1">
          <div className="text-[11px] text-muted-foreground font-bold">المتاجر النشطة</div>
          <div className="text-lg font-black font-mono text-foreground">{data.kpis.activeStores.formattedValue}</div>
          <div className="text-[10px] text-muted-foreground">من أصل {data.kpis.totalStores.value} متجر</div>
        </div>
        <div className="p-4 rounded-2xl bg-card border text-right space-y-1">
          <div className="text-[11px] text-muted-foreground font-bold">مقدمي الخدمات النشطين</div>
          <div className="text-lg font-black font-mono text-foreground">{data.kpis.activeProviders.formattedValue}</div>
          <div className="text-[10px] text-muted-foreground">من أصل {data.kpis.totalProviders.value} مقدم</div>
        </div>
        <div className="p-4 rounded-2xl bg-card border text-right space-y-1">
          <div className="text-[11px] text-muted-foreground font-bold">المرتجعات والمستردات</div>
          <div className="text-lg font-black font-mono text-foreground">{data.kpis.refundsTotal.formattedValue}</div>
          <div className="text-[10px] text-amber-600 font-bold">معدل {data.kpis.refundsTotal.percentageChange}%</div>
        </div>
        <div className="p-4 rounded-2xl bg-card border text-right space-y-1">
          <div className="text-[11px] text-muted-foreground font-bold">السحوبات المكتملة</div>
          <div className="text-lg font-black font-mono text-foreground">{data.kpis.withdrawalsTotal.formattedValue}</div>
          <div className="text-[10px] text-muted-foreground">تحويلات التجار والمقدمين</div>
        </div>
      </div>

      {/* 3. Main Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue & Commission AreaChart */}
        <Card className="lg:col-span-2 rounded-3xl border border-border/80 bg-card shadow-sm overflow-hidden text-right">
          <CardHeader className="bg-muted/20 border-b pb-4">
            <div className="flex items-center justify-between">
              <Badge className="bg-primary text-primary-foreground font-bold text-xs">نمو الإيرادات</Badge>
              <span className="text-xs text-muted-foreground">توزيع الإيرادات والعمولات حسب الفترة</span>
            </div>
            <CardTitle className="text-base font-black">حركة المبيعات وعمولات المنصة اليومية</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.timeSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorComm" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="label" fontSize={11} tickLine={false} />
                  <YAxis fontSize={11} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      `${Number(value).toLocaleString('fr-DZ')} DA`,
                      name === 'revenue' ? 'حجم المبيعات' : 'عمولة المنصة'
                    ]}
                  />
                  <Legend 
                    formatter={(val) => val === 'revenue' ? 'إجمالي المبيعات (DA)' : 'عمولة المنصة (DA)'}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                  <Area type="monotone" dataKey="commission" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorComm)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <ConversionFunnelChart stages={data.conversionFunnel} />
      </div>

      {/* 4. Secondary Chart: Orders & Bookings + Advertising Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders vs Bookings BarChart */}
        <Card className="rounded-3xl border border-border/80 bg-card shadow-sm text-right overflow-hidden">
          <CardHeader className="bg-muted/20 border-b pb-4">
            <CardTitle className="text-base font-black">حجم الطلبات الإلكترونية والحجوزات الميدانية</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">مقارنة وتيرة نمو قطاع التجارة الإلكترونية مقابل قطاع الخدمات المهنية</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.timeSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="label" fontSize={11} tickLine={false} />
                  <YAxis fontSize={11} tickLine={false} />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      `${value} عملية`,
                      name === 'orders' ? 'طلبات المتجر' : 'حجوزات الخدمات'
                    ]}
                  />
                  <Legend formatter={val => val === 'orders' ? 'طلبات المنتجات' : 'حجوزات الخدمات'} />
                  <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="bookings" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Advertising Performance Card */}
        <Card className="rounded-3xl border border-border/80 bg-card shadow-sm text-right overflow-hidden">
          <CardHeader className="bg-muted/20 border-b pb-4">
            <div className="flex items-center justify-between">
              <Badge className="bg-blue-600 text-white font-bold text-xs gap-1">
                <Megaphone className="h-3.5 w-3.5" />
                <span>إعلانات المنصة الممولة</span>
              </Badge>
              <span className="text-xs font-mono font-bold text-primary">عائد الإعلانات: {data.advertising.roas}x ROAS</span>
            </div>
            <CardTitle className="text-base font-black pt-1">تحليلات الحملات الإعلانية المدفوعة</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-muted/30 border space-y-0.5">
                <div className="text-[10px] text-muted-foreground">مشاهدات الإعلانات</div>
                <div className="text-base font-black font-mono">{data.advertising.impressions.toLocaleString('fr-DZ')}</div>
              </div>
              <div className="p-3 rounded-2xl bg-muted/30 border space-y-0.5">
                <div className="text-[10px] text-muted-foreground">النقرات (Clicks)</div>
                <div className="text-base font-black font-mono">{data.advertising.clicks.toLocaleString('fr-DZ')}</div>
                <div className="text-[10px] text-emerald-600 font-bold">CTR: {data.advertising.ctr}%</div>
              </div>
              <div className="p-3 rounded-2xl bg-muted/30 border space-y-0.5">
                <div className="text-[10px] text-muted-foreground">مبيعات ناتجة</div>
                <div className="text-base font-black font-mono">{data.advertising.conversions.toLocaleString('fr-DZ')} طلب</div>
                <div className="text-[10px] text-primary font-bold">{data.advertising.revenue.toLocaleString('fr-DZ')} DA</div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">الإنفاق الإعلاني: <strong className="text-foreground">{data.advertising.spend.toLocaleString('fr-DZ')} DA</strong></span>
              <span className="text-muted-foreground">تكلفة الاستحواذ (CPA): <strong className="text-foreground">{data.advertising.cpa} DA</strong></span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 5. Top Rankings & Performance Breakdown Tables */}
      <Card className="rounded-3xl border border-border/80 bg-card shadow-sm overflow-hidden text-right">
        <CardHeader className="bg-muted/20 border-b pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-black text-foreground">
                ترتيب أفضل الفئات والمنتجات والخدمات والمتاجر
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                استعراض العناصر الأكثر تحقيقاً للمبيعات والإيرادات والتفاعل في سوق خدماتك
              </CardDescription>
            </div>

            <div className="flex flex-wrap gap-1 bg-muted/50 p-1 rounded-2xl border">
              <button
                onClick={() => setActiveTab('categories')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'categories' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                الفئات
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'products' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                المنتجات
              </button>
              <button
                onClick={() => setActiveTab('services')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'services' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                الخدمات
              </button>
              <button
                onClick={() => setActiveTab('stores')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'stores' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                المتاجر
              </button>
              <button
                onClick={() => setActiveTab('providers')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'providers' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                المقدمين
              </button>
              <button
                onClick={() => setActiveTab('geo')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'geo' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                الولايات
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {activeTab === 'categories' && (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-right font-bold">الفئة</TableHead>
                  <TableHead className="text-right font-bold">النوع</TableHead>
                  <TableHead className="text-right font-bold">العمليات</TableHead>
                  <TableHead className="text-right font-bold">المشاهدات</TableHead>
                  <TableHead className="text-right font-bold">الإيرادات</TableHead>
                  <TableHead className="text-right font-bold">معدل التحويل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topCategories.map(cat => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-bold">{cat.nameAr}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cat.type === 'PRODUCT' ? 'bg-primary/10 text-primary' : 'bg-blue-500/10 text-blue-600'}>
                        {cat.type === 'PRODUCT' ? 'منتجات' : 'خدمات'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">{cat.salesCount.toLocaleString('fr-DZ')}</TableCell>
                    <TableCell className="font-mono">{cat.views.toLocaleString('fr-DZ')}</TableCell>
                    <TableCell className="font-mono font-bold text-primary">{cat.revenue.toLocaleString('fr-DZ')} DA</TableCell>
                    <TableCell className="font-mono font-bold text-emerald-600">{cat.conversionRate}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {activeTab === 'products' && (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-right font-bold">المنتج</TableHead>
                  <TableHead className="text-right font-bold">المتجر</TableHead>
                  <TableHead className="text-right font-bold">السعر</TableHead>
                  <TableHead className="text-right font-bold">المخزون</TableHead>
                  <TableHead className="text-right font-bold">المبيعات</TableHead>
                  <TableHead className="text-right font-bold">الإيرادات</TableHead>
                  <TableHead className="text-right font-bold">التحويل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topProducts.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-bold">{p.title}</TableCell>
                    <TableCell className="text-muted-foreground">{p.storeName}</TableCell>
                    <TableCell className="font-mono">{p.price.toLocaleString('fr-DZ')} DA</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={p.stock <= 10 ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' : 'bg-muted'}>
                        {p.stock} قطعة
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono font-bold">{p.unitsSold}</TableCell>
                    <TableCell className="font-mono font-bold text-primary">{p.revenue.toLocaleString('fr-DZ')} DA</TableCell>
                    <TableCell className="font-mono font-bold text-emerald-600">{p.conversionRate}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {activeTab === 'services' && (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-right font-bold">الخدمة</TableHead>
                  <TableHead className="text-right font-bold">مقدم الخدمة</TableHead>
                  <TableHead className="text-right font-bold">الأعمال المكتملة</TableHead>
                  <TableHead className="text-right font-bold">المشاهدات</TableHead>
                  <TableHead className="text-right font-bold">الإيرادات</TableHead>
                  <TableHead className="text-right font-bold">التقييم</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topServices.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-bold">{s.title}</TableCell>
                    <TableCell className="text-muted-foreground">{s.providerName}</TableCell>
                    <TableCell className="font-mono font-bold">{s.completedJobs} مهمة</TableCell>
                    <TableCell className="font-mono">{s.views.toLocaleString('fr-DZ')}</TableCell>
                    <TableCell className="font-mono font-bold text-primary">{s.revenue.toLocaleString('fr-DZ')} DA</TableCell>
                    <TableCell className="font-mono font-bold text-amber-500 flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <span>{s.rating}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {activeTab === 'stores' && (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-right font-bold">المتجر</TableHead>
                  <TableHead className="text-right font-bold">المالك</TableHead>
                  <TableHead className="text-right font-bold">الطلبات</TableHead>
                  <TableHead className="text-right font-bold">الزيارات</TableHead>
                  <TableHead className="text-right font-bold">المبيعات الإجمالية</TableHead>
                  <TableHead className="text-right font-bold">التقييم</TableHead>
                  <TableHead className="text-right font-bold">عائد الإعلانات (ROAS)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topStores.map(str => (
                  <TableRow key={str.id}>
                    <TableCell className="font-bold">{str.storeName}</TableCell>
                    <TableCell className="text-muted-foreground">{str.ownerName}</TableCell>
                    <TableCell className="font-mono font-bold">{str.ordersCount}</TableCell>
                    <TableCell className="font-mono">{str.storeVisits.toLocaleString('fr-DZ')}</TableCell>
                    <TableCell className="font-mono font-bold text-primary">{str.grossSales.toLocaleString('fr-DZ')} DA</TableCell>
                    <TableCell className="font-mono font-bold text-amber-500">★ {str.rating}</TableCell>
                    <TableCell className="font-mono font-bold text-emerald-600">{str.adRoas}x</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {activeTab === 'providers' && (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-right font-bold">مقدم الخدمة</TableHead>
                  <TableHead className="text-right font-bold">التخصص</TableHead>
                  <TableHead className="text-right font-bold">المهام المكتملة</TableHead>
                  <TableHead className="text-right font-bold">نسبة الإنجاز</TableHead>
                  <TableHead className="text-right font-bold">الإيرادات الإجمالية</TableHead>
                  <TableHead className="text-right font-bold">التقييم</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topProviders.map(prv => (
                  <TableRow key={prv.id}>
                    <TableCell className="font-bold">{prv.providerName}</TableCell>
                    <TableCell className="text-muted-foreground">{prv.category}</TableCell>
                    <TableCell className="font-mono font-bold">{prv.completedJobs}</TableCell>
                    <TableCell className="font-mono font-bold text-emerald-600">{prv.completionRate}%</TableCell>
                    <TableCell className="font-mono font-bold text-primary">{prv.grossRevenue.toLocaleString('fr-DZ')} DA</TableCell>
                    <TableCell className="font-mono font-bold text-amber-500">★ {prv.rating}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {activeTab === 'geo' && (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-right font-bold">الولاية / المنطقة</TableHead>
                  <TableHead className="text-right font-bold">الطلبات والمعاملات</TableHead>
                  <TableHead className="text-right font-bold">النسبة المئوية من حجم السوق</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.geoDistribution.map(geo => (
                  <TableRow key={geo.wilaya}>
                    <TableCell className="font-bold flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>{geo.wilaya}</span>
                    </TableCell>
                    <TableCell className="font-mono font-bold">{geo.count.toLocaleString('fr-DZ')} معاملة</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-muted/60 h-2 rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{ width: `${geo.percentage}%` }} />
                        </div>
                        <span className="font-mono font-bold text-xs text-primary">{geo.percentage}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
