import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CraftsmenDispatchContainer } from '@/components/craftsmen/CraftsmenDispatchContainer';
import { LiveCraftsmenRadar } from '@/components/craftsmen/LiveCraftsmenRadar';
import { constructMetadata } from '@/lib/seo/metadata';
import { JsonLd, generateBreadcrumbSchema, generateServiceSchema } from '@/lib/seo/jsonLd';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, ArrowLeft, ArrowRight, Sparkles, Building2 } from 'lucide-react';

export const metadata: Metadata = constructMetadata({
  title: 'Emergency Craftsmen & Repair Dispatch (SOS الحرفيين) | خدماتك الجزائر',
  description:
    'Instant emergency craftsman dispatch across Algeria: certified plumbers, electricians, AC & appliance repair technicians with upfront transparent pricing and dual-OTP security verification.',
  canonicalUrl: '/craftsmen-dispatch',
  keywords: [
    'artisans algerie',
    'sos artisan alger',
    'urgence plomberie alger',
    'depannage electricite algerie',
    'حرفيين طوارئ الجزائر',
  ],
});

export default function CraftsmenDispatchPage() {
  const breadcrumbs = generateBreadcrumbSchema([
    { name: 'Home / الرئيسية', url: '/' },
    { name: 'Craftsmen SOS / خدمات الحرفيين الطارئة', url: '/craftsmen-dispatch' },
  ]);

  const serviceSchema = generateServiceSchema({
    id: 'craftsmen-sos',
    name: 'Emergency Craftsmen & Home Repair Dispatch Algérie',
    description: 'On-demand emergency home and building repairs across 58 Wilayas in Algeria.',
    category: 'Home & Professional Repairs',
    price: 2500,
  });

  return (
    <main className="min-h-screen bg-slate-50/50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 space-y-8 max-w-7xl mx-auto">
      <JsonLd data={[breadcrumbs, serviceSchema]} />

      {/* B2B Wholesale Channel Callout for Craftsmen */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-primary text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg text-right">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>خاص بالحرفيين والمقاولين • B2B Quincaillerie</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold font-headline">
            سوق الجملة لمواد الصيانة والخردوات والتسليم الفوري للورشة
          </h2>
          <p className="text-xs text-blue-100 max-w-2xl">
            اطلب النحاس، الكابلات، الفريون، ومستلزمات السباكة بأسعار الجملة المخفضة (تصل إلى 35% خصم) مع توصيل عاجل لموقع عملك مباشرة.
          </p>
        </div>

        <Button asChild className="bg-white text-primary hover:bg-white/90 font-bold rounded-xl text-xs shrink-0 shadow-md">
          <Link href="/craftsmen-dispatch/wholesale" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span>دخول سوق الجملة B2B</span>
          </Link>
        </Button>
      </div>

      {/* Realtime Craftsmen Radar (Scanning nearest verified plumbers, electricians, AC pros) */}
      <LiveCraftsmenRadar userWilaya="سيدي بلعباس" commune="وسط المدينة" />

      {/* Standard Craftsmen SOS Dispatch Container with Dual-Step OTP & Workflows */}
      <CraftsmenDispatchContainer />
    </main>
  );
}

