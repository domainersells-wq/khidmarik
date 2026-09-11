'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Wrench, 
  Store, 
  Laptop, 
  Cog, 
  Building2, 
  Truck, 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Zap,
  ShoppingBag,
  Car,
  Calendar,
  Users
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

export function SuperAppSectorsHub() {
  const { language, translate } = useLanguage();
  const isRtl = language === 'ar';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const sectors = [
    {
      id: 'craftsmen',
      title: isRtl ? 'الحرفيون وخدمات الطوارئ' : 'Emergency Craftsmen & SOS',
      subtitle: isRtl ? 'سباكة، كهرباء، تكييف وإصلاح فوري مع ضمان OTP الميداني' : 'Plumbing, electricity, AC & repairs across 58 wilayas',
      href: '/craftsmen-dispatch',
      badge: isRtl ? 'خدمة طارئة SOS' : 'Emergency SOS',
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
      icon: Wrench,
      accentColor: 'from-amber-500/20 to-orange-500/5',
      iconBg: 'bg-amber-500 text-white',
      countText: isRtl ? 'متاح 24/7' : 'Available 24/7'
    },
    {
      id: 'marketplace',
      title: isRtl ? 'السوق والمتاجر المتعددة' : 'E-Commerce & Multi-Vendor',
      subtitle: isRtl ? 'آلاف المتاجر الجزائرية، أجهزة، إلكترونيات ومنتجات محلية' : 'Shop local stores, tech, gadgets & Algerian made products',
      href: '/marketplace',
      badge: isRtl ? 'توصيل 58 ولاية' : '58 Wilayas Delivery',
      badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
      icon: ShoppingBag,
      accentColor: 'from-blue-500/20 to-indigo-500/5',
      iconBg: 'bg-blue-600 text-white',
      countText: isRtl ? '+10,000 منتج' : '+10,000 Products'
    },
    {
      id: 'digital',
      title: isRtl ? 'الخدمات الرقمية والوساطة' : 'Digital Services & Escrow',
      subtitle: isRtl ? 'برمجة، تصميم، تسويق واستشارات مع حماية الدفع المالي' : 'Freelance pros, design, dev & guaranteed financial escrow',
      href: '/digital-services',
      badge: isRtl ? 'وساطة مالية محمية' : 'Escrow Protected',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      icon: Laptop,
      accentColor: 'from-emerald-500/20 to-teal-500/5',
      iconBg: 'bg-emerald-600 text-white',
      countText: isRtl ? 'دفع آمن 100%' : '100% Secure'
    },
    {
      id: 'parts-mine',
      title: isRtl ? 'منجم قطع الغيار' : 'The Parts Mine',
      subtitle: isRtl ? 'قطع غيار أصلية ومستعملة للسيارات والأجهزة برقم القطعة' : 'Authentic auto & appliance parts search by OEM number',
      href: '/parts-mine',
      badge: isRtl ? 'بحث ذكي بالـ OEM' : 'OEM Search',
      badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
      icon: Cog,
      accentColor: 'from-rose-500/20 to-red-500/5',
      iconBg: 'bg-rose-600 text-white',
      countText: isRtl ? 'سيارات ومعدات' : 'Auto & Devices'
    },
    {
      id: 'banquet-halls',
      title: isRtl ? 'قاعات الحفلات والأعراس' : 'Banquet Halls & Venues',
      subtitle: isRtl ? 'حجز قاعات الأفراح، المؤتمرات، والمناسبات مع معاينة تفاعلية' : 'Wedding venues, halls & event centers booking across Algeria',
      href: '/banquet-halls',
      badge: isRtl ? 'حجز واستعلام مباشر' : 'Instant Inquiries',
      badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
      icon: Building2,
      accentColor: 'from-purple-500/20 to-violet-500/5',
      iconBg: 'bg-purple-600 text-white',
      countText: isRtl ? 'تغطية وطنية' : 'Nationwide'
    },
    {
      id: 'tracking',
      title: isRtl ? 'تتبع الشحنات والأسطول الحي' : 'Live Logistics Tracking',
      subtitle: isRtl ? 'تتبع فوري ومطابق مع ياليدين، زد آر، ومايسترو مع خريطة حية' : 'Real-time tracking for Yalidine, ZR Express & Maystro with live map',
      href: '/tracking',
      badge: isRtl ? 'تتبع لحظي دقيق' : 'Realtime Sync',
      badgeColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
      icon: Truck,
      accentColor: 'from-cyan-500/20 to-sky-500/5',
      iconBg: 'bg-cyan-600 text-white',
      countText: isRtl ? 'ربط لوجستي مباشر' : 'Live API Sync'
    },
    {
      id: 'subscriptions',
      title: isRtl ? 'اشتراكات الصيانة ومحفظة العائلة' : 'Home Care Pass & Family Hub',
      subtitle: isRtl ? 'باقات الصيف للمكيفات وباقات الشتاء وأمان الغاز مع محفظة أسرية مشتركة' : 'Seasonal AC & heating safety subscriptions plus family shared wallet',
      href: '/subscriptions',
      badge: isRtl ? 'باقات دورية متكررة' : 'Seasonal Passes',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      icon: Calendar,
      accentColor: 'from-emerald-500/20 to-teal-500/5',
      iconBg: 'bg-emerald-600 text-white',
      countText: isRtl ? 'صيف وشتاء' : 'Year-Round'
    },
    {
      id: 'wholesale',
      title: isRtl ? 'سوق الجملة للخردوات B2B' : 'Craftsmen Wholesale Channel',
      subtitle: isRtl ? 'شراء النحاس، الأسلاك، ومواد الصيانة بأسعار الجملة مع توصيل فوري للورشة' : 'Direct wholesale prices on copper, cables & freon with on-site fast delivery',
      href: '/craftsmen-dispatch/wholesale',
      badge: isRtl ? 'خاص بالحرفيين -35%' : 'B2B Wholesale',
      badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
      icon: Building2,
      accentColor: 'from-blue-500/20 to-indigo-500/5',
      iconBg: 'bg-blue-700 text-white',
      countText: isRtl ? 'تسليم في 35 د' : '35 Min Delivery'
    },
  ];

  return (
    <section className="py-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-2">
            <Zap className="h-3.5 w-3.5" />
            <span>{isRtl ? 'منظومة خدماتك المترابطة' : 'Khidmatik Ecosystem'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-headline text-foreground">
            {isRtl ? 'قطاعات المنصة الرئيسية' : 'Explore Platform Sectors'}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {isRtl 
              ? 'كل ما تحتاجه في تطبيق واحد متكامل يربط بين الحرفيين، المتاجر، الخدمات واللوجستيات' 
              : 'Everything you need in one connected super-app spanning services, retail & logistics'}
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <Link 
            href="/listings" 
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1.5"
          >
            <span>{isRtl ? 'عرض الدليل الكامل' : 'View Full Directory'}</span>
            <ArrowIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sectors.map((sec) => {
          const Icon = sec.icon;
          return (
            <Link
              key={sec.id}
              href={sec.href}
              className="group relative rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm hover:shadow-xl hover:border-primary/50 transition-all duration-300 flex flex-col justify-between overflow-hidden hover:-translate-y-1"
            >
              {/* Subtle gradient glow */}
              <div 
                className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
                  sec.accentColor
                )} 
              />

              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300", sec.iconBg)}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className={cn("text-[11px] font-bold px-2.5 py-1 rounded-full border shadow-xs", sec.badgeColor)}>
                    {sec.badge}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                    <span>{sec.title}</span>
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {sec.subtitle}
                  </p>
                </div>
              </div>

              <div className="relative z-10 pt-4 mt-4 border-t border-border/60 flex items-center justify-between text-xs font-semibold">
                <span className="text-muted-foreground">{sec.countText}</span>
                <span className="text-primary flex items-center gap-1 group-hover:gap-2 transition-all font-bold">
                  <span>{isRtl ? 'دخول القطاع' : 'Explore'}</span>
                  <ArrowIcon className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
