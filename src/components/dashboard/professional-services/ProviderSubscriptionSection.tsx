'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  CreditCard, 
  ShieldCheck, 
  Sparkles, 
  Check, 
  Calendar, 
  ArrowUpRight, 
  Crown, 
  Gem, 
  Award, 
  Medal, 
  Shield,
  Layers,
  Zap,
  FileText,
  Download,
  History
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { SubscriptionTier, TIER_THEMES } from '@/lib/subscriptionTheme';
import { SubscriptionPlansModal, SUBSCRIPTION_PLANS, PlanDetail } from './SubscriptionPlansModal';
import { SubscriptionPaymentModal } from './SubscriptionPaymentModal';
import { SubscriptionFeatureMatrix } from './SubscriptionFeatureMatrix';

interface InvoiceRecord {
  id: string;
  planName: string;
  amountDA: number;
  date: string;
  method: string;
  txRef: string;
  status: 'paid' | 'pending';
}

export function ProviderSubscriptionSection() {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const { toast } = useToast();

  const [currentTier, setCurrentTier] = useState<SubscriptionTier>('platinum');
  const [renewsOn, setRenewsOn] = useState('2026-09-20');
  const [isPlansModalOpen, setIsPlansModalOpen] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<PlanDetail | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(35000);

  const [invoices, setInvoices] = useState<InvoiceRecord[]>([
    { id: 'INV-2026-0819', planName: 'الباقة البلاتينية (Platinum)', amountDA: 16000, date: '2026-08-20', method: 'BaridiMob', txRef: 'BM-892341', status: 'paid' },
    { id: 'INV-2026-0715', planName: 'الباقة الذهبية (Gold)', amountDA: 9500, date: '2026-07-20', method: 'Edahabia Card', txRef: 'SATIM-CIB-452109', status: 'paid' },
  ]);

  const activeTheme = TIER_THEMES[currentTier];
  const activePlan = SUBSCRIPTION_PLANS.find(p => p.tier === currentTier) || SUBSCRIPTION_PLANS[0];

  const TierIcons: Record<SubscriptionTier, any> = {
    free: Shield,
    bronze: Medal,
    silver: Award,
    gold: Crown,
    platinum: Gem,
    diamond: Sparkles,
  };
  const ActiveIcon = TierIcons[currentTier];

  const handlePlanSelected = (plan: PlanDetail) => {
    if (plan.price === 0) {
      setCurrentTier('free');
      toast({
        title: isAr ? 'تم التحويل للباقة المجانية' : 'Switched to Free Plan',
        description: isAr ? 'أنت الآن على الحساب الأساسي المجاني.' : 'You are now on the Free starter tier.'
      });
      return;
    }
    setSelectedPlanForPayment(plan);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (plan: PlanDetail, paymentMethod: string, txRef: string) => {
    setCurrentTier(plan.tier);
    setIsPaymentModalOpen(false);
    setIsPlansModalOpen(false);

    if (paymentMethod === 'wallet') {
      setWalletBalance(prev => Math.max(0, prev - plan.price));
    }

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 30);
    setRenewsOn(nextDate.toISOString().split('T')[0]);

    // Add invoice record
    const newInvoice: InvoiceRecord = {
      id: `INV-${Date.now().toString().slice(-6)}`,
      planName: isAr ? plan.nameAr : plan.nameEn,
      amountDA: plan.price,
      date: new Date().toISOString().split('T')[0],
      method: paymentMethod === 'edahabia' ? 'Edahabia Card' : (paymentMethod === 'baridimob' ? 'BaridiMob' : (paymentMethod === 'wallet' ? 'Escrow Wallet' : 'CCP Transfer')),
      txRef: txRef,
      status: 'paid'
    };
    setInvoices(prev => [newInvoice, ...prev]);

    toast({
      title: isAr ? '🎉 تم تأكيد الدفع وتفعيل الباقة بنجاح!' : '🎉 Plan Upgraded Successfully!',
      description: isAr 
        ? `أنت الآن على ${plan.nameAr}. تم فتح جميع الميزات الخاصة بهذه الباقة بنجاح!` 
        : `You are now on ${plan.nameEn}. All tier features unlocked!`,
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-primary" />
            {isAr ? 'إدارة الاشتراكات والدفع والباقات' : 'Subscriptions & Payments'}
          </h1>
          <p className="text-muted-foreground">
            {isAr ? 'عرض باقتك الحالية، سداد الاشتراكات بمختلف الطرق المعتمدة، وتتبع سجل الفواتير والميزات المتاحة.' : 'Manage your current plan, make payments via multiple methods, and review features.'}
          </p>
        </div>
        <Button 
          onClick={() => setIsPlansModalOpen(true)}
          className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-bold shadow-md"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {isAr ? 'استعراض وترقية الباقات' : 'Explore All Plans'}
        </Button>
      </header>

      {/* Current Active Plan Overview Card */}
      <Card className="border-2 shadow-sm relative overflow-hidden" style={{ borderColor: activeTheme.accentColor }}>
        <div 
          className="h-3 w-full"
          style={{ background: activeTheme.coverGradient }}
        />
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4">
          <div className="flex items-center gap-3">
            <div 
              className="h-12 w-12 rounded-xl flex items-center justify-center shadow-md"
              style={{ backgroundColor: `${activeTheme.accentColor}20`, color: activeTheme.accentColor }}
            >
              <ActiveIcon className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl font-bold">
                  {isAr ? activePlan.nameAr : activePlan.nameEn}
                </CardTitle>
                <Badge 
                  className="px-2.5 py-0.5 text-xs font-bold"
                  style={{ backgroundColor: activeTheme.accentColor, color: '#fff' }}
                >
                  {isAr ? '✓ مدفوع ونشط' : '✓ Paid & Active'}
                </Badge>
              </div>
              <CardDescription className="mt-1">
                {isAr ? activePlan.descriptionAr : activePlan.descriptionEn}
              </CardDescription>
            </div>
          </div>

          <div className="text-right mt-4 sm:mt-0">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {activePlan.price.toLocaleString()} <span className="text-sm font-normal text-primary">دج (DA)</span>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 justify-end">
              <Calendar className="h-3.5 w-3.5" />
              {isAr ? `تاريخ التجديد القادم: ${renewsOn}` : `Next renewal: ${renewsOn}`}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-2 border-t">
          <h4 className="text-xs font-bold uppercase text-muted-foreground mb-3 tracking-wider">
            {isAr ? 'الميزات المفتوحة والمفعلة في حسابك:' : 'Active Plan Benefits:'}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {(isAr ? activePlan.featuresAr : activePlan.featuresEn).map((feat, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                <div 
                  className="h-4 w-4 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${activeTheme.accentColor}25`, color: activeTheme.accentColor }}
                >
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </div>
                <span>{feat}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t">
            <Button 
              onClick={() => setIsPlansModalOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs"
            >
              <ArrowUpRight className="h-4 w-4 mr-1" />
              {isAr ? 'تغيير أو ترقية الباقة' : 'Change or Upgrade Plan'}
            </Button>
            <Button 
              variant="outline" 
              className="text-xs"
              onClick={() => toast({ title: isAr ? 'رصيد محفظتك الحالي' : 'Current Wallet Balance', description: `${walletBalance.toLocaleString()} DA` })}
            >
              <CreditCard className="h-3.5 w-3.5 mr-1" />
              {isAr ? `رصيد المحفظة: ${walletBalance.toLocaleString()} دج` : `Wallet: ${walletBalance.toLocaleString()} DA`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feature Comparison Matrix Section */}
      <div>
        <SubscriptionFeatureMatrix
          currentTier={currentTier}
          onSelectPlan={handlePlanSelected}
        />
      </div>

      {/* Invoices & Billing Records */}
      <Card className="shadow-sm border">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              {isAr ? 'سجل الفواتير وعمليات الدفع' : 'Billing & Payment Receipts'}
            </CardTitle>
            <CardDescription className="text-xs">
              {isAr ? 'تتبع اشتراكاتك السابقة ووصولات الدفع الإلكتروني' : 'Track your previous subscription payments and invoices'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                <TableHead className="font-bold text-xs">{isAr ? 'رقم الفاتورة' : 'Invoice ID'}</TableHead>
                <TableHead className="font-bold text-xs">{isAr ? 'الباقة' : 'Plan'}</TableHead>
                <TableHead className="font-bold text-xs">{isAr ? 'المبلغ' : 'Amount'}</TableHead>
                <TableHead className="font-bold text-xs">{isAr ? 'طريقة الدفع' : 'Payment Method'}</TableHead>
                <TableHead className="font-bold text-xs">{isAr ? 'المرجع / Tx Ref' : 'Tx Reference'}</TableHead>
                <TableHead className="font-bold text-xs">{isAr ? 'التاريخ' : 'Date'}</TableHead>
                <TableHead className="font-bold text-xs text-center">{isAr ? 'الحالة' : 'Status'}</TableHead>
                <TableHead className="font-bold text-xs text-right">{isAr ? 'تحميل' : 'Receipt'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id} className="text-xs">
                  <TableCell className="font-mono font-bold">{inv.id}</TableCell>
                  <TableCell className="font-medium">{inv.planName}</TableCell>
                  <TableCell className="font-mono font-bold text-primary">{inv.amountDA.toLocaleString()} دج</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {inv.method}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground text-[11px]">{inv.txRef}</TableCell>
                  <TableCell className="text-muted-foreground">{inv.date}</TableCell>
                  <TableCell className="text-center">
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 text-[10px] border-emerald-300">
                      ✓ {isAr ? 'مدفوع ومؤكد' : 'Paid'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 px-2 text-xs" 
                      onClick={() => toast({ title: isAr ? 'تم تحميل الفاتورة' : 'Invoice Downloaded', description: `${inv.id}.pdf` })}
                    >
                      <Download className="h-3.5 w-3.5 mr-1" />
                      PDF
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Subscription Plans Selection Modal */}
      <SubscriptionPlansModal
        isOpen={isPlansModalOpen}
        onClose={() => setIsPlansModalOpen(false)}
        currentTier={currentTier}
        onUpgrade={(tier, name, price) => {
          const plan = SUBSCRIPTION_PLANS.find(p => p.tier === tier);
          if (plan) handlePlanSelected(plan);
        }}
        userWalletBalance={walletBalance}
      />

      {/* Direct Payment Checkout Modal */}
      <SubscriptionPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        plan={selectedPlanForPayment}
        onPaymentSuccess={handlePaymentSuccess}
        userWalletBalance={walletBalance}
      />
    </div>
  );
}
