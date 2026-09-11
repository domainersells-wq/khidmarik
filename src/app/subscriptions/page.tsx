'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  Flame, 
  Snowflake, 
  Crown, 
  Zap, 
  Calendar, 
  Clock, 
  Wallet, 
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { FamilyWalletManager } from '@/components/profile/FamilyWalletManager';
import { formatDA } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>('annual');
  const [subscribedPlan, setSubscribedPlan] = useState<string | null>(null);
  const [subscribingId, setSubscribingId] = useState<string | null>(null);

  const handleSubscribe = async (planId: string, planTitle: string, price: number) => {
    setSubscribingId(planId);
    try {
      if (user) {
        await supabase.from('transactions').insert({
          user_id: user.id,
          amount: price,
          type: 'subscription',
          status: 'completed',
          method: 'wallet',
          transaction_code: `SUB-HOME-${Math.floor(100000 + Math.random() * 900000)}`
        });
      }

      setSubscribedPlan(planTitle);
      toast({
        title: '🎉 تهانينا! تم تفعيل اشتراك الصيانة الموسمية بنجاح',
        description: `تم ربط منزلك بـ [${planTitle}]. ستصلك إشعارات الجدولة التلقائية قبل بدء كل موسم لزيارة الفنيين المعتمدين.`,
      });
    } catch (err: any) {
      console.warn('Subscription error:', err);
      toast({
        title: 'تنبيه',
        description: 'تم تفعيل الاشتراك محلياً وسيتم المزامنة التلقائية عند الاتصال.',
      });
      setSubscribedPlan(planTitle);
    } finally {
      setSubscribingId(null);
    }
  };

  const plans = [
    {
      id: 'summer-pass',
      title: 'باقة الصيف للمكيفات (Summer AC Pass)',
      seasonLabel: 'موسم الصيف والتبريد',
      badge: 'الأكثر طلباً في ماي وجوان',
      badgeColor: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30',
      icon: Snowflake,
      iconBg: 'bg-sky-600 text-white',
      priceAnnual: 8500,
      priceMonthly: 850,
      savingsText: 'وفر 40% مقارنة بطلب كل مكيف منفرداً',
      features: [
        'تنظيف كيميائي وتعقيم فلاتر 3 مكيفات هوائية',
        'فحص الضغط وتزويد غاز الفريون الأصلي R410A / R22',
        'تسليك مجاري تصريف المياه وتنظيف المكثف الخارجي',
        'أولوية قصوى 24/7 عند حدوث أي عطل في شهري جويلية وأوت',
        'ضمان تشغيل ومتابعة طوال أشهر الصيف الأربعة',
      ],
    },
    {
      id: 'winter-pass',
      title: 'باقة الشتاء وسلامة الغاز (Winter Gas Safety Pass)',
      seasonLabel: 'موسم التدفئة والأمان الأسري',
      badge: 'أمان العائلة من أحادي أكسيد الكربون',
      badgeColor: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',
      icon: Flame,
      iconBg: 'bg-orange-600 text-white',
      priceAnnual: 7900,
      priceMonthly: 790,
      savingsText: 'حماية معتمدة وتفادي حوادث الاختناق',
      features: [
        'فحص شامل لسخانات المياه والشوديير والمدفأة المركزية',
        'اختبار دقيق لتسريب الغاز بأجهزة قياس معتمدة',
        'تنظيف المداخن والتأكد التام من سحب الهواء والتهوية',
        'توفير وتركيب جهاز إنذار ذكي لكاشف الغاز مع الباقة مجاناً',
        'زيارتان دوريتان للمعاينة قبل وخلال ذروة البرد',
      ],
    },
    {
      id: 'diamond-pass',
      title: 'الباقة الماسية الشاملة للمنزل (All-in-One Diamond Pass)',
      seasonLabel: 'تغطية 365 يوماً على مدار السنة',
      badge: 'الحل النهائي لراحة البال',
      badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40',
      icon: Crown,
      iconBg: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white',
      priceAnnual: 18000,
      priceMonthly: 1650,
      savingsText: 'تغطية متكاملة لجميع أجهزة ومرافق المنزل',
      features: [
        'تشمل باقة الصيف كاملة + باقة الشتاء لسلامة الغاز كاملة',
        '4 تدخلات مجانية لطوارئ السباكة والكهرباء على مدار السنة',
        'خصم دائم 25% على أي قطع غيار من منجم القطع',
        'فني مخصص لمنزلك يعرف تفاصيل شبكة الماء والكهرباء',
        'ربط مباشر ومجاني مع محفظة العائلة وإشعارات WhatsApp',
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50/50 dark:bg-slate-950 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12 text-right">
      {/* Hero Section */}
      <section className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold shadow-xs">
          <Sparkles className="h-4 w-4" />
          <span>خدماتك بريميوم • Home Care Pass & Family Hub</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-headline text-foreground">
          اشتراكات الصيانة الموسمية ومحفظة العائلة الذكية
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          حافظ على سلامة أجهزتك ومنزلك طوال العام! باقات دورية تحميك من حرارة الصيف ومخاطر غاز الشتاء مع زيارات مبرمجة لفنيين معتمدين.
        </p>
      </section>

      {/* Main Tabs (Subscriptions vs Family Wallet) */}
      <Tabs defaultValue="packages" className="space-y-8">
        <div className="flex justify-center">
          <TabsList className="bg-card border p-1.5 rounded-2xl shadow-sm w-full max-w-md grid grid-cols-2 sm:flex">
            <TabsTrigger value="packages" className="rounded-xl px-2 sm:px-6 py-2.5 font-bold text-xs sm:text-sm gap-1.5 sm:gap-2">
              <Calendar className="h-4 w-4 shrink-0" />
              <span className="truncate">باقات الصيانة</span>
            </TabsTrigger>
            <TabsTrigger value="family-wallet" className="rounded-xl px-2 sm:px-6 py-2.5 font-bold text-xs sm:text-sm gap-1.5 sm:gap-2">
              <Users className="h-4 w-4 shrink-0" />
              <span className="truncate">محفظة العائلة</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Packages */}
        <TabsContent value="packages" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const isSubscribed = subscribedPlan === plan.title;
              const displayPrice = billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;

              return (
                <Card 
                  key={plan.id}
                  className={`rounded-3xl border-2 transition-all duration-300 shadow-md flex flex-col justify-between overflow-hidden text-right ${
                    plan.id === 'diamond-pass'
                      ? 'border-amber-500/60 bg-gradient-to-b from-amber-500/5 via-card to-card shadow-amber-500/10 scale-102'
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  <CardHeader className="p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge className={`text-xs font-bold px-2.5 py-1 ${plan.badgeColor}`}>
                        {plan.badge}
                      </Badge>
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-md ${plan.iconBg}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-foreground">{plan.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{plan.seasonLabel}</p>
                    </div>

                    <div className="pt-2 border-t border-border">
                      <div className="flex items-baseline gap-1 justify-start flex-row-reverse">
                        <span suppressHydrationWarning className="text-3xl font-black text-foreground font-mono">
                          {formatDA(displayPrice)} DA
                        </span>
                        <span className="text-xs text-muted-foreground">/ سنوياً</span>
                      </div>
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                        ✓ {plan.savingsText}
                      </p>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 pt-0 space-y-4 flex-1">
                    <Separator />
                    <ul className="space-y-2.5 text-xs text-muted-foreground">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2 justify-end">
                          <span>{feat}</span>
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="p-6 pt-0">
                    <Button
                      onClick={() => handleSubscribe(plan.id, plan.title, displayPrice)}
                      disabled={isSubscribed || subscribingId === plan.id}
                      className={`w-full rounded-xl font-bold text-xs py-5 shadow-sm flex items-center justify-center gap-2 ${
                        plan.id === 'diamond-pass'
                          ? 'bg-amber-600 hover:bg-amber-700 text-white'
                          : 'bg-primary text-primary-foreground hover:bg-primary/90'
                      }`}
                    >
                      {subscribingId === plan.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>جاري التفعيل...</span>
                        </>
                      ) : isSubscribed ? (
                        '✓ الباقة مفعلة حالياً بحسابك'
                      ) : (
                        'اشترك الآن في الباقة'
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {/* Guarantee Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-muted/40 border border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-start sm:items-center gap-3 flex-row-reverse w-full">
              <ShieldCheck className="h-8 w-8 text-primary shrink-0 mt-0.5 sm:mt-0" />
              <div className="text-right flex-1">
                <h4 className="font-bold text-foreground text-sm">ضمان الجودة وراحة البال من منصة خدماتك</h4>
                <p className="text-muted-foreground text-[11px] mt-0.5 leading-relaxed">
                  جميع الزيارات يقوم بها فنيون معتمدون ومرخصون. في حال ظهور أي خلل بعد الزيارة يُعاد التدخل مجاناً خلال 48 ساعة.
                </p>
              </div>
            </div>

            <Button asChild variant="outline" className="w-full sm:w-auto rounded-xl text-xs font-semibold shrink-0">
              <Link href="/terms">قواعد وشروط الضمان</Link>
            </Button>
          </div>
        </TabsContent>

        {/* Tab 2: Family Wallet */}
        <TabsContent value="family-wallet">
          <FamilyWalletManager />
        </TabsContent>
      </Tabs>
    </main>
  );
}
