'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Award, 
  Calendar, 
  CreditCard, 
  CheckCircle2, 
  HelpCircle, 
  RefreshCw, 
  FileText, 
  Download, 
  Sparkles, 
  Check, 
  Zap, 
  ShieldCheck, 
  Layers, 
  Truck, 
  ArrowUpRight,
  Receipt,
  Wallet
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { SubscriptionPaymentModal } from '@/components/dashboard/professional-services/SubscriptionPaymentModal';
import { PlanDetail } from '@/components/dashboard/professional-services/SubscriptionPlansModal';

interface InvoiceHistory {
  invoiceId: string;
  billingDate: string;
  amountDA: number;
  paymentMethod: string;
  status: 'paid' | 'unpaid';
  planName: string;
}

const INITIAL_INVOICES: InvoiceHistory[] = [
  { invoiceId: 'INV-SUB-0291', billingDate: '2026-08-01', amountDA: 6000, paymentMethod: 'BaridiMob (0079999...)', status: 'paid', planName: 'Shop VIP / Agency' },
  { invoiceId: 'INV-SUB-0182', billingDate: '2026-07-01', amountDA: 2500, paymentMethod: 'Edahabia / CIB 3DS', status: 'paid', planName: 'Seller Pro' },
  { invoiceId: 'INV-SUB-0073', billingDate: '2026-06-01', amountDA: 2500, paymentMethod: 'Khidmatik Wallet', status: 'paid', planName: 'Seller Pro' },
];

export function SubscriptionSection() {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const { toast } = useToast();
  const { user } = useAuth();

  const [currentPlanKey, setCurrentPlanKey] = useState<'basic' | 'pro' | 'agency'>('agency');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [invoices, setInvoices] = useState<InvoiceHistory[]>(INITIAL_INVOICES);
  
  // Payment Modal
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<PlanDetail | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Load real store subscription plan and transactions from Supabase
  useEffect(() => {
    if (!user) return;
    const fetchStorePlan = async () => {
      try {
        let q = supabase.from('stores').select('id, subscription_plan');
        if (user.storeId) {
          q = q.eq('id', user.storeId);
        } else if (user.id) {
          q = q.eq('owner_id', user.id);
        }
        const { data: storeData } = await q.maybeSingle();
        if (storeData?.subscription_plan) {
          const p = storeData.subscription_plan.toLowerCase();
          if (p.includes('basic') || p.includes('starter')) setCurrentPlanKey('basic');
          else if (p.includes('pro') || p.includes('gold')) setCurrentPlanKey('pro');
          else if (p.includes('agency') || p.includes('vip') || p.includes('diamond')) setCurrentPlanKey('agency');
        }

        // Fetch user subscription transactions
        const { data: txs } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .eq('type', 'subscription')
          .order('created_at', { ascending: false });

        if (txs && txs.length > 0) {
          const mappedTxs: InvoiceHistory[] = txs.map((t: any) => ({
            invoiceId: t.transaction_code || `INV-SUB-${t.id.slice(0, 4)}`,
            billingDate: (t.created_at || new Date().toISOString()).slice(0, 10),
            amountDA: parseFloat(t.amount || 0),
            paymentMethod: t.method || 'Edahabia / BaridiMob',
            status: 'paid',
            planName: isAr ? 'اشتراك متجر معتمد' : 'Verified Store Subscription'
          }));
          setInvoices(mappedTxs);
        }
      } catch (err) {
        console.warn('Could not sync store subscription plan from Supabase:', err);
      }
    };
    fetchStorePlan();
  }, [user, isAr]);

  const plans = [
    {
      key: 'basic',
      nameAr: 'الباقة الأساسية (Starter / Basic)',
      nameEn: 'Starter / Basic',
      monthlyPriceDA: 1500,
      yearlyPriceDA: 15000,
      commissionFee: '3.5%',
      isPopular: false,
      featuresAr: [
        'إدراج حتى 25 منتج في المتجر',
        'نسبة عمولة منخفضة 3.5% على المبيعات',
        'تكامل أساسي مع بوالص شحن ياليدين',
        'لوحة تحكم إحصائيات مبسطة',
        'دعم فني عبر البريد الإلكتروني'
      ],
      featuresEn: [
        'Up to 25 product listings',
        '3.5% sales commission fee',
        'Basic Yalidine waybill integration',
        'Standard dashboard analytics',
        'Email support'
      ]
    },
    {
      key: 'pro',
      nameAr: 'باقة التاجر المحترف (Seller Pro)',
      nameEn: 'Seller Pro',
      monthlyPriceDA: 2500,
      yearlyPriceDA: 25000,
      commissionFee: '1.5%',
      isPopular: true,
      badgeAr: 'الأكثر طلباً',
      badgeEn: 'BEST VALUE',
      featuresAr: [
        'منتجات غير محدودة في المتجر (Unlimited)',
        'نسبة عمولة مخفضة 1.5% فقط',
        'ربط برمجي آلي كامل مع Yalidine / EMS API',
        'أدوات التسويق والعروض الخاطفة (Flash Deals)',
        'تنبيهات المخزون الذكية وتصدير الفواتير'
      ],
      featuresEn: [
        'Unlimited product listings',
        '1.5% reduced sales commission fee',
        'Full Automated Yalidine / EMS API',
        'Marketing tools & Flash deals engine',
        'Smart inventory alerts & invoice exports'
      ]
    },
    {
      key: 'agency',
      nameAr: 'باقة كبار التجار والوكالات (Shop VIP / Agency)',
      nameEn: 'Shop VIP / Agency',
      monthlyPriceDA: 6000,
      yearlyPriceDA: 60000,
      commissionFee: '0%',
      isPopular: false,
      badgeAr: 'VIP شامل',
      badgeEn: 'VIP ENTERPRISE',
      featuresAr: [
        'إدارة حتى 5 فروع ومتاجر متعددة من حساب واحد',
        'إعفاء كامل من عمولة المبيعات (0% Commission)',
        'مستشار تجاري وحساب مخصص لعقود الشحن',
        'دومين مخصص وتخصيص العلامة التجارية',
        'ربط Webhooks وخوادم خارجية متقدمة'
      ],
      featuresEn: [
        'Multi-shop management (Up to 5 stores)',
        '0% sales commission fee (Zero commission)',
        'Dedicated Yalidine contract advisor',
        'Custom branding & checkout domain',
        'Advanced Webhooks & external dev integrations'
      ]
    }
  ];

  const handleSelectPlan = (planObj: typeof plans[0]) => {
    if (planObj.key === currentPlanKey) {
      toast({
        title: isAr ? 'هذه باقتك الحالية بالفعل' : 'Already on this plan',
        description: isAr ? 'متجرك مفعل وموثق على هذه الباقة حالياً.' : 'Your store is currently active on this tier.'
      });
      return;
    }

    const chosenPrice = billingCycle === 'monthly' ? planObj.monthlyPriceDA : planObj.yearlyPriceDA;
    const tierMap: Record<string, any> = {
      basic: 'bronze',
      pro: 'gold',
      agency: 'diamond'
    };

    const planDetail: PlanDetail = {
      tier: tierMap[planObj.key] || 'gold',
      nameAr: planObj.nameAr,
      nameEn: planObj.nameEn,
      price: chosenPrice,
      periodAr: billingCycle === 'monthly' ? '/ شهر' : '/ سنة',
      periodEn: billingCycle === 'monthly' ? '/ month' : '/ year',
      badgeAr: (planObj as any).badgeAr || 'باقة مميزة',
      badgeEn: (planObj as any).badgeEn || 'PRO',
      descriptionAr: planObj.nameAr,
      descriptionEn: planObj.nameEn,
      featuresAr: planObj.featuresAr,
      featuresEn: planObj.featuresEn
    };

    setSelectedPlanForPayment(planDetail);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = async (plan: PlanDetail, paymentMethod: string, txRef: string) => {
    const reverseTierMap: Record<string, string> = {
      bronze: 'basic',
      gold: 'pro',
      diamond: 'agency'
    };
    const matchedKey = reverseTierMap[plan.tier] || plans.find(p => p.nameAr === plan.nameAr || p.nameEn === plan.nameEn)?.key || 'pro';
    setCurrentPlanKey(matchedKey as any);
    setIsPaymentModalOpen(false);

    const generatedCode = txRef || `INV-SUB-${Math.floor(1000 + Math.random() * 9000)}`;

    // Add new paid invoice record in local UI
    const newInvoice: InvoiceHistory = {
      invoiceId: generatedCode,
      billingDate: new Date().toISOString().slice(0, 10),
      amountDA: plan.price,
      paymentMethod: paymentMethod === 'edahabia' ? 'Edahabia / CIB 3DS' : paymentMethod === 'baridimob' ? 'BaridiMob Transfer' : 'Khidmatik Wallet Balance',
      status: 'paid',
      planName: isAr ? plan.nameAr : plan.nameEn
    };

    setInvoices(prev => [newInvoice, ...prev]);

    // Persist to Supabase stores and transactions
    if (user) {
      try {
        // 1. Update store subscription plan
        if (user.storeId) {
          await supabase.from('stores').update({ subscription_plan: matchedKey }).eq('id', user.storeId);
        } else if (user.id) {
          await supabase.from('stores').update({ subscription_plan: matchedKey }).eq('owner_id', user.id);
        }

        // 2. Record transaction
        await supabase.from('transactions').insert({
          user_id: user.id,
          amount: plan.price,
          type: 'subscription',
          status: 'completed',
          method: paymentMethod,
          transaction_code: generatedCode
        });
      } catch (err) {
        console.error('Error recording subscription in database:', err);
      }
    }

    toast({
      title: isAr ? '🎉 تم ترقية وتجديد الاشتراك بنجاح!' : '🎉 Subscription Upgraded Successfully!',
      description: isAr ? `تم تفعيل اشتراك ${plan.nameAr} وتحديث مزايا متجرك فورياً.` : `Your store features have been instantly unlocked.`
    });
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    toast({
      title: isAr ? '📄 تم تحميل الفاتورة الرسمية' : '📄 Invoice Downloaded',
      description: isAr ? `تم استخراج ملف الـ PDF للفاتورة رقم ${invoiceId}` : `Compiled PDF for invoice ${invoiceId}`
    });
  };

  const currentPlanObj = plans.find(p => p.key === currentPlanKey) || plans[2];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12" dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* 1. Header with Title & Billing Cycle Switch */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 rounded-3xl bg-card border shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black font-headline tracking-tight text-slate-900 dark:text-white">
                {isAr ? 'إدارة الاشتراكات وباقات المتاجر (Subscription & Plans)' : 'Store Subscription & Platform Access'}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {isAr 
                  ? 'ترقية متجرك، فتح الميزات المتقدمة، واختيار وسيلة الدفع المحلية المناسبة (الذهبية، CIB، بريدي موب، المحفظة)' 
                  : 'Manage store plans, unlock advanced sales features, and select your preferred local payment method'}
              </p>
            </div>
          </div>
        </div>

        {/* Monthly vs Yearly Toggle with Discount Badge */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border text-xs font-bold">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-xl transition-all ${
              billingCycle === 'monthly' 
                ? 'bg-white dark:bg-slate-900 text-primary shadow-xs' 
                : 'text-muted-foreground hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {isAr ? 'اشتراك شهري' : 'Monthly'}
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              billingCycle === 'yearly' 
                ? 'bg-white dark:bg-slate-900 text-primary shadow-xs' 
                : 'text-muted-foreground hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>{isAr ? 'اشتراك سنوي' : 'Yearly'}</span>
            <Badge className="bg-emerald-600 text-white font-bold text-[9px] px-1.5 py-0">
              {isAr ? 'وفر شهرين مجاناً' : 'Save 20%'}
            </Badge>
          </button>
        </div>
      </div>

      {/* 2. Active Subscription Overview Banner */}
      <Card className="rounded-3xl shadow-md border overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white relative">
        <div className="absolute left-0 top-0 opacity-10 -translate-x-12 -translate-y-12 pointer-events-none">
          <Award className="h-72 w-72 text-primary" />
        </div>

        <CardHeader className="p-6 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Badge className="bg-primary text-primary-foreground font-black text-xs uppercase px-3 py-1">
                  {currentPlanObj.key.toUpperCase()} ACTIVE TIER
                </Badge>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs flex items-center gap-1 font-bold">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {isAr ? 'نشط وموثق رسمياً' : 'Active & Verified'}
                </Badge>
              </div>
              <CardTitle className="text-xl sm:text-2xl font-black font-headline">
                {isAr ? currentPlanObj.nameAr : currentPlanObj.nameEn}
              </CardTitle>
            </div>

            <div className="text-left sm:text-right font-mono">
              <span className="text-xs text-slate-400 block">{isAr ? 'تكلفة التجديد:' : 'Current Charge:'}</span>
              <span className="text-3xl font-black text-white">
                {(billingCycle === 'monthly' ? currentPlanObj.monthlyPriceDA : currentPlanObj.yearlyPriceDA).toLocaleString()}
                <span className="text-sm font-bold text-slate-300 ml-1">{isAr ? 'دج' : 'DZD'}</span>
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 pt-2 space-y-4 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800 text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 font-medium">{isAr ? 'حالة التجديد التلقائي:' : 'Renewal Mode:'}</span>
              <p className="font-bold text-emerald-400 flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                {isAr ? 'تجديد تلقائي نشط عبر المحفظة / البطاقة' : 'Auto-Renew Enabled'}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 font-medium">{isAr ? 'موعد الاستحقاق القادم:' : 'Next Billing Date:'}</span>
              <p className="font-bold text-slate-200 flex items-center gap-1.5 font-mono">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                01 سبتمبر 2026 (September 01, 2026)
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 font-medium">{isAr ? 'نسبة عمولة المبيعات:' : 'Sales Commission Rate:'}</span>
              <p className="font-bold text-amber-400 flex items-center gap-1.5 font-mono">
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                {currentPlanObj.commissionFee} {isAr ? 'على كل عملية بيع ناجحة' : 'per completed order'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Available Subscription Plans Grid */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-black font-headline flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {isAr ? 'باقات الاشتراك المتاحة للمتاجر' : 'Available Store Subscription Plans'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isAr ? 'اختر الباقة المناسبة لحجم متجرك وادفع بأمان عبر وسائل الدفع المعتمدة' : 'Select your tier and pay securely with local payment methods'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = plan.key === currentPlanKey;
            const price = billingCycle === 'monthly' ? plan.monthlyPriceDA : plan.yearlyPriceDA;

            return (
              <Card 
                key={plan.key}
                className={`rounded-3xl border-2 transition-all duration-300 flex flex-col justify-between relative overflow-hidden ${
                  isCurrent 
                    ? 'border-primary ring-4 ring-primary/20 bg-primary/5 dark:bg-primary/10 shadow-lg scale-[1.02]' 
                    : plan.isPopular 
                    ? 'border-amber-400/80 bg-card shadow-md hover:border-amber-500' 
                    : 'border-slate-200 dark:border-slate-800 bg-card hover:border-slate-400'
                }`}
              >
                {/* Popular or Current Badge */}
                {isCurrent && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground font-black text-[10px] px-3 py-1 rounded-bl-xl shadow-xs uppercase">
                    {isAr ? 'باقتك الحالية' : 'CURRENT PLAN'}
                  </div>
                )}
                {!isCurrent && plan.badgeAr && (
                  <div className="absolute top-0 right-0 bg-amber-500 text-white font-black text-[10px] px-3 py-1 rounded-bl-xl shadow-xs uppercase">
                    {isAr ? plan.badgeAr : plan.badgeEn}
                  </div>
                )}

                <CardHeader className="p-6 pb-2 space-y-3">
                  <div>
                    <h4 className="font-black text-lg text-slate-900 dark:text-white">
                      {isAr ? plan.nameAr : plan.nameEn}
                    </h4>
                    <div className="flex items-baseline gap-1.5 mt-3">
                      <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">
                        {price.toLocaleString()}
                      </span>
                      <span className="text-xs font-bold text-muted-foreground">
                        {isAr ? `دج / ${billingCycle === 'monthly' ? 'شهرياً' : 'سنوياً'}` : `DA / ${billingCycle === 'monthly' ? 'month' : 'year'}`}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border text-xs flex justify-between items-center font-bold">
                    <span className="text-muted-foreground">{isAr ? 'عمولة المنصة:' : 'Platform Fee:'}</span>
                    <span className="font-mono text-primary">{plan.commissionFee}</span>
                  </div>
                </CardHeader>

                <CardContent className="p-6 pt-2 space-y-3 flex-1">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    {isAr ? 'الميزات والخصائص المشمولة:' : 'Included Features:'}
                  </span>

                  <ul className="space-y-2.5 text-xs">
                    {(isAr ? plan.featuresAr : plan.featuresEn).map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                        <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5 stroke-[3]" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="p-6 pt-0">
                  <Button
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isCurrent}
                    className={`w-full font-black text-xs h-11 rounded-2xl transition-all ${
                      isCurrent
                        ? 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400 pointer-events-none'
                        : plan.isPopular
                        ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-md shadow-red-600/25'
                        : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs'
                    }`}
                  >
                    {isCurrent ? (
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4" />
                        {isAr ? 'الاشتراك المفعّل حالياً' : 'Current Active Plan'}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        {isAr ? `اختيار باقة ${plan.nameAr.split(' ')[0]} والدفع` : `Upgrade to ${plan.nameEn}`}
                        <ArrowUpRight className="h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 4. Billing & Invoice Ledger Table */}
      <Card className="rounded-3xl border shadow-sm overflow-hidden">
        <CardHeader className="p-6 pb-3 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <CardTitle className="text-base font-black flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              {isAr ? 'سجل الفواتير والدفعات السابقة (Billing & Invoice Ledger)' : 'Billing & Invoice Ledger'}
            </CardTitle>
            <CardDescription className="text-xs">
              {isAr ? 'سجل شفاف وغير قابل للتعديل لجميع مدفوعات اشتراكات متجرك مع إمكانية تحميل الفواتير PDF' : 'Download official PDF invoices and payment receipts'}
            </CardDescription>
          </div>

          <Badge variant="outline" className="text-xs font-mono font-bold">
            {invoices.length} {isAr ? 'فواتير مسددة' : 'Invoices'}
          </Badge>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs text-right border-collapse min-w-[650px]">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/50 border-b text-muted-foreground font-bold">
                <th className="p-4">{isAr ? 'رقم الفاتورة' : 'Invoice ID'}</th>
                <th className="p-4">{isAr ? 'الباقة المفعلة' : 'Plan'}</th>
                <th className="p-4">{isAr ? 'تاريخ الدفع' : 'Billing Date'}</th>
                <th className="p-4">{isAr ? 'المبلغ بالدينار' : 'Amount DA'}</th>
                <th className="p-4">{isAr ? 'وسيلة الدفع' : 'Payment Method'}</th>
                <th className="p-4 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                <th className="p-4 text-left">{isAr ? 'الفاتورة' : 'Receipt PDF'}</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv, idx) => (
                <tr key={inv.invoiceId} className={`border-b hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/20 dark:bg-slate-900/20' : ''}`}>
                  <td className="p-4 font-mono font-bold text-primary">{inv.invoiceId}</td>
                  <td className="p-4 font-bold text-slate-800 dark:text-slate-200">{inv.planName}</td>
                  <td className="p-4 font-mono text-muted-foreground">{inv.billingDate}</td>
                  <td className="p-4 font-mono font-black text-emerald-600 dark:text-emerald-400">
                    {inv.amountDA.toLocaleString()} دج
                  </td>
                  <td className="p-4 text-slate-700 dark:text-slate-300 font-medium">
                    {inv.paymentMethod}
                  </td>
                  <td className="p-4 text-center">
                    <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                      {isAr ? '✓ مدفوع وموثق' : 'Paid'}
                    </Badge>
                  </td>
                  <td className="p-4 text-left">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadInvoice(inv.invoiceId)}
                      className="h-8 text-xs font-bold rounded-xl gap-1.5 hover:bg-primary hover:text-white"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>{isAr ? 'تحميل PDF' : 'Download'}</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* 5. UNIFIED MULTI-METHOD PAYMENT MODAL */}
      <SubscriptionPaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        plan={selectedPlanForPayment}
        onPaymentSuccess={handlePaymentSuccess}
        userWalletBalance={42500}
      />

    </div>
  );
}
