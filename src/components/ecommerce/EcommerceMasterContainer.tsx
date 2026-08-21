'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingBag, 
  Tag, 
  Coins, 
  Camera, 
  Truck, 
  ShieldCheck, 
  Star, 
  Zap, 
  Users, 
  Flame, 
  Clock, 
  Building2, 
  SlidersHorizontal,
  PackageCheck,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { 
  ProductVariationGroup, 
  ProductSKU, 
  BuyerProtectionEscrow, 
  FlashDealItem,
  VerifiedCustomerReview 
} from '@/types/ecommerce';

import { ProductSKUSelector } from './ProductSKUSelector';
import { VisualImageSearchModal } from './VisualImageSearchModal';
import { CoinsDailyCheckinModal } from './CoinsDailyCheckinModal';
import { TieredCouponCenter } from './TieredCouponCenter';
import { ShippingLogisticsTracker } from './ShippingLogisticsTracker';
import { BuyerProtectionEscrowModal } from './BuyerProtectionEscrowModal';

// --- MOCK PRODUCT & VARIATION DATA ---
const MOCK_VARIATION_GROUPS: ProductVariationGroup[] = [
  {
    id: 'color',
    type: 'color',
    nameAr: 'اللون والمظهر',
    nameEn: 'Color',
    options: [
      { id: 'black', nameAr: 'أسود مطفي (Matte Black)', nameEn: 'Matte Black', value: '#1e293b', extraPriceDA: 0 },
      { id: 'silver', nameAr: 'فضي بلاتينيوم (Silver)', nameEn: 'Platinum Silver', value: '#94a3b8', extraPriceDA: 500 },
      { id: 'navy', nameAr: 'أزرق كحلي ملكي (Royal Navy)', nameEn: 'Royal Navy', value: '#1e3a8a', extraPriceDA: 500 }
    ]
  },
  {
    id: 'model',
    type: 'model',
    nameAr: 'إصدار السماعة',
    nameEn: 'Model Edition',
    options: [
      { id: 'standard', nameAr: 'النسخة القياسية (Standard)', nameEn: 'Standard Edition', value: 'standard', extraPriceDA: 0 },
      { id: 'pro_anc', nameAr: 'نسخة المحترفين مع عزل الضوضاء النشط (Pro ANC + Bass Boost)', nameEn: 'Pro ANC Edition', value: 'pro', extraPriceDA: 1800 }
    ]
  }
];

const MOCK_SKUS: ProductSKU[] = [
  {
    id: 'sku_black_std',
    combinationKey: 'black_standard',
    skuCode: 'DZ-AUD-001-B',
    priceDA: 4200,
    originalPriceDA: 5500,
    stockQuantity: 18,
    imageGallery: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=700&auto=format&fit=crop&q=80'
    ]
  },
  {
    id: 'sku_black_pro',
    combinationKey: 'black_pro_anc',
    skuCode: 'DZ-AUD-001-BPRO',
    priceDA: 6000,
    originalPriceDA: 7500,
    stockQuantity: 9,
    imageGallery: [
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=700&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&auto=format&fit=crop&q=80'
    ]
  },
  {
    id: 'sku_silver_std',
    combinationKey: 'silver_standard',
    skuCode: 'DZ-AUD-002-S',
    priceDA: 4700,
    originalPriceDA: 6000,
    stockQuantity: 12,
    imageGallery: [
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=700&auto=format&fit=crop&q=80'
    ]
  },
  {
    id: 'sku_silver_pro',
    combinationKey: 'silver_pro_anc',
    skuCode: 'DZ-AUD-002-SPRO',
    priceDA: 6500,
    originalPriceDA: 8000,
    stockQuantity: 6,
    imageGallery: [
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=700&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=700&auto=format&fit=crop&q=80'
    ]
  },
  {
    id: 'sku_navy_std',
    combinationKey: 'navy_standard',
    skuCode: 'DZ-AUD-003-N',
    priceDA: 4700,
    originalPriceDA: 6000,
    stockQuantity: 14,
    imageGallery: [
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=700&auto=format&fit=crop&q=80'
    ]
  },
  {
    id: 'sku_navy_pro',
    combinationKey: 'navy_pro_anc',
    skuCode: 'DZ-AUD-003-NPRO',
    priceDA: 6500,
    originalPriceDA: 8000,
    stockQuantity: 4,
    imageGallery: [
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=700&auto=format&fit=crop&q=80'
    ]
  }
];

const MOCK_FLASH_DEALS: FlashDealItem[] = [
  {
    id: 'flash_01',
    titleAr: 'سماعات ستوديو Pro ANC',
    titleEn: 'Studio Pro ANC Headset',
    discountPercent: 35,
    dealPriceDA: 4200,
    originalPriceDA: 6500,
    soldUnits: 78,
    totalUnits: 100,
    endsInSeconds: 7420,
    thumbnailUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200'
  },
  {
    id: 'flash_02',
    titleAr: 'صمام ماء نحاسي إيطالي أصلي',
    titleEn: 'Genuine Brass Water Valve',
    discountPercent: 40,
    dealPriceDA: 1500,
    originalPriceDA: 2500,
    soldUnits: 92,
    totalUnits: 100,
    endsInSeconds: 7420,
    thumbnailUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200'
  }
];

const MOCK_VERIFIED_REVIEWS: VerifiedCustomerReview[] = [
  {
    id: 'rev_01',
    customerName: 'طارق قادري (Tarek K.)',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    verifiedPurchase: true,
    rating: 5,
    date: 'منذ يومين',
    selectedVariation: 'اللون: أسود مطفي • إصدار: Pro ANC',
    comment: 'جودة الصوت مذهلة والعزل ممتاز في الشارع. تم التوصيل في 24 ساعة عبر ياليدين إلى دالي إبراهيم.',
    photos: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'
    ],
    helpfulCount: 14
  },
  {
    id: 'rev_02',
    customerName: 'أمينة بن سالم',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    verifiedPurchase: true,
    rating: 5,
    date: 'منذ أسبوع',
    selectedVariation: 'اللون: فضي بلاتينيوم • إصدار: Standard',
    comment: 'المنتج أصلي والتغليف محكم جداً. استلمته من مكتب Stop-Desk بسهولة.',
    photos: [
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400'
    ],
    helpfulCount: 9
  }
];

export function EcommerceMasterContainer() {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const { toast } = useToast();

  // Modals state
  const [isVisualSearchOpen, setIsVisualSearchOpen] = useState(false);
  const [isCoinsModalOpen, setIsCoinsModalOpen] = useState(false);
  const [isEscrowModalOpen, setIsEscrowModalOpen] = useState(false);

  // Active Coin Balance
  const [coinBalance, setCoinBalance] = useState(380);

  // Escrow Data
  const [escrowState, setEscrowState] = useState<BuyerProtectionEscrow>({
    orderId: 'ORD-DZ-8941',
    totalAmountDA: 4700,
    protectionDaysRemaining: 4,
    escrowStatus: 'LOCKED',
    autoReleaseDeadline: '2026-08-25 18:00',
    refundGuaranteeDays: 5
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      
      {/* Top Banner: Quick Access to AI Visual Search, Daily Coins, and Buyer Protection */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 rounded-3xl bg-slate-900 text-white shadow-lg border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black flex items-center gap-2">
              <ShoppingBag className="h-6 w-6 text-primary" />
              {isAr ? 'منظومة التسوق والتجارة المعتمدة (AliExpress DZ Core)' : 'Khidmatik E-Commerce Express'}
            </h1>
            <Badge className="bg-emerald-600 text-white font-bold text-xs uppercase">
              58 Wilayas
            </Badge>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            {isAr 
              ? 'محرك المتغيرات المتقدم (SKU)، البحث البصري بالذكاء الاصطناعي، شحن ياليدين المجمّع، ونظام الضمان المالي وحماية المشتري (Escrow)' 
              : 'Multi-attribute SKUs, Visual AI search, combined parcel logistics & 5-day escrow buyer protection'}
          </p>
        </div>

        {/* Quick Trigger Toolbuttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Visual Search Button */}
          <Button
            size="sm"
            onClick={() => setIsVisualSearchOpen(true)}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs h-9 rounded-xl border border-slate-700 gap-1.5 shadow-sm"
          >
            <Camera className="h-4 w-4 text-primary" />
            {isAr ? 'البحث بالصورة' : 'Visual Search'}
          </Button>

          {/* Daily Coins Button */}
          <Button
            size="sm"
            onClick={() => setIsCoinsModalOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-white font-black text-xs h-9 rounded-xl gap-1.5 shadow-md shadow-amber-500/20"
          >
            <Coins className="h-4 w-4" />
            <span>{coinBalance} {isAr ? 'عملة (مكافأة اليوم)' : 'Coins'}</span>
          </Button>

          {/* Escrow Status Trigger */}
          <Button
            size="sm"
            onClick={() => setIsEscrowModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 rounded-xl gap-1.5 shadow-md shadow-emerald-600/20"
          >
            <ShieldCheck className="h-4 w-4" />
            {isAr ? 'حماية المشتري (Escrow)' : 'Buyer Protection'}
          </Button>
        </div>
      </div>

      {/* 1. Flash Deals Banner with Live Countdown */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-md flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-white/20 flex items-center justify-center font-bold">
            <Zap className="h-6 w-6 text-yellow-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-base">{isAr ? 'عروض البيع الخاطف (Flash Deals)' : 'Flash Sales Countdown'}</h3>
              <Badge className="bg-yellow-400 text-slate-900 font-black text-[10px]">خصم حتى 50%</Badge>
            </div>
            <p className="text-xs text-white/80">كميات محدودة تنتهي خلال ساعتين و 3 دقائق</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-xs font-mono font-bold">
          <Clock className="h-4 w-4 text-yellow-300" />
          <span>ينتهي خلال: 02:03:45</span>
        </div>
      </div>

      {/* 2. Core Feature: SKU Variations & Product Detail Component */}
      <ProductSKUSelector 
        variationGroups={MOCK_VARIATION_GROUPS}
        skuList={MOCK_SKUS}
        basePriceDA={4200}
        onOpenVisualSearch={() => setIsVisualSearchOpen(true)}
        onSelectionChange={(sku, qty) => {
          toast({
            title: isAr ? '🛒 تمت إضافة السلعة للسلة بنجاح!' : '🛒 Added to Cart!',
            description: `${isAr ? 'النسخة المحددة:' : 'SKU:'} ${sku.skuCode} • ${qty} ${isAr ? 'قطع' : 'units'}`
          });
        }}
      />

      {/* 3. Tiered Coupons & Logistics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Tiered Coupons Center (6 Cols) */}
        <div className="lg:col-span-6">
          <TieredCouponCenter />
        </div>

        {/* Local Logistics & Combined Shipping Tracker (6 Cols) */}
        <div className="lg:col-span-6">
          <ShippingLogisticsTracker />
        </div>

      </div>

      {/* 4. Verified Purchase Reviews with Customer Photos */}
      <Card className="rounded-3xl border shadow-sm">
        <CardHeader className="p-5 pb-3 border-b">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Star className="h-5 w-5 fill-amber-400" />
              </div>
              <div>
                <CardTitle className="text-base font-black">
                  {isAr ? 'تقييمات المشترين الموثقة بالصور (Verified Purchase Reviews)' : 'Verified Customer Reviews & Photos'}
                </CardTitle>
                <CardDescription className="text-xs">
                  {isAr ? 'حصري للعملاء الذين استلموا الطرد الفعلي وفحصوه' : 'Real photos and evaluations from verified delivered orders'}
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-1 font-bold text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="text-slate-900 dark:text-white font-mono">4.9 / 5</span>
              <span className="text-muted-foreground">(142 تقييم)</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MOCK_VERIFIED_REVIEWS.map(rev => (
              <div key={rev.id} className="p-4 rounded-2xl border bg-card space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <img src={rev.avatarUrl} alt="Avatar" className="h-9 w-9 rounded-full object-cover border" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs">{rev.customerName}</span>
                        <Badge className="bg-emerald-600 text-white text-[9px] px-1.5 py-0">
                          {isAr ? 'شراء مؤكد ✓' : 'Verified Purchase'}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-muted-foreground block">{rev.date}</span>
                    </div>
                  </div>

                  <div className="flex text-amber-400">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-amber-400" />
                    ))}
                  </div>
                </div>

                <Badge variant="outline" className="text-[10px] font-medium text-muted-foreground">
                  {rev.selectedVariation}
                </Badge>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  "{rev.comment}"
                </p>

                {rev.photos.length > 0 && (
                  <div className="flex gap-2 pt-1">
                    {rev.photos.map((p, idx) => (
                      <img key={idx} src={p} alt="Review attachment" className="h-14 w-14 rounded-xl object-cover border" />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* --- ALL ECOMMERCE OPERATIONAL MODALS --- */}
      
      {/* 1. Visual Search Modal */}
      <VisualImageSearchModal 
        isOpen={isVisualSearchOpen}
        onClose={() => setIsVisualSearchOpen(false)}
        onSelectProduct={(p) => {
          toast({
            title: isAr ? 'تم تحديد المنتج من نتائج البحث البصري' : 'Product Selected from Visual Match',
            description: `${p.titleAr} • ${p.priceDA} دج`
          });
        }}
      />

      {/* 2. Daily Coins Check-in Modal */}
      <CoinsDailyCheckinModal 
        isOpen={isCoinsModalOpen}
        onClose={() => setIsCoinsModalOpen(false)}
        onCoinsUpdated={(newTotal) => setCoinBalance(newTotal)}
      />

      {/* 3. Buyer Protection Escrow Modal */}
      <BuyerProtectionEscrowModal 
        isOpen={isEscrowModalOpen}
        onClose={() => setIsEscrowModalOpen(false)}
        escrow={escrowState}
        onReleaseEscrow={() => {
          setEscrowState(prev => ({ ...prev, escrowStatus: 'RELEASED_TO_SELLER' }));
        }}
        onOpenDispute={(reason) => {
          setEscrowState(prev => ({ ...prev, escrowStatus: 'DISPUTED' }));
        }}
      />

    </div>
  );
}
