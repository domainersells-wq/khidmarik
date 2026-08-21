'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Medal, 
  Award, 
  Crown, 
  Gem, 
  Sparkles, 
  Check, 
  Zap, 
  ArrowRight,
  Star,
  Layers,
  Palette,
  Eye,
  TrendingUp,
  CreditCard,
  Table
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { SubscriptionTier, TIER_THEMES } from '@/lib/subscriptionTheme';
import { SubscriptionPaymentModal } from './SubscriptionPaymentModal';
import { SubscriptionFeatureMatrix } from './SubscriptionFeatureMatrix';

interface SubscriptionPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: SubscriptionTier;
  onUpgrade: (newTier: SubscriptionTier, planName: string, price: number, paymentMethod?: string, txRef?: string) => void;
  highlightReason?: string;
  userWalletBalance?: number;
}

export interface PlanDetail {
  tier: SubscriptionTier;
  nameAr: string;
  nameEn: string;
  price: number;
  periodAr: string;
  periodEn: string;
  badgeAr: string;
  badgeEn: string;
  isPopular?: boolean;
  isVip?: boolean;
  descriptionAr: string;
  descriptionEn: string;
  featuresAr: string[];
  featuresEn: string[];
}

export const SUBSCRIPTION_PLANS: PlanDetail[] = [
  {
    tier: 'free',
    nameAr: 'الحساب المجاني',
    nameEn: 'Free Plan',
    price: 0,
    periodAr: 'مجاناً مدى الحياة',
    periodEn: 'Free Forever',
    badgeAr: 'الأساسي',
    badgeEn: 'Starter',
    descriptionAr: 'للبدء واستقبال طلبات العملاء الأساسية',
    descriptionEn: 'Basic profile to start receiving client inquiries',
    featuresAr: [
      'ملف شخصي أساسي ومجاني',
      'إدراج حتى 3 أعمال في المعرض',
      'استقبال رسائل وحجوزات العملاء',
      'إطار الصورة الكلاسيكي الدائري',
      '10% عمولة المنصة'
    ],
    featuresEn: [
      'Basic public profile',
      'Up to 3 portfolio items',
      'Receive client bookings & messages',
      'Standard circular avatar frame',
      '10% platform commission'
    ]
  },
  {
    tier: 'bronze',
    nameAr: 'الباقة البرونزية',
    nameEn: 'Bronze Plan',
    price: 2500,
    periodAr: 'شهرياً',
    periodEn: '/ month',
    badgeAr: 'للمبتدئين',
    badgeEn: 'Starter Plus',
    descriptionAr: 'لإبراز خدماتك برابط موقعك وشارة التوثيق البرونزية',
    descriptionEn: 'Showcase your website link and bronze badge',
    featuresAr: [
      'جميع ميزات الحساب المجاني',
      'إضافة رابط موقعك الشخصي',
      'معرض أعمال حتى 5 مشاريع',
      'شارة برونزية معتمدة على البروفيل',
      '8% عمولة المنصة'
    ],
    featuresEn: [
      'All Free features included',
      'Add personal website link',
      'Up to 5 portfolio items',
      'Verified Bronze badge on profile',
      '8% platform commission'
    ]
  },
  {
    tier: 'silver',
    nameAr: 'الباقة الفضية',
    nameEn: 'Silver Plan',
    price: 5000,
    periodAr: 'شهرياً',
    periodEn: '/ month',
    badgeAr: 'نمو سريع',
    badgeEn: 'Fast Growth',
    descriptionAr: 'لزيادة التفاعل عبر روابط التواصل ونظام الكوبونات',
    descriptionEn: 'Boost engagement with social links & coupon builder',
    featuresAr: [
      'جميع ميزات الباقة البرونزية',
      'إضافة رابط LinkedIn والموقع',
      'نظام إنشاء كوبونات الخصم والعروض (Promo Coupons)',
      'معرض أعمال حتى 8 مشاريع عالية الدقة',
      'شارة فضية مميزة (Silver Badge)',
      '5% عمولة المنصة'
    ],
    featuresEn: [
      'All Bronze features included',
      'Add LinkedIn & website links',
      'Create promotional coupon codes',
      'Up to 8 high-res portfolio projects',
      'Distinguished Silver badge',
      '5% platform commission'
    ]
  },
  {
    tier: 'gold',
    nameAr: 'الباقة الذهبية',
    nameEn: 'Gold Plan',
    price: 9500,
    periodAr: 'شهرياً',
    periodEn: '/ month',
    badgeAr: 'الأكثر شعبية ⭐',
    badgeEn: 'Most Popular ⭐',
    isPopular: true,
    descriptionAr: 'لأصحاب الأعمال الراغبين في تصدر نتائج البحث وأدوات الـ AI',
    descriptionEn: 'Top search rank, AI SEO generator & review responses',
    featuresAr: [
      'جميع ميزات الباقة الفضية',
      'توليد الكلمات المفتاحية بالذكاء الاصطناعي (AI SEO Generator)',
      'الرد على تقييمات ومراجعات العملاء العامة',
      'إطار ذهبي متوهج ولامع (Golden Shine)',
      'أولوية متقدمة في نتائج البحث (75%)',
      'معرض أعمال حتى 15 مشروعاً',
      '3% عمولة مخفضة'
    ],
    featuresEn: [
      'All Silver features included',
      'AI SEO & Keywords Generator',
      'Reply to customer reviews & feedback',
      'Golden shine card & avatar frame',
      'Priority rank in local search results (75%)',
      'Up to 15 portfolio showcase items',
      '3% reduced commission'
    ]
  },
  {
    tier: 'platinum',
    nameAr: 'الباقة البلاتينية',
    nameEn: 'Platinum Plan',
    price: 16000,
    periodAr: 'شهرياً',
    periodEn: '/ month',
    badgeAr: 'للمحترفين 💎',
    badgeEn: 'Pro Choice 💎',
    descriptionAr: 'تخصيص كامل للهوية البصرية وغلاف البروفيل المخصص',
    descriptionEn: 'Full branding customisation, custom cover & shapes',
    featuresAr: [
      'جميع ميزات الباقة الذهبية',
      'تخصيص الهوية البصرية واللون الرئيسي للمتجر (Custom Branding)',
      'أشكال إطار البروفيل الفاخرة (مربع زوايا دائرية، سداسي Hexagon)',
      'رفع غلاف بروفيل مخصص (Custom Cover Banner)',
      'إضافة جميع الروابط الخارجية (Behance, GitHub, Dribbble)',
      'معرض أعمال غير محدود بملفات وتصاميم متعددة',
      '1.5% عمولة رمزية'
    ],
    featuresEn: [
      'All Gold features included',
      'Custom Branding & Theme Color Palette',
      'Avatar frame shapes (Hexagon, Rounded Sq)',
      'Upload high-res Custom Cover Banner',
      'Unlimited external portfolio links',
      'Unlimited portfolio items & media',
      '1.5% low commission'
    ]
  },
  {
    tier: 'diamond',
    nameAr: 'الباقة الماسية',
    nameEn: 'Diamond Plan',
    price: 25000,
    periodAr: 'شهرياً',
    periodEn: '/ month',
    badgeAr: 'VIP النخبة 👑',
    badgeEn: 'VIP Elite 👑',
    isVip: true,
    descriptionAr: 'أقصى درجات التميز وتأثير الحدود المتوهجة ودعم VIP',
    descriptionEn: 'Ultimate tier with dynamic sweep borders & VIP support',
    featuresAr: [
      'جميع ميزات الباقة البلاتينية بلا استثناء',
      'تأثير الحدود المتدفقة الفاخرة (Dynamic Border Sweep)',
      'توهج ماسي أزرق سماوي مع شارة VIP في الصفحة الرئيسية',
      'أولوية قصوى 100% في دليل الحرفيين والمتاجر',
      'دعم فني واستشاري مخصص على مدار الساعة 24/7',
      '0% رسوم عمولة نهائياً على جميع الصفقات'
    ],
    featuresEn: [
      'All Platinum features without limits',
      'Dynamic luxury Border Sweep animation',
      'Diamond glow & VIP homepage badge',
      '100% top priority placement in directory',
      'Dedicated 24/7 VIP account manager',
      '0% platform transaction fees'
    ]
  }
];

export function SubscriptionPlansModal({
  isOpen,
  onClose,
  currentTier,
  onUpgrade,
  highlightReason,
  userWalletBalance = 35000
}: SubscriptionPlansModalProps) {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<PlanDetail | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [viewTab, setViewTab] = useState<'cards' | 'matrix'>('cards');

  const TierIcons: Record<SubscriptionTier, any> = {
    free: Shield,
    bronze: Medal,
    silver: Award,
    gold: Crown,
    platinum: Gem,
    diamond: Sparkles,
  };

  const handleSelectPlan = (plan: PlanDetail) => {
    if (plan.price === 0) {
      onUpgrade('free', isAr ? plan.nameAr : plan.nameEn, 0);
      onClose();
      return;
    }
    setSelectedPlanForPayment(plan);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (plan: PlanDetail, paymentMethod: string, txRef: string) => {
    setIsPaymentModalOpen(false);
    onUpgrade(plan.tier, isAr ? plan.nameAr : plan.nameEn, plan.price, paymentMethod, txRef);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-6xl max-h-[92vh] overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950 border">
          <DialogHeader className="text-center pb-2">
            <div className="mx-auto h-12 w-12 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center mb-2 shadow-md">
              <Sparkles className="h-6 w-6 text-white animate-pulse" />
            </div>
            <DialogTitle className="text-2xl sm:text-3xl font-black font-headline text-slate-900 dark:text-white">
              {isAr ? 'اختر باقة الاشتراك المناسبة لنشاطك' : 'Choose Your Subscription Plan'}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              {highlightReason || (isAr 
                ? 'قم باختيار باقتك وسداد قيمة الاشتراك عبر وسائل الدفع المعتمدة لفتح الميزات المقفلة فوراً!' 
                : 'Select a plan and proceed to secure checkout to unlock locked features instantly!')}
            </DialogDescription>
          </DialogHeader>

          {/* View Switcher Tabs */}
          <Tabs value={viewTab} onValueChange={(v) => setViewTab(v as any)} className="w-full mt-2">
            <div className="flex justify-center mb-4">
              <TabsList className="grid grid-cols-2 w-full max-w-md bg-slate-200/80 dark:bg-slate-800">
                <TabsTrigger value="cards" className="text-xs font-bold flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5" />
                  {isAr ? 'بطاقات الباقات والأسعار' : 'Pricing Cards'}
                </TabsTrigger>
                <TabsTrigger value="matrix" className="text-xs font-bold flex items-center gap-1.5">
                  <Table className="h-3.5 w-3.5" />
                  {isAr ? 'جدول مقارنة وتقسيم الميزات' : 'Feature Comparison Matrix'}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* View 1: Pricing Cards */}
            <TabsContent value="cards" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
                {SUBSCRIPTION_PLANS.map((plan) => {
                  const isCurrent = currentTier === plan.tier;
                  const Icon = TierIcons[plan.tier];
                  const theme = TIER_THEMES[plan.tier];

                  return (
                    <div
                      key={plan.tier}
                      className={`relative flex flex-col justify-between rounded-2xl p-6 bg-white dark:bg-slate-900 border-2 transition-all duration-300 shadow-sm hover:shadow-xl ${
                        plan.isPopular 
                          ? 'border-amber-500 ring-2 ring-amber-500/20' 
                          : plan.isVip 
                          ? 'border-cyan-500 ring-2 ring-cyan-500/20' 
                          : isCurrent
                          ? 'border-emerald-500'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {/* Ribbon Tag */}
                      {(plan.isPopular || plan.isVip || isCurrent) && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <Badge 
                            className={`px-3 py-1 text-xs font-bold shadow-sm ${
                              isCurrent 
                                ? 'bg-emerald-600 text-white' 
                                : plan.isPopular 
                                ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white' 
                                : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                            }`}
                          >
                            {isCurrent ? (isAr ? '✓ باقتك الحالية' : '✓ Current Plan') : (isAr ? plan.badgeAr : plan.badgeEn)}
                          </Badge>
                        </div>
                      )}

                      <div>
                        {/* Tier Header */}
                        <div className="flex items-center justify-between gap-2 mt-1 mb-3">
                          <div className="flex items-center gap-2">
                            <div 
                              className="h-9 w-9 rounded-lg flex items-center justify-center shadow-inner"
                              style={{ backgroundColor: `${theme.accentColor}20`, color: theme.accentColor }}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                              {isAr ? plan.nameAr : plan.nameEn}
                            </h3>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground mb-4 min-h-[32px]">
                          {isAr ? plan.descriptionAr : plan.descriptionEn}
                        </p>

                        {/* Price Block */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3.5 mb-4 text-center border border-slate-100 dark:border-slate-800">
                          <div className="flex items-baseline justify-center gap-1">
                            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                              {plan.price.toLocaleString()}
                            </span>
                            <span className="text-sm font-bold text-primary">دج (DA)</span>
                          </div>
                          <span className="text-xs text-muted-foreground font-medium">
                            {isAr ? plan.periodAr : plan.periodEn}
                          </span>
                        </div>

                        {/* Features List */}
                        <div className="space-y-2.5 mb-6">
                          {(isAr ? plan.featuresAr : plan.featuresEn).map((feat, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                              <div 
                                className="h-4 w-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                                style={{ backgroundColor: `${theme.accentColor}25`, color: theme.accentColor }}
                              >
                                <Check className="h-2.5 w-2.5 stroke-[3]" />
                              </div>
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action Button */}
                      <div>
                        <Button
                          className={`w-full font-bold text-sm py-2.5 h-11 transition-all ${
                            isCurrent
                              ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-100 cursor-default'
                              : plan.isPopular
                              ? 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white shadow-md shadow-amber-500/20'
                              : plan.isVip
                              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-md shadow-cyan-500/20'
                              : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                          }`}
                          disabled={isCurrent}
                          onClick={() => handleSelectPlan(plan)}
                        >
                          {isCurrent ? (
                            isAr ? 'الباقة النشطة حالياً' : 'Active Plan'
                          ) : plan.price === 0 ? (
                            isAr ? 'التحويل للمجانية' : 'Switch to Free'
                          ) : (
                            <span className="flex items-center justify-center gap-1.5">
                              <CreditCard className="h-4 w-4" />
                              {isAr ? `اختيار والدفع (${plan.price.toLocaleString()} دج)` : `Choose & Pay (${plan.price.toLocaleString()} DA)`}
                              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                            </span>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            {/* View 2: Detailed Feature Comparison Matrix */}
            <TabsContent value="matrix" className="mt-0 pt-2">
              <SubscriptionFeatureMatrix 
                currentTier={currentTier}
                onSelectPlan={(plan) => handleSelectPlan(plan)}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Payment Gateway Modal */}
      <SubscriptionPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        plan={selectedPlanForPayment}
        onPaymentSuccess={handlePaymentSuccess}
        userWalletBalance={userWalletBalance}
      />
    </>
  );
}
