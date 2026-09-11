'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Truck, 
  Package, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  RotateCcw, 
  TrendingUp, 
  Building2, 
  Key, 
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  MoreHorizontal,
  Layers,
  Settings2,
  FileText,
  DollarSign
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { shippingManagerService } from '@/services/shipping/ShippingManagerService';
import { shippingProviderFactory } from '@/services/shipping/ShippingProviderFactory';
import { ShippingProvidersManager } from './ShippingProvidersManager';
import { ShippingRulesManager } from './ShippingRulesManager';
import { ShippingLogsViewer } from './ShippingLogsViewer';
import type { Shipment, InternalShipmentStatus, AdminShippingDashboardKPIs } from '@/types/shipping';
import { algerianWilayas } from '@/data/mock';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function AdminShippingDashboardSection() {
  const [activeTab, setActiveTab] = useState<string>('shipments');
  const [kpis, setKpis] = useState<AdminShippingDashboardKPIs | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [wilayaFilter, setWilayaFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected shipment for status update modal
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [newStatus, setNewStatus] = useState<InternalShipmentStatus>('in_transit');
  const [statusNote, setStatusNote] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Delivery Failure & Return Dialogs
  const [isFailureModalOpen, setIsFailureModalOpen] = useState(false);
  const [failureReason, setFailureReason] = useState('Customer unreachable');
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('Customer refused parcel');

  // Load Data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [kpiData, shipmentData] = await Promise.all([
        shippingManagerService.getAdminKPIs(),
        shippingManagerService.getAllShipments({
          status: statusFilter === 'all' ? undefined : (statusFilter as InternalShipmentStatus),
          provider_id: providerFilter,
          wilaya: wilayaFilter,
          search_query: searchQuery
        })
      ]);
      setKpis(kpiData);
      setShipments(shipmentData);
    } catch (e) {
      console.error('Failed to load admin shipping data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, providerFilter, wilayaFilter, searchQuery]);

  const handleUpdateStatus = async () => {
    if (!selectedShipment) return;
    setIsUpdating(true);
    try {
      await shippingManagerService.updateShipmentStatus({
        trackingNumber: selectedShipment.tracking_number,
        newStatus,
        description: statusNote || undefined,
        actorRole: 'ADMIN',
        actorName: 'Admin Logistics Supervisor'
      });
      toast({
        title: 'تم تحديث حالة الشحنة بنجاح ✓',
        description: `تم تغيير الحالة إلى ${newStatus}`,
      });
      setSelectedShipment(null);
      setStatusNote('');
      loadData();
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message || 'تعذر التحديث', variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogFailure = async () => {
    if (!selectedShipment) return;
    setIsUpdating(true);
    try {
      await shippingManagerService.logDeliveryAttempt({
        trackingNumber: selectedShipment.tracking_number,
        reason: failureReason,
        notes: statusNote || undefined,
      });
      toast({
        title: 'تم توثيق محاولة التسليم الفاشلة ⚠️',
        description: `السبب: ${failureReason}`,
      });
      setIsFailureModalOpen(false);
      setSelectedShipment(null);
      loadData();
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleInitiateReturn = async () => {
    if (!selectedShipment) return;
    setIsUpdating(true);
    try {
      await shippingManagerService.initiateReturn({
        trackingNumber: selectedShipment.tracking_number,
        reason: returnReason,
        notes: statusNote || undefined,
      });
      toast({
        title: 'تم تسجيل إرجاع الشحنة بنجاح 🔄',
        description: `السبب: ${returnReason}`,
      });
      setIsReturnModalOpen(false);
      setSelectedShipment(null);
      loadData();
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  };

  const providers = shippingProviderFactory.getAllProviders();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="p-6 bg-gradient-to-r from-primary/15 via-card to-card border rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge className="bg-primary text-primary-foreground font-bold text-xs uppercase px-2.5 py-0.5 rounded-full">
              إدارة اللوجستيك والشحن
            </Badge>
            <span className="text-xs text-muted-foreground">• منصة المراقبة المركزية والربط المتعدد</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground">
            لوحة إدارة الشحن والطرود عبر الجزائر (58 ولاية)
          </h2>
          <p className="text-xs text-muted-foreground">
            إدارة متكاملة للشحنات عبر ياليدين، زد آر، مايسترو، الشحن اليدوي، والأسطول الداخلي المباشر.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="rounded-xl font-bold h-10 px-4 text-xs gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>تحديث</span>
          </Button>
          <Button
            size="sm"
            asChild
            className="rounded-xl font-bold h-10 px-4 text-xs bg-primary text-primary-foreground gap-1.5 shadow-sm"
          >
            <Link href="/track">
              <ExternalLink className="h-3.5 w-3.5" />
              <span>صفحة التتبع المباشر</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/60 p-1 rounded-2xl border border-border/40 grid grid-cols-2 md:grid-cols-4 max-w-2xl">
          <TabsTrigger value="shipments" className="rounded-xl text-xs font-bold gap-1.5">
            <Package className="h-4 w-4" />
            <span>الشحنات والطرود</span>
          </TabsTrigger>
          <TabsTrigger value="providers" className="rounded-xl text-xs font-bold gap-1.5">
            <Truck className="h-4 w-4" />
            <span>شركات الشحن (APIs)</span>
          </TabsTrigger>
          <TabsTrigger value="rules" className="rounded-xl text-xs font-bold gap-1.5">
            <Layers className="h-4 w-4" />
            <span>قواعد الأسعار والمناطق</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="rounded-xl text-xs font-bold gap-1.5">
            <FileText className="h-4 w-4" />
            <span>سجلات الـ Logs</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview & Shipments */}
        <TabsContent value="shipments" className="space-y-6">
          {/* KPI Cards */}
          {kpis && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="rounded-2xl border border-border/80 shadow-sm p-4 space-y-2 bg-card">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
                  <span>إجمالي الشحنات</span>
                  <Package className="h-4 w-4 text-primary" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-foreground font-mono">
                  {kpis.total_shipments}
                </div>
                <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <span className="text-emerald-600 font-bold">{kpis.delivered_count}</span> تم تسليمها بنجاح
                </div>
              </Card>

              <Card className="rounded-2xl border border-border/80 shadow-sm p-4 space-y-2 bg-card">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
                  <span>قيد التوصيل والفرز</span>
                  <Truck className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-blue-600 font-mono">
                  {kpis.in_transit_count + kpis.out_for_delivery_count}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {kpis.out_for_delivery_count} طرد مع المندوبين للتسليم الآن
                </div>
              </Card>

              <Card className="rounded-2xl border border-border/80 shadow-sm p-4 space-y-2 bg-card">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
                  <span>نسبة نجاح التوصيل</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">
                  %{kpis.delivery_success_rate}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  نسبة المرتجع: <strong className="text-destructive font-mono">%{kpis.return_rate}</strong>
                </div>
              </Card>

              <Card className="rounded-2xl border border-border/80 shadow-sm p-4 space-y-2 bg-card">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
                  <span>مبالغ الدفع عند الاستلام (COD)</span>
                  <ShieldCheck className="h-4 w-4 text-amber-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-foreground font-mono">
                  {kpis.total_cod_collected.toLocaleString('fr-DZ')} <span className="text-xs font-bold text-muted-foreground">دج</span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  مبالغ تم تحصيلها وجاهزة للتحويل
                </div>
              </Card>
            </div>
          )}

          {/* Carrier SLA Performance Comparison */}
          {kpis && kpis.shipments_by_provider.length > 0 && (
            <Card className="rounded-3xl border border-border shadow-sm overflow-hidden">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span>مؤشرات أداء وسرعة شركات الشحن المعتمدة (Carrier SLAs)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right">
                    <thead className="bg-muted/50 border-b border-border/40 text-muted-foreground font-semibold">
                      <tr>
                        <th className="p-3.5">شركة الشحن</th>
                        <th className="p-3.5">إجمالي الطرود</th>
                        <th className="p-3.5">المسلمة</th>
                        <th className="p-3.5">نسبة النجاح</th>
                        <th className="p-3.5">متوسط وقت التوصيل</th>
                        <th className="p-3.5 text-center">حالة التكامل</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {kpis.shipments_by_provider.map((carrier) => (
                        <tr key={carrier.provider_id} className="hover:bg-muted/20">
                          <td className="p-3.5 font-bold text-foreground flex items-center gap-2">
                            <span>{carrier.provider_name}</span>
                          </td>
                          <td className="p-3.5 font-mono">{carrier.count}</td>
                          <td className="p-3.5 font-mono text-emerald-600 font-bold">{carrier.delivered_count}</td>
                          <td className="p-3.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                              %{carrier.success_rate}
                            </span>
                          </td>
                          <td className="p-3.5 text-muted-foreground font-semibold">{carrier.avg_hours} ساعة</td>
                          <td className="p-3.5 text-center">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>جاهز ومتصل</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Shipments Table */}
          <Card className="rounded-3xl border border-border shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/40 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  <span>قائمة الشحنات والطرود</span>
                </CardTitle>
                <Badge variant="outline" className="text-xs font-mono font-bold">
                  {shipments.length} شحنة
                </Badge>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
                <div className="relative">
                  <Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="بحث برقم التتبع، الطلب، المستلم..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="ps-9 h-9 text-xs rounded-xl"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-9 px-3 rounded-xl border border-input bg-background text-xs font-medium"
                >
                  <option value="all">جميع الحالات الداخلية</option>
                  <option value="pending">قيد التجهيز (Pending)</option>
                  <option value="pickup_requested">طلب استلام (Pickup Requested)</option>
                  <option value="picked_up">تم الاستلام (Picked Up)</option>
                  <option value="in_transit">في الطريق (In Transit)</option>
                  <option value="out_for_delivery">مع المندوب (Out for Delivery)</option>
                  <option value="delivery_attempted">محاولة غير مكتملة (Attempted)</option>
                  <option value="delivered">تم التسليم (Delivered)</option>
                  <option value="failed_delivery">فشل التسليم (Failed)</option>
                  <option value="returned">مرتجع (Returned)</option>
                  <option value="cancelled">ملغي (Cancelled)</option>
                </select>

                <select
                  value={providerFilter}
                  onChange={(e) => setProviderFilter(e.target.value)}
                  className="h-9 px-3 rounded-xl border border-input bg-background text-xs font-medium"
                >
                  <option value="all">جميع شركات الشحن</option>
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nameAr}
                    </option>
                  ))}
                </select>

                <select
                  value={wilayaFilter}
                  onChange={(e) => setWilayaFilter(e.target.value)}
                  className="h-9 px-3 rounded-xl border border-input bg-background text-xs font-medium"
                >
                  <option value="all">جميع الولايات (58)</option>
                  {algerianWilayas.map((w) => (
                    <option key={w.code} value={w.code}>
                      {w.code} - {w.name} ({w.name_fr})
                    </option>
                  ))}
                </select>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right">
                  <thead className="bg-muted/50 border-b border-border/40 text-muted-foreground font-semibold">
                    <tr>
                      <th className="p-3.5">رقم التتبع والطلب</th>
                      <th className="p-3.5">المستلم والوجهة</th>
                      <th className="p-3.5">الشركة ونوع التوصيل</th>
                      <th className="p-3.5">المبلغ والـ COD</th>
                      <th className="p-3.5">الحالة القياسية</th>
                      <th className="p-3.5">كود OTP</th>
                      <th className="p-3.5 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                          <Clock className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                          <span>جارِ تحميل بيانات الشحنات...</span>
                        </td>
                      </tr>
                    ) : shipments.length > 0 ? (
                      shipments.map((s) => (
                        <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3.5 space-y-0.5">
                            <Link href={`/track/${s.tracking_number}`} className="font-mono font-bold text-primary hover:underline block">
                              {s.tracking_number}
                            </Link>
                            <div className="text-[11px] text-muted-foreground">طلب: {s.order_number || s.order_id}</div>
                          </td>

                          <td className="p-3.5 space-y-0.5">
                            <div className="font-bold text-foreground">{s.recipient_name}</div>
                            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-primary" />
                              <span>{s.delivery_wilaya} ({s.delivery_commune})</span>
                            </div>
                          </td>

                          <td className="p-3.5 space-y-0.5">
                            <div className="font-semibold text-foreground">{s.provider_name}</div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted font-medium">
                              {s.shipping_method_code === 'stop_desk' ? 'استلام مكتب' : 'توصيل لباب المنزل'}
                            </span>
                          </td>

                          <td className="p-3.5 space-y-0.5 font-mono">
                            <div className="font-bold text-foreground">{s.cod_amount.toLocaleString('fr-DZ')} دج</div>
                            <div className="text-[10px] text-muted-foreground font-sans">
                              رسوم التوصيل: {s.shipping_fee} دج
                            </div>
                          </td>

                          <td className="p-3.5">
                            <Badge 
                              className={cn(
                                "px-2.5 py-0.5 text-[11px] font-bold rounded-full",
                                s.status === 'delivered' && "bg-emerald-600 text-white",
                                s.status === 'out_for_delivery' && "bg-amber-600 text-white",
                                s.status === 'in_transit' && "bg-blue-600 text-white",
                                s.status === 'picked_up' && "bg-indigo-600 text-white",
                                s.status === 'pending' && "bg-purple-600 text-white",
                                s.status === 'delivery_attempted' && "bg-orange-600 text-white",
                                s.status === 'failed_delivery' && "bg-destructive text-white",
                                s.status === 'returned' && "bg-slate-700 text-white"
                              )}
                            >
                              {s.status}
                            </Badge>
                          </td>

                          <td className="p-3.5">
                            <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                              {s.delivery_otp_code || 'N/A'}
                            </span>
                          </td>

                          <td className="p-3.5 text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52 rounded-xl">
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedShipment(s);
                                    setNewStatus(s.status);
                                  }}
                                  className="text-xs font-semibold cursor-pointer"
                                >
                                  <RotateCcw className="h-3.5 w-3.5 mr-2" />
                                  <span>تحديث الحالة يدوياً</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedShipment(s);
                                    setIsFailureModalOpen(true);
                                  }}
                                  className="text-xs font-semibold cursor-pointer text-amber-600"
                                >
                                  <AlertCircle className="h-3.5 w-3.5 mr-2" />
                                  <span>تسجيل محاولة فاشلة</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedShipment(s);
                                    setIsReturnModalOpen(true);
                                  }}
                                  className="text-xs font-semibold cursor-pointer text-destructive"
                                >
                                  <RotateCcw className="h-3.5 w-3.5 mr-2" />
                                  <span>بدء إجراءات الإرجاع</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild className="text-xs font-semibold cursor-pointer">
                                  <Link href={`/track/${s.tracking_number}`}>
                                    <ExternalLink className="h-3.5 w-3.5 mr-2" />
                                    <span>عرض صفحة التتبع</span>
                                  </Link>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                          لا توجد شحنات تطابق الفلاتر المحددة.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Providers & APIs */}
        <TabsContent value="providers">
          <ShippingProvidersManager />
        </TabsContent>

        {/* Tab 3: Rules & Zones */}
        <TabsContent value="rules">
          <ShippingRulesManager />
        </TabsContent>

        {/* Tab 4: Logs */}
        <TabsContent value="logs">
          <ShippingLogsViewer />
        </TabsContent>
      </Tabs>

      {/* Manual Status Change Dialog */}
      <Dialog open={!!selectedShipment && !isFailureModalOpen && !isReturnModalOpen} onOpenChange={(open) => !open && setSelectedShipment(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-primary" />
              <span>تحديث حالة الشحنة ({selectedShipment?.tracking_number})</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              سيتم تسجيل التحديث وإضافته إلى السجل الزمني للتتبع فوراً.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">الحالة الجديدة الموحدة:</Label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as InternalShipmentStatus)}
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-semibold"
              >
                <option value="pending">تجهيز في المتجر (Pending)</option>
                <option value="pickup_requested">طلب استلام من المستودع (Pickup Requested)</option>
                <option value="picked_up">تم الاستلام من المتجر (Picked Up)</option>
                <option value="in_transit">في الطريق بين مراكز الفرز (In Transit)</option>
                <option value="arrived_at_destination">وصل لمركز التوزيع بالولاية (Arrived)</option>
                <option value="out_for_delivery">مع المندوب للتسليم (Out for Delivery)</option>
                <option value="delivery_attempted">محاولة غير مكتملة (Delivery Attempted)</option>
                <option value="delivered">تم التسليم للزبون بنجاح (Delivered)</option>
                <option value="failed_delivery">فشل التسليم النهائي (Failed Delivery)</option>
                <option value="returned">مرتجع إلى المتجر (Returned)</option>
                <option value="cancelled">ملغي (Cancelled)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">ملاحظة التتبع (اختياري):</Label>
              <Input
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="مثال: وصل الطرد إلى مستودع التوزيع بولاية قسنطينة..."
                className="h-9 text-xs rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedShipment(null)}
              className="rounded-xl text-xs"
            >
              إلغاء
            </Button>
            <Button
              size="sm"
              onClick={handleUpdateStatus}
              disabled={isUpdating}
              className="rounded-xl text-xs font-bold bg-primary text-primary-foreground"
            >
              {isUpdating ? 'جارِ الحفظ...' : 'تأكيد التحديث'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delivery Attempt Failure Dialog */}
      <Dialog open={isFailureModalOpen} onOpenChange={setIsFailureModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-4 w-4" />
              <span>تسجيل محاولة تسليم فاشلة</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">سبب تعذر التسليم:</Label>
              <select
                value={failureReason}
                onChange={(e) => setFailureReason(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border bg-background text-xs"
              >
                <option value="Customer unreachable">الزبون لا يرد على الهاتف (Customer unreachable)</option>
                <option value="Customer requested postponement">الزبون طلب تأجيل الاستلام (Postponed)</option>
                <option value="Wrong delivery address">العنوان غير دقيق أو خاطئ (Wrong Address)</option>
                <option value="Customer refused parcel">الزبون رفض استلام الطرد (Refused)</option>
                <option value="Force majeure / weather">ظروف طارئة أو عطلة (Force Majeure)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">ملاحظة السائق:</Label>
              <Input
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="تفاصيل المحاولة..."
                className="h-9 text-xs rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsFailureModalOpen(false)}>إلغاء</Button>
            <Button size="sm" onClick={handleLogFailure} className="bg-amber-600 text-white">تسجيل المحاولة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Initiation Dialog */}
      <Dialog open={isReturnModalOpen} onOpenChange={setIsReturnModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-destructive">
              <RotateCcw className="h-4 w-4" />
              <span>بدء إجراءات إرجاع الطرد للبائع</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">سبب الإرجاع:</Label>
              <select
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border bg-background text-xs"
              >
                <option value="Customer refused parcel">الزبون رفض الاستلام والدفع</option>
                <option value="Max delivery attempts exceeded">استنفاد جميع محاولات الاتصال بالزبون</option>
                <option value="Damaged goods">تلف الطرد أثناء الشحن</option>
                <option value="Seller requested cancellation">البائع طلب إلغاء واسترجاع الشحنة</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsReturnModalOpen(false)}>إلغاء</Button>
            <Button size="sm" onClick={handleInitiateReturn} className="bg-destructive text-white">تأكيد الإرجاع</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
