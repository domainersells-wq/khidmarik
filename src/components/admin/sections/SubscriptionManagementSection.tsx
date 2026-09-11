'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  CreditCard,
  ShieldCheck,
  Calendar,
  DollarSign,
  Store,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  ChevronRight,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { subscriptionService, StoreSubscription, SubscriptionPlan } from '@/services/subscriptionService';

export function SubscriptionManagementSection() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'plans' | 'pending'>('subscriptions');
  const [subscriptions, setSubscriptions] = useState<StoreSubscription[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Selected subscription for inspection / action
  const [selectedSub, setSelectedSub] = useState<StoreSubscription | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allPlans, allSubs] = await Promise.all([
        subscriptionService.getSubscriptionPlans(),
        subscriptionService.getAllSubscriptions(),
      ]);
      setPlans(allPlans);
      setSubscriptions(allSubs);
    } catch (err) {
      console.warn('Error loading subscription data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConfirmPayment = async (subId: string) => {
    try {
      await subscriptionService.confirmSubscriptionPayment(subId, 'super_admin');
      toast({
        title: 'تم تفعيل الاشتراك بنجاح',
        description: 'تم تحديث فترة صلاحية المتجر وتفعيل ميزات الخطة المختارة.',
      });
      setIsDetailOpen(false);
      await loadData();
    } catch (err: any) {
      toast({
        title: 'فشل التفعيل',
        description: err?.message || 'حدث خطأ أثناء تفعيل الاشتراك.',
        variant: 'destructive',
      });
    }
  };

  const filteredSubs = subscriptions.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (s.storeName && s.storeName.toLowerCase().includes(q)) ||
      s.planId.toLowerCase().includes(q) ||
      s.status.toLowerCase().includes(q)
    );
  });

  const pendingSubs = subscriptions.filter((s) => s.status === 'pending_payment');
  const activeSubs = subscriptions.filter((s) => s.status === 'active');

  const totalMRR = activeSubs.reduce((acc, s) => {
    const p = plans.find((pl) => pl.id === s.planId);
    return acc + (p?.priceMonthly || 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-primary" />
            إدارة الاشتراكات والخطط (Store Subscriptions & Plans)
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            متابعة باقات المتاجر، تفعيل التجديدات، تدقيق وصولات الدفع، وإدارة رسوم الامتيازات.
          </p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm" className="gap-2 shrink-0">
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          تحديث البيانات الحية
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">إجمالي الاشتراكات</p>
              <p className="text-2xl font-bold mt-1">{subscriptions.length}</p>
              <p className="text-xs text-muted-foreground mt-1">عبر كافة الباقات</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Store className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">الاشتراكات الفعالة</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{activeSubs.length}</p>
              <p className="text-xs text-emerald-600/80 mt-1">متاجر نشطة حالياً</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">العائد الشهري المتوقع (MRR)</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{totalMRR.toLocaleString()} DA</p>
              <p className="text-xs text-muted-foreground mt-1">من باقات المتاجر الشهرية</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">بانتظار التحقق والدفع</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{pendingSubs.length}</p>
              <p className="text-xs text-amber-600/80 mt-1">طلبات ترقية معلقة</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Layout */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid grid-cols-3 max-w-md">
          <TabsTrigger value="subscriptions" className="gap-2">
            <Store className="w-4 h-4" />
            اشتراكات المتاجر
          </TabsTrigger>
          <TabsTrigger value="plans" className="gap-2">
            <Layers className="w-4 h-4" />
            الباقات والأسعار
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2 relative">
            <Clock className="w-4 h-4" />
            طلبات التحقق
            {pendingSubs.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 absolute top-1.5 right-1.5" />
            )}
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Subscriptions Table */}
        <TabsContent value="subscriptions" className="mt-4 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="بحث باسم المتجر أو الخطة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-9"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              عرض {filteredSubs.length} اشتراك
            </div>
          </div>

          <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-muted/50 text-muted-foreground border-b text-xs font-semibold">
                  <tr>
                    <th className="p-3">المتجر (Store)</th>
                    <th className="p-3">الخطة الحالية</th>
                    <th className="p-3">دورة الفوترة</th>
                    <th className="p-3">تاريخ البداية</th>
                    <th className="p-3">تاريخ الانتهاء</th>
                    <th className="p-3">حالة الاشتراك</th>
                    <th className="p-3 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredSubs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        لا توجد اشتراكات مطابقة في قاعدة البيانات.
                      </td>
                    </tr>
                  ) : (
                    filteredSubs.map((sub) => {
                      const plan = plans.find((p) => p.id === sub.planId);
                      return (
                        <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-medium">
                            {sub.storeName || 'متجر معتمد'}
                            <div className="text-xs text-muted-foreground font-mono">
                              ID: {sub.storeId.substring(0, 8)}...
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="font-semibold gap-1">
                              <Sparkles className="w-3 h-3 text-primary" />
                              {plan?.nameAr || sub.planId.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {sub.billingCycle === 'yearly' ? 'سنوي (Yearly)' : 'شهري (Monthly)'}
                          </td>
                          <td className="p-3 text-xs text-muted-foreground">
                            {sub.currentPeriodStart.split('T')[0]}
                          </td>
                          <td className="p-3 text-xs font-medium">
                            {sub.currentPeriodEnd.split('T')[0]}
                          </td>
                          <td className="p-3">
                            <Badge
                              className={
                                sub.status === 'active'
                                  ? 'bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20'
                                  : sub.status === 'pending_payment'
                                  ? 'bg-amber-500/15 text-amber-700 hover:bg-amber-500/20'
                                  : 'bg-rose-500/15 text-rose-700 hover:bg-rose-500/20'
                              }
                            >
                              {sub.status === 'active'
                                ? 'نشط (Active)'
                                : sub.status === 'pending_payment'
                                ? 'بانتظار الدفع'
                                : 'منتهي / ملغي'}
                            </Badge>
                          </td>
                          <td className="p-3 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedSub(sub);
                                setIsDetailOpen(true);
                              }}
                              className="gap-1 text-xs"
                            >
                              تفاصيل
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Plans Catalog */}
        <TabsContent value="plans" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan) => (
              <Card key={plan.id} className="relative flex flex-col justify-between border-2 hover:border-primary/50 transition-all">
                {plan.id === 'pro' && (
                  <div className="absolute -top-3 left-4 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                    الأكثر طلباً
                  </div>
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold">{plan.nameAr}</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      المستوى {plan.tier}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs mt-1">{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-2xl font-bold text-foreground">
                      {plan.priceMonthly === 0 ? 'مجاني' : `${plan.priceMonthly.toLocaleString()} DA`}
                    </span>
                    <span className="text-xs text-muted-foreground mr-1">/ شهرياً</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    أو {plan.priceYearly.toLocaleString()} DA سنوياً
                  </div>
                </CardHeader>
                <CardContent className="pt-2 border-t mt-2 flex-1">
                  <p className="text-xs font-semibold mb-2">المزايا المضمنة:</p>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab 3: Pending Approvals */}
        <TabsContent value="pending" className="mt-4 space-y-4">
          {pendingSubs.length === 0 ? (
            <div className="border rounded-xl p-12 text-center bg-card">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-semibold">لا توجد طلبات اشتراك معلقة</h3>
              <p className="text-xs text-muted-foreground mt-1">
                جميع طلبات الاشتراك والترقية للمتاجر تمت معالجتها واعتمادها.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingSubs.map((sub) => {
                const plan = plans.find((p) => p.id === sub.planId);
                return (
                  <Card key={sub.id} className="border-amber-200 dark:border-amber-900/50 bg-amber-50/20 dark:bg-amber-950/10">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                          <Store className="w-4 h-4 text-amber-600" />
                          {sub.storeName || 'متجر شريك'}
                        </CardTitle>
                        <Badge variant="outline" className="text-amber-700 bg-amber-100 dark:bg-amber-950">
                          بانتظار اعتماد الإدارة
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">
                        طلب ترقية إلى باقة: <strong>{plan?.nameAr}</strong> ({sub.billingCycle === 'yearly' ? 'سنوي' : 'شهري'})
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b">
                        <span className="text-muted-foreground">طريقة الدفع:</span>
                        <span className="font-semibold">{sub.paymentMethod || 'تحويل بنكي / CCP'}</span>
                      </div>
                      {sub.transactionReference && (
                        <div className="flex justify-between py-1 border-b">
                          <span className="text-muted-foreground">رقم الحوالة:</span>
                          <span className="font-mono">{sub.transactionReference}</span>
                        </div>
                      )}
                      <div className="flex justify-between py-1 border-b">
                        <span className="text-muted-foreground">تاريخ الطلب:</span>
                        <span>{sub.createdAt.replace('T', ' ').substring(0, 16)}</span>
                      </div>
                      <div className="pt-2 flex justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleConfirmPayment(sub.id)}
                          className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          اعتماد فوري وتفعيل المتجر
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Subscription Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              تفاصيل اشتراك المتجر
            </DialogTitle>
            <DialogDescription>
              معلومات العقد وفترة الصلاحية والدفع في قاعدة البيانات.
            </DialogDescription>
          </DialogHeader>

          {selectedSub && (
            <div className="space-y-3 text-sm py-2">
              <div className="p-3 bg-muted/40 rounded-lg space-y-1">
                <p className="text-xs text-muted-foreground">المتجر:</p>
                <p className="font-bold text-base">{selectedSub.storeName || 'متجر معتمد'}</p>
                <p className="text-xs font-mono text-muted-foreground">Store ID: {selectedSub.storeId}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2 border rounded-lg">
                  <span className="text-muted-foreground block">الخطة:</span>
                  <span className="font-bold text-sm uppercase">{selectedSub.planId}</span>
                </div>
                <div className="p-2 border rounded-lg">
                  <span className="text-muted-foreground block">الحالة:</span>
                  <span className="font-bold text-sm">{selectedSub.status}</span>
                </div>
                <div className="p-2 border rounded-lg">
                  <span className="text-muted-foreground block">بداية الفترة:</span>
                  <span>{selectedSub.currentPeriodStart.split('T')[0]}</span>
                </div>
                <div className="p-2 border rounded-lg">
                  <span className="text-muted-foreground block">نهاية الفترة:</span>
                  <span>{selectedSub.currentPeriodEnd.split('T')[0]}</span>
                </div>
              </div>

              {selectedSub.status === 'pending_payment' && (
                <div className="p-3 bg-amber-500/10 border border-amber-200 rounded-lg text-xs text-amber-800 dark:text-amber-300">
                  <p className="font-bold flex items-center gap-1.5 mb-1">
                    <AlertCircle className="w-4 h-4" />
                    الاشتراك بانتظار الاعتماد
                  </p>
                  <span>يمكنك تأكيد استلام الحوالة وتفعيل صلاحيات المتجر فوراً.</span>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {selectedSub && selectedSub.status === 'pending_payment' && (
              <Button
                onClick={() => handleConfirmPayment(selectedSub.id)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                تأكيد الدفع والتفعيل
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
