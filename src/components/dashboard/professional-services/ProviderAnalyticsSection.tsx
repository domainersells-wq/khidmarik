'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, BarChart3, Users, ShoppingCart, TrendingUp, TrendingDown, CalendarDays, Download, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/LanguageContext';

export function ProviderAnalyticsSection() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const [period, setPeriod] = useState<'7days' | '30days' | '90days'>('30days');

  const t = (key: string, def: string) => {
    const dict: Record<string, Record<string, string>> = {
      ar: {
        title: 'تحليلات الأداء والزيارات',
        desc: 'تابع زيارات ملفك الشخصي والطلب على خدماتك ومعدلات التحول.',
        period: 'الفترة الزمنية',
        p7: 'آخر 7 أيام',
        p30: 'آخر 30 يوماً',
        p90: 'آخر 90 يوماً',
        views: 'مشاهدات الملف الشخصي',
        svcViews: 'مشاهدات الخدمات المعروضة',
        requests: 'طلبات الاتصال والحجز',
        conversion: 'معدل التحول (طلب/زيارة)',
        trendTitle: 'مخطط الزيارات والمشاهدات اليومية',
        trendDesc: 'توزيع مشاهدات الملف الشخصي والخدمات عبر الأيام.',
        export: 'تصدير البيانات',
        popularTitle: 'أكثر الخدمات طلباً ومشاهدة',
        popularDesc: 'تحديد الخدمات التي تجذب أكبر عدد من العملاء والزيارات.',
        svcName: 'اسم الخدمة',
        viewCount: 'المشاهدات',
        leadsCount: 'الحجوزات / الطلبات'
      },
      fr: {
        title: 'Analyses de Performance',
        desc: 'Suivez les visites de votre profil, l\'engagement et la popularité de vos services.',
        period: 'Période',
        p7: '7 derniers jours',
        p30: '30 derniers jours',
        p90: '90 derniers jours',
        views: 'Vues de Profil',
        svcViews: 'Vues des Services',
        requests: 'Demandes de Contact',
        conversion: 'Taux de Conversion',
        trendTitle: 'Tendances des Visites',
        trendDesc: 'Graphique quotidien des vues de profil et de services.',
        export: 'Exporter',
        popularTitle: 'Services les Plus Populaires',
        popularDesc: 'Identifiez les services qui génèrent le plus de leads.',
        svcName: 'Nom du Service',
        viewCount: 'Vues',
        leadsCount: 'Réservations / Contacts'
      },
      en: {
        title: 'Performance Analytics',
        desc: 'Track profile visits, service engagement, and customer lead conversion rates.',
        period: 'Time Period',
        p7: 'Last 7 Days',
        p30: 'Last 30 Days',
        p90: 'Last 90 Days',
        views: 'Profile Views',
        svcViews: 'Service Views',
        requests: 'Contact Requests',
        conversion: 'Conversion Rate',
        trendTitle: 'Profile & Service View Trends',
        trendDesc: 'Visualize daily views distribution.',
        export: 'Export Data',
        popularTitle: 'Most Popular Services',
        popularDesc: 'Identify which services attract the most attention.',
        svcName: 'Service Name',
        viewCount: 'Views',
        leadsCount: 'Bookings / Leads'
      }
    };
    return dict[language]?.[key] || dict['en']?.[key] || def;
  };

  // Dynamically compute stats based on period selection
  const multiplier = period === '7days' ? 0.25 : period === '90days' ? 3.1 : 1.0;
  
  const stats = {
    profileViews: Math.round(1250 * multiplier),
    serviceViews: Math.round(3480 * multiplier),
    contactRequests: Math.round(85 * multiplier),
    conversionRate: 12.5, // Keep percentage conversion stable
  };

  const popularServices = [
    { id: 'svc1', name: language === 'ar' ? 'تصليح السباكة الطارئ' : 'Emergency Plumbing Repair', views: Math.round(800 * multiplier), bookings: Math.round(40 * multiplier) },
    { id: 'svc2', name: language === 'ar' ? 'تصميم الهوية والشعار المهني' : 'Custom Logo Design Package', views: Math.round(650 * multiplier), bookings: Math.round(25 * multiplier) },
    { id: 'svc_other', name: language === 'ar' ? 'استشارة عامة' : 'General Consultation', views: Math.round(500 * multiplier), bookings: Math.round(15 * multiplier) },
  ];

  // Render SVG data points based on period
  const getChartPoints = () => {
    if (period === '7days') {
      return {
        profile: [20, 45, 28, 60, 50, 75, 90],
        service: [40, 80, 70, 110, 95, 140, 180]
      };
    } else if (period === '90days') {
      return {
        profile: [15, 30, 25, 45, 35, 60, 55, 75, 70, 90, 85, 110],
        service: [30, 70, 60, 100, 85, 130, 120, 160, 150, 200, 185, 240]
      };
    } else {
      // 30 days default
      return {
        profile: [20, 35, 25, 50, 40, 60, 55, 70, 65, 80],
        service: [45, 75, 60, 110, 90, 135, 125, 160, 145, 190]
      };
    }
  };

  const chartData = getChartPoints();

  const handleExport = () => {
    // Generate CSV data format
    const headers = 'Service Name,Views,Bookings\n';
    const rows = popularServices.map(s => `"${s.name}",${s.views},${s.bookings}`).join('\n');
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(headers + rows);
    
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `khidmatik-analytics-${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'CSV Export Successful',
      description: 'The CSV data sheet has been downloaded successfully.'
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" /> {t('title', 'Performance Analytics')}
          </h1>
          <p className="text-muted-foreground">{t('desc', 'Track views and engagement.')}</p>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <Select value={period} onValueChange={(val: any) => setPeriod(val)}>
            <SelectTrigger className="w-40 bg-white">
              <SelectValue placeholder={t('period', 'Period')} />
            </SelectTrigger>
            <SelectContent className="bg-white text-slate-800 border">
              <SelectItem value="7days">{t('p7', '7 Days')}</SelectItem>
              <SelectItem value="30days">{t('p30', '30 Days')}</SelectItem>
              <SelectItem value="90days">{t('p90', '90 Days')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* Metrics Row */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">{t('views', 'Profile Views')}</CardTitle>
            <Eye className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.profileViews.toLocaleString()}</div>
            <p className="text-[10px] text-green-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1 shrink-0" /> +15%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">{t('svcViews', 'Service Views')}</CardTitle>
            <Eye className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.serviceViews.toLocaleString()}</div>
            <p className="text-[10px] text-red-500 flex items-center mt-1">
              <TrendingDown className="h-3 w-3 mr-1 shrink-0" /> -5%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">{t('requests', 'Leads')}</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.contactRequests}</div>
            <p className="text-[10px] text-green-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1 shrink-0" /> +20%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">{t('conversion', 'Conv. Rate')}</CardTitle>
            <Star className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
            <p className="text-[10px] text-green-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1 shrink-0" /> +2%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary"/> {t('trendTitle', 'Trends')}</CardTitle>
          <CardDescription>{t('trendDesc', 'Views distribution.')}</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-end justify-between gap-2 bg-slate-50 border rounded-lg p-6 relative">
          <div className="absolute top-4 left-6 flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-primary"><span className="w-3 h-3 bg-primary rounded-full" /> Profile Views</span>
            <span className="flex items-center gap-1.5 font-semibold text-indigo-600"><span className="w-3 h-3 bg-indigo-600 rounded-full" /> Service Views</span>
          </div>
          
          {/* Simple Visual HTML Bar Chart */}
          {chartData.profile.map((val, idx) => {
            const svcVal = chartData.service[idx];
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
                {/* Tooltip on hover */}
                <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col bg-slate-900 text-white text-[10px] p-2 rounded shadow-md z-10 text-center pointer-events-none">
                  <span>P: {val}</span>
                  <span>S: {svcVal}</span>
                </div>
                
                {/* Bars */}
                <div className="w-full flex items-end justify-center gap-0.5 max-w-[24px]">
                  <div className="bg-primary/80 group-hover:bg-primary transition-all rounded-t-sm w-3" style={{ height: `${val * 2}px` }} />
                  <div className="bg-indigo-500/80 group-hover:bg-indigo-600 transition-all rounded-t-sm w-3" style={{ height: `${svcVal * 1.2}px` }} />
                </div>
                
                <span className="text-[9px] text-muted-foreground font-mono">D{idx+1}</span>
              </div>
            );
          })}
        </CardContent>
        <CardFooter className="flex justify-between items-center pt-4">
          <span className="text-xs text-muted-foreground">Generated dynamically. Period values updated automatically.</span>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1.5" /> {t('export', 'Export')}
          </Button>
        </CardFooter>
      </Card>

      {/* Most Popular Services */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-primary"/> {t('popularTitle', 'Popular Services')}</CardTitle>
          <CardDescription>{t('popularDesc', 'Services performance.')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('svcName', 'Service')}</TableHead>
                <TableHead className="text-right">{t('viewCount', 'Views')}</TableHead>
                <TableHead className="text-right">{t('leadsCount', 'Bookings')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {popularServices.map(service => (
                <TableRow key={service.id}>
                  <TableCell className="font-semibold text-slate-800 text-xs">{service.name}</TableCell>
                  <TableCell className="text-right font-semibold text-xs">{service.views.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-semibold text-xs text-primary">{service.bookings.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
