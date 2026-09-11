'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MetricComparison } from '@/types/analytics';

interface MetricKpiCardProps {
  title: string;
  metric: MetricComparison<number>;
  icon?: React.ReactNode;
  subtitle?: string;
  tooltipText?: string;
  className?: string;
  isInverseTrend?: boolean; // true if lower is better (e.g. cancellations, disputes, refunds)
}

export function MetricKpiCard({
  title,
  metric,
  icon,
  subtitle,
  tooltipText,
  className,
  isInverseTrend = false,
}: MetricKpiCardProps) {
  const isPositive = metric.percentageChange > 0;
  const isZero = metric.percentageChange === 0;

  // Good trend indicator
  const isGood = isInverseTrend ? !isPositive : isPositive;

  return (
    <Card className={cn("rounded-3xl border border-border/80 bg-card hover:border-primary/40 transition-all shadow-sm hover:shadow-md text-right overflow-hidden", className)}>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
            <span>{title}</span>
            {tooltipText && (
              <span title={tooltipText} className="cursor-help text-muted-foreground/60 hover:text-foreground">
                <Info className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
          {icon && (
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
              {icon}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <div className="text-2xl sm:text-3xl font-black text-foreground font-mono tracking-tight">
            {metric.formattedValue || metric.value.toLocaleString('fr-DZ')}
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            {/* Trend Badge */}
            <Badge
              variant="outline"
              className={cn(
                "text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border",
                isZero
                  ? "bg-muted text-muted-foreground border-border"
                  : isGood
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                  : "bg-destructive/10 text-destructive border-destructive/30"
              )}
            >
              {isZero ? (
                <Minus className="h-3 w-3" />
              ) : isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span dir="ltr">{isPositive ? `+${metric.percentageChange}%` : `${metric.percentageChange}%`}</span>
            </Badge>

            <span className="text-[10px] text-muted-foreground">
              مقارنة بالفترة السابقة ({metric.formattedPrevious || metric.previousValue.toLocaleString('fr-DZ')})
            </span>
          </div>
        </div>

        {subtitle && (
          <div className="text-[11px] text-muted-foreground border-t pt-2 border-border/40">
            {subtitle}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
