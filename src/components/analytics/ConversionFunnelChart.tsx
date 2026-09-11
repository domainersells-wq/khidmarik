'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowDown, Filter, Users, Eye, ShoppingCart, CreditCard, CheckCircle2 } from 'lucide-react';
import type { FunnelStage } from '@/types/analytics';

interface ConversionFunnelChartProps {
  title?: string;
  description?: string;
  stages: FunnelStage[];
  className?: string;
}

const STAGE_ICONS: Record<string, React.ReactNode> = {
  visitors: <Users className="h-4 w-4" />,
  store_visits: <Users className="h-4 w-4" />,
  product_views: <Eye className="h-4 w-4" />,
  add_to_cart: <ShoppingCart className="h-4 w-4" />,
  checkout_started: <CreditCard className="h-4 w-4" />,
  checkout_starts: <CreditCard className="h-4 w-4" />,
  purchases: <CheckCircle2 className="h-4 w-4" />,
  completed_orders: <CheckCircle2 className="h-4 w-4" />,
};

export function ConversionFunnelChart({
  title = 'مسار التحويل والمبيعات (Conversion Funnel)',
  description = 'معدل انتقال وتفاعل الزوار عبر مراحل الشراء والحجز من الزيارة حتى إتمام الدفع',
  stages,
  className,
}: ConversionFunnelChartProps) {
  return (
    <Card className="rounded-3xl border border-border/80 bg-card shadow-sm text-right overflow-hidden">
      <CardHeader className="bg-muted/20 border-b pb-4">
        <div className="flex items-center justify-between">
          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-bold gap-1 px-3 py-1">
            <Filter className="h-3.5 w-3.5" />
            <span>مسار التحويل المتسلسل</span>
          </Badge>
        </div>
        <CardTitle className="text-base sm:text-lg font-black text-foreground pt-1">{title}</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">{description}</CardDescription>
      </CardHeader>

      <CardContent className="pt-6 space-y-3">
        {stages.map((stage, idx) => {
          const isFirst = idx === 0;
          const isLast = idx === stages.length - 1;
          const widthPercent = Math.max(18, Math.round(stage.conversionRateFromTotal));

          return (
            <div key={stage.stage} className="space-y-1.5">
              {/* Stage Box */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/30 border border-border/60 hover:border-primary/40 transition-all">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    {STAGE_ICONS[stage.stage] || <Filter className="h-4 w-4" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">{stage.stageNameAr}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      {stage.count.toLocaleString('fr-DZ')} مستخدم
                    </div>
                  </div>
                </div>

                <div className="text-left space-y-0.5">
                  <div className="text-xs font-black font-mono text-primary">
                    {stage.conversionRateFromTotal}%
                  </div>
                  {!isFirst && (
                    <div className="text-[10px] text-muted-foreground">
                      ({stage.conversionRateFromPrevious}% من المرحلة السابقة)
                    </div>
                  )}
                </div>
              </div>

              {/* Progress visual bar */}
              <div className="w-full bg-muted/40 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-primary to-primary/60 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${widthPercent}%` }}
                />
              </div>

              {/* Transition arrow indicator */}
              {!isLast && (
                <div className="flex items-center justify-center py-0.5 text-muted-foreground/50">
                  <ArrowDown className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
