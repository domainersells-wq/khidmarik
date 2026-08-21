'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Check, 
  X, 
  Sparkles, 
  Shield, 
  Medal, 
  Award, 
  Crown, 
  Gem, 
  Palette, 
  Layers, 
  Bot, 
  MessageSquare, 
  HelpCircle,
  TrendingUp,
  Percent
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { SubscriptionTier, TIER_THEMES } from '@/lib/subscriptionTheme';
import { SUBSCRIPTION_PLANS, PlanDetail } from './SubscriptionPlansModal';

interface SubscriptionFeatureMatrixProps {
  currentTier: SubscriptionTier;
  onSelectPlan: (plan: PlanDetail) => void;
}

interface FeatureComparisonRow {
  categoryAr: string;
  categoryEn: string;
  featureAr: string;
  featureEn: string;
  free: string | boolean;
  bronze: string | boolean;
  silver: string | boolean;
  gold: string | boolean;
  platinum: string | boolean;
  diamond: string | boolean;
}

export const FEATURE_COMPARISON_DATA: FeatureComparisonRow[] = [
  // 1. الهوية البصرية والمظهر
  {
    categoryAr: 'الهوية البصرية والمظهر',
    categoryEn: 'Branding & Visual Themes',
    featureAr: 'إطار البروفيل الدائري الكلاسيكي',
    featureEn: 'Classic Circular Avatar Frame',
    free: true, bronze: true, silver: true, gold: true, platinum: true, diamond: true
  },
  {
    categoryAr: 'الهوية البصرية والمظهر',
    categoryEn: 'Branding & Visual Themes',
    featureAr: 'أشكال الإطار الفاخرة (مربع زوايا دائرية، سداسي Hexagon)',
    featureEn: 'Luxury Frame Shapes (Rounded Sq, Hexagon)',
    free: false, bronze: false, silver: false, gold: false, platinum: true, diamond: true
  },
  {
    categoryAr: 'الهوية البصرية والمظهر',
    categoryEn: 'Branding & Visual Themes',
    featureAr: 'تخصيص اللون الرئيسي للمتجر والبروفيل (Custom Accent)',
    featureEn: 'Custom Profile & Store Identity Color',
    free: false, bronze: false, silver: false, gold: false, platinum: true, diamond: true
  },
  {
    categoryAr: 'الهوية البصرية والمظهر',
    categoryEn: 'Branding & Visual Themes',
    featureAr: 'رفع غلاف بروفيل مخصص (Custom Cover Banner)',
    featureEn: 'Upload Custom High-Res Cover Banner',
    free: false, bronze: false, silver: false, gold: false, platinum: true, diamond: true
  },
  {
    categoryAr: 'الهوية البصرية والمظهر',
    categoryEn: 'Branding & Visual Themes',
    featureAr: 'تأثير الحدود المتدفقة الفاخرة (Border Sweep Glow Effect)',
    featureEn: 'Dynamic Border Sweep Glow Animation',
    free: false, bronze: false, silver: false, gold: false, platinum: false, diamond: true
  },

  // 2. التسويق والذكاء الاصطناعي
  {
    categoryAr: 'التسويق وأدوات الذكاء الاصطناعي',
    categoryEn: 'Marketing & AI SEO Tools',
    featureAr: 'مولد الكلمات المفتاحية بالذكاء الاصطناعي (AI SEO)',
    featureEn: 'AI-Powered SEO & Keyword Generator',
    free: false, bronze: false, silver: false, gold: true, platinum: true, diamond: true
  },
  {
    categoryAr: 'التسويق وأدوات الذكاء الاصطناعي',
    categoryEn: 'Marketing & AI SEO Tools',
    featureAr: 'نظام إنشاء كوبونات الخصم والعروض الترويجية',
    featureEn: 'Promotional Coupons & Discount Builder',
    free: false, bronze: false, silver: true, gold: true, platinum: true, diamond: true
  },
  {
    categoryAr: 'التسويق وأدوات الذكاء الاصطناعي',
    categoryEn: 'Marketing & AI SEO Tools',
    featureAr: 'شارة التوثيق والتميز المعتمدة على البروفيل',
    featureEn: 'Verified Tier Badge on Public Profile',
    free: 'أساسي', bronze: 'برونزية', silver: 'فضية', gold: 'ذهبية', platinum: 'بلاتينية', diamond: 'ماسية VIP'
  },
  {
    categoryAr: 'التسويق وأدوات الذكاء الاصطناعي',
    categoryEn: 'Marketing & AI SEO Tools',
    featureAr: 'أولوية الظهور في دليل الخدمات والبحث المحلي',
    featureEn: 'Search & Directory Placement Priority',
    free: 'عادية', bronze: 'جيدة (30%)', silver: 'متقدمة (50%)', gold: 'عالية (75%)', platinum: 'ممتازة (90%)', diamond: 'أولوية قصوى 100%'
  },

  // 3. معرض الأعمال والروابط
  {
    categoryAr: 'معرض الأعمال والروابط الخارجية',
    categoryEn: 'Portfolio & External Links',
    featureAr: 'الحد الأقصى لمشاريع معرض الأعمال (Portfolio Items)',
    featureEn: 'Max Portfolio Project Items',
    free: '3 مشاريع', bronze: '5 مشاريع', silver: '8 مشاريع', gold: '15 مشروعاً', platinum: 'غير محدود ∞', diamond: 'غير محدود ∞'
  },
  {
    categoryAr: 'معرض الأعمال والروابط الخارجية',
    categoryEn: 'Portfolio & External Links',
    featureAr: 'إضافة رابط الموقع الشخصي (Personal Website)',
    featureEn: 'Add Personal Website Link',
    free: false, bronze: true, silver: true, gold: true, platinum: true, diamond: true
  },
  {
    categoryAr: 'معرض الأعمال والروابط الخارجية',
    categoryEn: 'Portfolio & External Links',
    featureAr: 'إضافة رابط LinkedIn',
    featureEn: 'Add LinkedIn Profile Link',
    free: false, bronze: false, silver: true, gold: true, platinum: true, diamond: true
  },
  {
    categoryAr: 'معرض الأعمال والروابط الخارجية',
    categoryEn: 'Portfolio & External Links',
    featureAr: 'إضافة روابط إضافية (Behance, Dribbble, GitHub)',
    featureEn: 'Add Extra Portfolios (Behance, Dribbble, GitHub)',
    free: false, bronze: false, silver: false, gold: false, platinum: true, diamond: true
  },

  // 4. التواصل والمراجعات والدعم
  {
    categoryAr: 'التواصل وإدارة المراجعات',
    categoryEn: 'Client Engagement & Reviews',
    featureAr: 'الرد على تقييمات ومراجعات العملاء العامة',
    featureEn: 'Public Response to Customer Reviews',
    free: false, bronze: false, silver: false, gold: true, platinum: true, diamond: true
  },
  {
    categoryAr: 'التواصل وإدارة المراجعات',
    categoryEn: 'Client Engagement & Reviews',
    featureAr: 'تحليلات الأداء والزيارات المتقدمة',
    featureEn: 'Advanced Profile & Traffic Analytics',
    free: false, bronze: false, silver: false, gold: true, platinum: true, diamond: true
  },
  {
    categoryAr: 'التواصل وإدارة المراجعات',
    categoryEn: 'Client Engagement & Reviews',
    featureAr: 'عمولة المنصة على الصفقات والمبيعات',
    featureEn: 'Platform Commission on Transactions',
    free: '10%', bronze: '8%', silver: '5%', gold: '3%', platinum: '1.5%', diamond: '0% (بدون عمولة)'
  },
  {
    categoryAr: 'التواصل وإدارة المراجعات',
    categoryEn: 'Client Engagement & Reviews',
    featureAr: 'الدعم الفني وإدارة الحساب',
    featureEn: 'Technical Support & Account Manager',
    free: 'دعم قياسي', bronze: 'دعم بالبريد', silver: 'دعم سريع', gold: 'دعم مباشر', platinum: 'دعم ذو أولوية', diamond: 'مدير حساب VIP مخصص 24/7'
  }
];

export function SubscriptionFeatureMatrix({
  currentTier,
  onSelectPlan
}: SubscriptionFeatureMatrixProps) {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const categories = Array.from(new Set(FEATURE_COMPARISON_DATA.map(r => isAr ? r.categoryAr : r.categoryEn)));

  const TierIcons: Record<SubscriptionTier, any> = {
    free: Shield,
    bronze: Medal,
    silver: Award,
    gold: Crown,
    platinum: Gem,
    diamond: Sparkles,
  };

  const renderCell = (val: string | boolean, tier: SubscriptionTier) => {
    const theme = TIER_THEMES[tier];
    if (typeof val === 'boolean') {
      return val ? (
        <div className="flex justify-center items-center">
          <div 
            className="h-5 w-5 rounded-full flex items-center justify-center shadow-xs"
            style={{ backgroundColor: `${theme.accentColor}25`, color: theme.accentColor }}
          >
            <Check className="h-3.5 w-3.5 stroke-[3]" />
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center text-slate-300 dark:text-slate-700">
          <X className="h-4 w-4" />
        </div>
      );
    }
    return (
      <span className="text-xs font-bold text-center block text-slate-800 dark:text-slate-200">
        {val}
      </span>
    );
  };

  return (
    <Card className="shadow-md border overflow-hidden">
      <CardHeader className="bg-slate-50/80 dark:bg-slate-800/40 border-b">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              {isAr ? 'جدول مقارنة وتقسيم ميزات الباقات' : 'Full Features Comparison Matrix'}
            </CardTitle>
            <CardDescription className="text-xs">
              {isAr ? 'تقسيم شامل لكافة الميزات المتاحة لكل باقة لتحديد الخيار الأنسب لنشاطك' : 'Detailed breakdown of all features across every subscription tier'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-xs text-left rtl:text-right border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800/80 border-b text-slate-900 dark:text-white">
              <th className="p-4 w-1/4 font-bold text-sm">
                {isAr ? 'الميزات والخدمات' : 'Features & Modules'}
              </th>
              {SUBSCRIPTION_PLANS.map(p => {
                const Icon = TierIcons[p.tier];
                const theme = TIER_THEMES[p.tier];
                const isCurrent = currentTier === p.tier;

                return (
                  <th key={p.tier} className="p-3 text-center border-x border-slate-200 dark:border-slate-800">
                    <div className="flex flex-col items-center gap-1">
                      <div 
                        className="h-7 w-7 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${theme.accentColor}20`, color: theme.accentColor }}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="font-bold text-xs">{isAr ? p.nameAr : p.nameEn}</span>
                      <span className="text-[11px] font-mono font-black text-primary">
                        {p.price === 0 ? (isAr ? 'مجاناً' : 'Free') : `${p.price.toLocaleString()} دج`}
                      </span>
                      {isCurrent ? (
                        <Badge className="bg-emerald-600 text-white text-[9px] py-0 px-1.5 mt-1">
                          {isAr ? 'باقتك' : 'Active'}
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px] px-2 mt-1 hover:bg-primary hover:text-white border-primary/40"
                          onClick={() => onSelectPlan(p)}
                        >
                          {isAr ? 'اختيار' : 'Choose'}
                        </Button>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {categories.map((cat, catIdx) => {
              const rows = FEATURE_COMPARISON_DATA.filter(r => (isAr ? r.categoryAr : r.categoryEn) === cat);

              return (
                <React.Fragment key={catIdx}>
                  {/* Category Header Row */}
                  <tr className="bg-slate-50 dark:bg-slate-900/60 font-bold border-y border-slate-200 dark:border-slate-800 text-primary">
                    <td colSpan={7} className="py-2.5 px-4 text-xs tracking-wider">
                      ✦ {cat}
                    </td>
                  </tr>

                  {/* Feature Rows */}
                  {rows.map((row, rowIdx) => (
                    <tr 
                      key={rowIdx} 
                      className={`border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors ${
                        rowIdx % 2 === 1 ? 'bg-slate-50/20 dark:bg-slate-900/20' : ''
                      }`}
                    >
                      <td className="p-3.5 font-medium text-slate-800 dark:text-slate-200 text-xs">
                        {isAr ? row.featureAr : row.featureEn}
                      </td>
                      <td className="p-3 text-center border-x border-slate-100 dark:border-slate-800/60">
                        {renderCell(row.free, 'free')}
                      </td>
                      <td className="p-3 text-center border-x border-slate-100 dark:border-slate-800/60">
                        {renderCell(row.bronze, 'bronze')}
                      </td>
                      <td className="p-3 text-center border-x border-slate-100 dark:border-slate-800/60">
                        {renderCell(row.silver, 'silver')}
                      </td>
                      <td className="p-3 text-center border-x border-slate-100 dark:border-slate-800/60">
                        {renderCell(row.gold, 'gold')}
                      </td>
                      <td className="p-3 text-center border-x border-slate-100 dark:border-slate-800/60">
                        {renderCell(row.platinum, 'platinum')}
                      </td>
                      <td className="p-3 text-center border-x border-slate-100 dark:border-slate-800/60 bg-cyan-500/5">
                        {renderCell(row.diamond, 'diamond')}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
