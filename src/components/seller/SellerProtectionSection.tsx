'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ShieldCheck, AlertCircle, ShieldAlert, Sparkles, 
  ArrowUpRight, CheckCircle2, TrendingUp, HelpCircle, 
  RotateCcw, Info, Wallet
} from 'lucide-react';
import { rejectionCostAllocationService } from '@/services/rejectionCostAllocationService';
import { SellerProtectionUsageStats } from '@/types/rejectionCostAllocation';

export function SellerProtectionSection({
  sellerId = 'str_1',
  planId = 'pro',
}: {
  sellerId?: string;
  planId?: string;
}) {
  const [stats, setStats] = useState<SellerProtectionUsageStats | null>(null);

  useEffect(() => {
    const data = rejectionCostAllocationService.getSellerProtectionUsage(sellerId, planId);
    setStats(data);
  }, [sellerId, planId]);

  if (!stats) return null;

  const usagePercentage = Math.min(
    100,
    Math.round((stats.monthlyProtectionUsed / (stats.monthlyProtectionLimit || 1)) * 100)
  );

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-card border rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge className="bg-primary text-primary-foreground font-bold text-xs uppercase px-2.5 py-0.5 rounded-full">
              {stats.planName}
            </Badge>
            <span className="text-xs text-muted-foreground">• Active Subscription</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" /> Seller Subscription Protection Desk
          </h2>
          <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
            Your active subscription shields your store from logistics losses on rejected deliveries and customer returns.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-4 bg-background border rounded-xl text-right shrink-0 shadow-sm">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">
              Shipping Protection
            </span>
            <span className="text-2xl font-extrabold text-primary">
              {stats.shippingProtectionPercentage}%
            </span>
          </div>
        </div>
      </div>

      {/* Quota & Usage Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Monthly Protection Limit Meter */}
        <Card className="border shadow-sm bg-card rounded-2xl p-5 space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Monthly Financial Cap</span>
            <Wallet className="h-4 w-4 text-primary" />
          </div>
          <div className="space-y-1">
            <div className="text-xl font-bold text-foreground">
              {stats.monthlyProtectionUsed.toLocaleString()} DA / <span className="text-muted-foreground text-sm">{stats.monthlyProtectionLimit.toLocaleString()} DA</span>
            </div>
            <Progress value={usagePercentage} className="h-2 rounded-full" />
            <p className="text-[11px] text-muted-foreground pt-1 flex justify-between">
              <span>{usagePercentage}% consumed</span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">{stats.remainingMonthlyProtection.toLocaleString()} DA remaining</strong>
            </p>
          </div>
        </Card>

        {/* Protected Claims Count */}
        <Card className="border shadow-sm bg-card rounded-2xl p-5 space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Protected Orders</span>
            <RotateCcw className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="space-y-1">
            <div className="text-xl font-bold text-foreground">
              {stats.protectedRejectionsCount} / <span className="text-muted-foreground text-sm">{stats.maxProtectedRejectionsPerMonth} Cases</span>
            </div>
            <p className="text-[11px] text-muted-foreground pt-1">
              Maximum covered rejection events per calendar month under active tier.
            </p>
          </div>
        </Card>

        {/* Protection Health Status */}
        <Card className="border shadow-sm bg-card rounded-2xl p-5 space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Anti-Fraud Shield</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="space-y-1">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 font-bold text-xs">
              ✓ Good Standing (Low Fault Rate)
            </Badge>
            <p className="text-[11px] text-muted-foreground pt-1">
              Automatic platform reimbursement active for all eligible rejection reasons.
            </p>
          </div>
        </Card>
      </div>

      {/* Plan Benefits Checklist */}
      <Card className="border shadow-sm bg-card rounded-2xl p-5 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-primary" /> Active Plan Benefits ({stats.planName})
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-muted/30 rounded-xl flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span><strong>{stats.shippingProtectionPercentage}% Shipping Coverage:</strong> Platform absorbs half of logistics costs on refused packages.</span>
          </div>
          <div className="p-3 bg-muted/30 rounded-xl flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span><strong>Shared Liability Shield:</strong> 50% split automatically protected during customer misunderstandings.</span>
          </div>
          <div className="p-3 bg-muted/30 rounded-xl flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span><strong>Zero Buyer-Fault Fees:</strong> Buyer covers 100% of delivery fees when refusing without merchant defect.</span>
          </div>
          <div className="p-3 bg-muted/30 rounded-xl flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span><strong>Max Protection Cap:</strong> Up to 600 DA covered per individual refused order.</span>
          </div>
        </div>
      </Card>

      {/* Protected Claims Ledger Table */}
      <Card className="border shadow-sm bg-card rounded-2xl overflow-hidden">
        <div className="p-4 bg-muted/30 border-b flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <RotateCcw className="h-4 w-4 text-primary" /> Protected Rejection Claims History
          </h3>
          <span className="text-xs text-muted-foreground font-mono">
            {stats.activeProtectionClaims.length} records
          </span>
        </div>

        <div className="divide-y text-xs">
          {stats.activeProtectionClaims.map((claim) => (
            <div key={claim.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/10 transition-colors">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-foreground text-sm">{claim.orderNumber}</span>
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {claim.reasonCode.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">Claim Date: {claim.date}</p>
              </div>

              <div className="flex items-center gap-3 text-right">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Platform Contribution</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm sm:text-base">
                    +{claim.amountCoveredByPlatform.toLocaleString()} DA
                  </span>
                </div>
                <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                  ✓ Reimbursed
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
