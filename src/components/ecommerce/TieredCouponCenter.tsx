'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tag, Sparkles, Check, Building2, ShieldCheck, Ticket } from 'lucide-react';
import { TieredCoupon } from '@/types/ecommerce';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/hooks/use-toast';

const INITIAL_COUPONS: TieredCoupon[] = [
  {
    id: 'coup_plat_01',
    code: 'KHIDMATIK500',
    issuer: 'platform',
    discountDA: 500,
    minimumSpendDA: 5000,
    validUntil: '2026-08-31',
    claimed: true,
    badgeAr: 'كوبون المنصة العام',
    badgeEn: 'Platform Voucher'
  },
  {
    id: 'coup_plat_02',
    code: 'SUPER1000',
    issuer: 'platform',
    discountDA: 1000,
    minimumSpendDA: 10000,
    validUntil: '2026-09-15',
    claimed: false,
    badgeAr: 'كوبون المشتريات الكبرى',
    badgeEn: 'Mega Spend Coupon'
  },
  {
    id: 'coup_merch_01',
    code: 'TECHSTORE300',
    issuer: 'merchant',
    merchantName: 'إلكترونيك الجزائر (Alger Tech Store)',
    discountDA: 300,
    minimumSpendDA: 3000,
    validUntil: '2026-08-28',
    claimed: false,
    badgeAr: 'كوبون متجر التاجر',
    badgeEn: 'Store Exclusive'
  },
  {
    id: 'coup_merch_02',
    code: 'PLUMBING800',
    issuer: 'merchant',
    merchantName: 'قطع غيار وليد للترصيص',
    discountDA: 800,
    minimumSpendDA: 6000,
    validUntil: '2026-09-01',
    claimed: false,
    badgeAr: 'كوبون متجر التاجر',
    badgeEn: 'Store Exclusive'
  }
];

export function TieredCouponCenter() {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const { toast } = useToast();

  const [coupons, setCoupons] = useState<TieredCoupon[]>(INITIAL_COUPONS);

  const handleClaim = (id: string) => {
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, claimed: true } : c));
    toast({
      title: isAr ? '🎉 تم استلام الكوبون بنجاح!' : '🎉 Coupon Claimed!',
      description: isAr ? 'سيتم تطبيق الخصم تلقائياً عند استيفاء الحد الأدنى للطلب.' : 'Discount will auto-apply when minimum spend is reached.'
    });
  };

  return (
    <Card className="rounded-3xl border shadow-sm">
      <CardHeader className="p-5 pb-3 border-b">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center">
              <Ticket className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-black">
                {isAr ? 'مركز الكوبونات والخصومات المتعددة' : 'Tiered Coupon Center'}
              </CardTitle>
              <CardDescription className="text-xs">
                {isAr ? 'كوبونات عامة تتحملها المنصة وكوبونات حصرية من المتاجر' : 'Platform-wide and store-exclusive promotional coupons'}
              </CardDescription>
            </div>
          </div>

          <Badge className="bg-red-500 text-white font-bold text-xs">
            {coupons.filter(c => c.claimed).length} {isAr ? 'كوبونات مفعلة' : 'Active'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coupons.map((coupon) => (
            <div
              key={coupon.id}
              className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 relative overflow-hidden transition-all ${
                coupon.claimed 
                  ? 'bg-slate-50 dark:bg-slate-900/60 border-slate-300 dark:border-slate-800' 
                  : 'bg-card border-red-200 dark:border-red-950/60 hover:border-red-400'
              }`}
            >
              {/* Top Tag & Code */}
              <div className="flex justify-between items-start">
                <div>
                  <Badge 
                    variant="outline" 
                    className={`text-[10px] font-bold ${
                      coupon.issuer === 'platform' ? 'text-primary border-primary/30 bg-primary/5' : 'text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/20'
                    }`}
                  >
                    {isAr ? coupon.badgeAr : coupon.badgeEn}
                  </Badge>
                  {coupon.merchantName && (
                    <span className="text-[11px] text-muted-foreground block mt-1 font-semibold">
                      {coupon.merchantName}
                    </span>
                  )}
                </div>

                <span className="font-mono font-black text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                  {coupon.code}
                </span>
              </div>

              {/* Discount Amount & Spend */}
              <div>
                <div className="flex items-baseline gap-1 text-red-600 font-mono font-black text-2xl">
                  <span suppressHydrationWarning>-{coupon.discountDA.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
                  <span className="text-xs font-bold">{isAr ? 'دج' : 'DZD'}</span>
                </div>
                <span className="text-xs text-muted-foreground block mt-0.5" suppressHydrationWarning>
                  {isAr ? `عند الشراء بما قيمته ${coupon.minimumSpendDA.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} دج أو أكثر` : `On orders over ${coupon.minimumSpendDA.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} DA`}
                </span>
              </div>

              {/* Action Button */}
              <div className="pt-2 border-t flex justify-between items-center">
                <span className="text-[10px] text-muted-foreground font-mono">
                  {isAr ? `صالح حتى ${coupon.validUntil}` : `Valid until ${coupon.validUntil}`}
                </span>

                <Button
                  size="sm"
                  disabled={coupon.claimed}
                  onClick={() => handleClaim(coupon.id)}
                  className={`h-8 text-xs font-bold rounded-xl px-4 ${
                    coupon.claimed 
                      ? 'bg-slate-200 dark:bg-slate-800 text-muted-foreground' 
                      : 'bg-red-600 hover:bg-red-700 text-white shadow-xs'
                  }`}
                >
                  {coupon.claimed ? (
                    <span className="flex items-center gap-1">
                      <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" />
                      {isAr ? 'تم الاستلام' : 'Claimed'}
                    </span>
                  ) : (
                    isAr ? 'استلام الكوبون' : 'Claim Now'
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
