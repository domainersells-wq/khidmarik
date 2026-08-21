'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Coins, 
  Sparkles, 
  Check, 
  Calendar, 
  Flame, 
  Gift, 
  TrendingUp, 
  ShoppingBag, 
  CheckCircle2
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/hooks/use-toast';

interface CoinsDailyCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCoinsUpdated?: (newTotal: number) => void;
}

export function CoinsDailyCheckinModal({
  isOpen,
  onClose,
  onCoinsUpdated
}: CoinsDailyCheckinModalProps) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const { toast } = useToast();

  const [totalCoins, setTotalCoins] = useState(380);
  const [currentStreak, setCurrentStreak] = useState(3);
  const [hasClaimedToday, setHasClaimedToday] = useState(false);

  const streakDays = [
    { day: 1, reward: 10, claimed: true },
    { day: 2, reward: 20, claimed: true },
    { day: 3, reward: 30, claimed: true },
    { day: 4, reward: 40, claimed: false, isToday: true },
    { day: 5, reward: 50, claimed: false },
    { day: 6, reward: 70, claimed: false },
    { day: 7, reward: 100, claimed: false, isSuperGift: true },
  ];

  const handleClaimToday = () => {
    if (hasClaimedToday) return;
    const todayReward = 40;
    const nextTotal = totalCoins + todayReward;
    setTotalCoins(nextTotal);
    setCurrentStreak(4);
    setHasClaimedToday(true);
    onCoinsUpdated?.(nextTotal);

    toast({
      title: isAr ? '🎉 مبروك! حصلت على +40 عملة ذهبية' : '🎉 Claimed +40 Coins!',
      description: isAr ? 'تُخصم العملات تلقائياً عند الدفع (100 عملة = 100 دج خصم مباشر).' : 'Coins automatically apply as discounts at checkout.'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl p-6 rounded-3xl" dir={isAr ? 'rtl' : 'ltr'}>
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Coins className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black flex items-center gap-2">
                {isAr ? 'مركز العملات والمكافآت اليومية (Khidmatik Coins)' : 'Daily Coins & Rewards Center'}
                <Badge className="bg-amber-500 text-white font-bold text-[10px]">
                  {isAr ? 'خصومات نقدية' : 'Instant Cash Back'}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs">
                {isAr 
                  ? 'سجّل دخولك يومياً واجمع العملات الذهبية لتحويلها إلى خصم مباشر عند الشراء' 
                  : 'Check-in daily to earn coins redeemable for direct discounts on all purchases'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          
          {/* Balance & Streak Banner */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-white shadow-lg flex justify-between items-center relative overflow-hidden">
            <div className="space-y-1 relative z-10">
              <span className="text-xs font-bold text-white/85 flex items-center gap-1.5">
                <Coins className="h-4 w-4" />
                {isAr ? 'رصيدك الإجمالي من العملات:' : 'Your Coin Balance:'}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black font-mono tracking-tight" suppressHydrationWarning>{totalCoins}</span>
                <span className="text-xs font-bold text-white/90" suppressHydrationWarning>
                  ≈ {totalCoins} {isAr ? 'دج خصم مباشر' : 'DA discount'}
                </span>
              </div>
            </div>

            <div className="text-left bg-white/20 backdrop-blur-md p-3 rounded-2xl border border-white/25 relative z-10">
              <div className="flex items-center gap-1 text-xs font-black">
                <Flame className="h-4 w-4 text-orange-200 fill-orange-200" />
                <span>{currentStreak} {isAr ? 'أيام متتالية' : 'Days Streak'}</span>
              </div>
              <span className="text-[10px] text-white/80 block mt-0.5">
                {isAr ? 'حافظ على السلسلة لمكافأة اليوم 7' : 'Reach Day 7 for 100 coins'}
              </span>
            </div>
          </div>

          {/* 7-Day Streak Calendar Grid */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              {isAr ? 'سلسلة الحضور اليومي لـ 7 أيام:' : '7-Day Check-in Calendar:'}
            </span>

            <div className="grid grid-cols-7 gap-2 text-center">
              {streakDays.map((item) => {
                const isClaimed = item.claimed || (item.isToday && hasClaimedToday);
                const isAvailableToClaim = item.isToday && !hasClaimedToday;

                return (
                  <div
                    key={item.day}
                    className={`p-2.5 rounded-2xl border flex flex-col items-center justify-between gap-1.5 transition-all ${
                      isClaimed 
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 text-emerald-700 dark:text-emerald-300' 
                        : isAvailableToClaim 
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 ring-2 ring-amber-400/40 animate-pulse' 
                        : 'bg-card border-slate-200 dark:border-slate-800 text-muted-foreground'
                    }`}
                  >
                    <span className="text-[10px] font-bold">يوم {item.day}</span>
                    
                    <div className="h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs bg-amber-500/10 text-amber-600">
                      {isClaimed ? <Check className="h-4 w-4 stroke-[3] text-emerald-600" /> : `+${item.reward}`}
                    </div>

                    <span className="text-[9px] font-bold">
                      {item.isSuperGift ? '🎁 سوبر' : 'عملة'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Claim Action Button */}
          <div className="pt-2">
            <Button
              onClick={handleClaimToday}
              disabled={hasClaimedToday}
              className={`w-full font-black text-sm h-12 rounded-2xl shadow-md transition-all ${
                hasClaimedToday 
                  ? 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400' 
                  : 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white shadow-amber-500/25'
              }`}
            >
              {hasClaimedToday ? (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {isAr ? 'تم استلام مكافأة اليوم بنجاح ✓' : 'Today\'s Reward Claimed ✓'}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  {isAr ? 'استلام عملات اليوم (+40 عملة)' : 'Claim Today\'s Coins (+40 Coins)'}
                </span>
              )}
            </Button>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
