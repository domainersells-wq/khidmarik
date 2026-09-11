'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, ShieldCheck, Sparkles, CheckCircle2, MessageSquare, PenSquare } from 'lucide-react';
import { RatingDistribution, ReviewAspectRatings } from '@/types/reviews';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

interface StructuredReviewSummaryProps {
  distribution: RatingDistribution;
  selectedStarFilter?: number;
  onSelectStarFilter: (star?: number) => void;
  onOpenWriteModal: () => void;
  canWriteReview?: boolean;
}

export function StructuredReviewSummary({
  distribution,
  selectedStarFilter,
  onSelectStarFilter,
  onOpenWriteModal,
  canWriteReview = true,
}: StructuredReviewSummaryProps) {
  const { translate } = useLanguage();
  const { total, average, aspectAverages } = distribution;

  const criteriaList: Array<{ key: keyof ReviewAspectRatings; labelEn: string; labelAr: string; score: number; color: string }> = [
    { key: 'quality', labelEn: 'Quality of Work / Items', labelAr: 'جودة العمل والمنتجات', score: aspectAverages.quality, color: 'bg-emerald-500' },
    { key: 'price', labelEn: 'Price & Value', labelAr: 'السعر والقيمة مقابل المال', score: aspectAverages.price, color: 'bg-blue-500' },
    { key: 'communication', labelEn: 'Communication & Response', labelAr: 'التواصل والاستجابة', score: aspectAverages.communication, color: 'bg-purple-500' },
    { key: 'punctuality', labelEn: 'Punctuality & Speed', labelAr: 'الالتزام بالمواعيد والسرعة', score: aspectAverages.punctuality, color: 'bg-amber-500' },
    { key: 'professionalism', labelEn: 'Professionalism & Expertise', labelAr: 'الاحترافية وحسن التعامل', score: aspectAverages.professionalism, color: 'bg-rose-500' },
  ];

  return (
    <Card className="rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden bg-card font-sans">
      <CardContent className="p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          {/* Left: Big Score & Stars */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-2">
            <span className="text-5xl md:text-6xl font-black text-slate-900 dark:text-slate-50 tracking-tight font-headline">
              {average.toFixed(1)}
            </span>

            {/* Stars row */}
            <div className="flex items-center gap-1 text-amber-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "h-6 w-6",
                    star <= Math.round(average)
                      ? "fill-amber-400 text-amber-400"
                      : "text-slate-300 dark:text-slate-700"
                  )}
                />
              ))}
            </div>

            <p className="text-xs text-muted-foreground font-semibold">
              {translate('basedOn', 'Based on')} {total} {translate('verifiedReviews', 'verified reviews')}
            </p>

            <div className="pt-2 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              <ShieldCheck className="h-4 w-4" />
              <span>100% {translate('verifiedPurchases', 'Verified Purchases')}</span>
            </div>

            <Button
              onClick={onOpenWriteModal}
              className="mt-3 w-full rounded-xl text-xs font-bold gap-2 bg-primary hover:bg-primary/95 text-primary-foreground shadow-sm h-10"
            >
              <PenSquare className="h-4 w-4" />
              {translate('writeAReview', 'Write a Verified Review')}
            </Button>
          </div>

          {/* Center: 5-Star Distribution Bars */}
          <div className="lg:col-span-4 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-left rtl:text-right">
              {translate('ratingDistribution', 'Rating Distribution')}
            </h4>

            {[5, 4, 3, 2, 1].map((star) => {
              const count = distribution[star as 1 | 2 | 3 | 4 | 5] || 0;
              const percentage = total > 0 ? (count / total) * 100 : 0;
              const isSelected = selectedStarFilter === star;

              return (
                <button
                  key={star}
                  onClick={() => onSelectStarFilter(isSelected ? undefined : star)}
                  className={cn(
                    "w-full flex items-center gap-3 text-xs group p-1 rounded-xl transition-all select-none text-left rtl:text-right",
                    isSelected
                      ? "bg-primary/10 ring-1 ring-primary/40 font-bold"
                      : "hover:bg-slate-100/60 dark:hover:bg-slate-900/60"
                  )}
                >
                  <div className="flex items-center gap-1 w-14 shrink-0 font-semibold text-slate-700 dark:text-slate-300">
                    <span>{star}</span>
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  </div>

                  <div className="flex-1 h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        isSelected ? "bg-primary" : "bg-amber-400 group-hover:bg-amber-500"
                      )}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <span className="text-[11px] text-muted-foreground w-8 text-right rtl:text-left font-mono">
                    {count}
                  </span>
                </button>
              );
            })}

            {selectedStarFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelectStarFilter(undefined)}
                className="h-7 text-[11px] text-primary p-0 hover:underline"
              >
                {translate('clearStarFilter', 'Show all ratings')}
              </Button>
            )}
          </div>

          {/* Right: 6-Criteria Breakdown Progress Meters */}
          <div className="lg:col-span-4 space-y-3 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-left rtl:text-right flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              {translate('detailedCriteria', 'Evaluation Criteria')}
            </h4>

            <div className="space-y-2.5">
              {criteriaList.map((crit) => {
                const percentage = (crit.score / 5) * 100;

                return (
                  <div key={crit.key} className="space-y-1 text-left rtl:text-right">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {translate(`criteria_${crit.key}`, crit.labelEn)}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                        {crit.score.toFixed(1)} / 5.0
                      </span>
                    </div>

                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500", crit.color)}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
