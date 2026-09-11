'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Bell, 
  Wallet, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  ExternalLink, 
  ArrowLeft, 
  Menu, 
  Copy,
  Check,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/AuthContext';
import { financialService } from '@/services/financialService';
import { TopUpRequest } from '@/types/financials';
import { useToast } from '@/hooks/use-toast';

interface AdminHeaderProps {
  onMobileMenuToggle?: () => void;
}

export function AdminHeader({ onMobileMenuToggle }: AdminHeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const [pendingTopUps, setPendingTopUps] = useState<TopUpRequest[]>([]);
  const [totalUnderReview, setTotalUnderReview] = useState(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [lastNotifiedId, setLastNotifiedId] = useState<string | null>(null);

  // Play subtle administrative chime sound for incoming alerts
  const playAlertSound = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, audioCtx.currentTime + 0.15); // G5
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch {
      // Audio context might be restricted before user gesture
    }
  }, []);

  const loadData = useCallback(async () => {
    const list = financialService.getTopUpRequests();
    const underReview = list.filter(
      r => r.status === 'UNDER_REVIEW' || r.status === 'PENDING_PAYMENT_CONFIRMATION' || r.status === 'PENDING_VERIFICATION'
    );
    setPendingTopUps(underReview.slice(0, 8));
    setTotalUnderReview(underReview.length);

    try {
      const serverSynced = await financialService.syncTopUpsFromServer();
      const serverReview = serverSynced.filter(
        r => r.status === 'UNDER_REVIEW' || r.status === 'PENDING_PAYMENT_CONFIRMATION' || r.status === 'PENDING_VERIFICATION'
      );
      setPendingTopUps(serverReview.slice(0, 8));
      setTotalUnderReview(serverReview.length);
    } catch {}
  }, []);

  useEffect(() => {
    loadData();

    // Handle incoming live top-up alerts
    const handleNewTopUp = (e: any) => {
      loadData();
      const req: TopUpRequest | undefined = e.detail;
      if (req && req.id !== lastNotifiedId) {
        setLastNotifiedId(req.id);
        playAlertSound();
        toast({
          title: '⚡ طلب شحن رصيد جديد بحاجة لمطابقة!',
          description: `المستخدم: ${req.userName} | المبلغ: ${req.amount.toLocaleString()} DA | كود: ${req.postalTransactionCode || req.publicRequestNumber}`,
          action: (
            <Button
              size="sm"
              variant="outline"
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-8"
              onClick={() => router.push(`/admin/dashboard?section=topup-management&requestId=${req.publicRequestNumber}`)}
            >
              فحص واعتماد
            </Button>
          ),
          duration: 10000,
        });
      }
    };

    const handleGenericUpdate = () => {
      loadData();
    };

    window.addEventListener('khidmatik:admin-new-topup', handleNewTopUp);
    window.addEventListener('khidmatik:topup-updated', handleGenericUpdate);
    window.addEventListener('storage', handleGenericUpdate);

    // Light polling every 3 seconds for zero-lag cross-tab synchronization
    const interval = setInterval(loadData, 3000);

    return () => {
      window.removeEventListener('khidmatik:admin-new-topup', handleNewTopUp);
      window.removeEventListener('khidmatik:topup-updated', handleGenericUpdate);
      window.removeEventListener('storage', handleGenericUpdate);
      clearInterval(interval);
    };
  }, [loadData, lastNotifiedId, playAlertSound, router, toast]);

  const handleCopy = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const navigateToTopUp = (req: TopUpRequest) => {
    router.push(`/admin/dashboard?section=topup-management&requestId=${req.publicRequestNumber}`);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border/80 bg-background/95 px-4 sm:px-6 backdrop-blur-md shadow-xs">
      {/* Left: Mobile Trigger & Platform Breadcrumb */}
      <div className="flex items-center gap-3">
        {onMobileMenuToggle && (
          <Button
            size="icon"
            variant="outline"
            className="md:hidden h-9 w-9 rounded-xl"
            onClick={onMobileMenuToggle}
            aria-label="Toggle Menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-foreground hidden sm:inline-block">
            لوحة الإشراف العام المالي والتشغيلي
          </span>
          <Badge variant="outline" className="text-[10px] uppercase font-mono font-bold bg-primary/5 text-primary border-primary/20">
            Super Admin
          </Badge>
        </div>
      </div>

      {/* Right: Actions, Notification Dropdown & Admin Profile */}
      <div className="flex items-center gap-2.5">
        {/* Quick Pending Top-Up Banner Button */}
        {totalUnderReview > 0 && (
          <Button
            size="sm"
            onClick={() => router.push('/admin/dashboard?section=topup-management')}
            className="h-8 px-3 rounded-full text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1.5 animate-pulse"
          >
            <Clock className="h-3.5 w-3.5 text-amber-600" />
            <span>{totalUnderReview} طلب شحن رصيد بالانتظار</span>
          </Button>
        )}

        {/* Live Admin Actionable Notification Bell */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="relative h-9 w-9 rounded-xl border-border/80 bg-card hover:bg-muted/60"
              aria-label="إشعارات الإدارة"
            >
              <Bell className="h-4 w-4 text-foreground" />
              {totalUnderReview > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[9px] font-black text-white shadow-xs animate-bounce">
                  {totalUnderReview}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[340px] sm:w-[380px] p-0 rounded-2xl shadow-xl border-border">
            <div className="p-3.5 bg-muted/40 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold text-foreground">طلبات شحن الرصيد الواردة</span>
              </div>
              <Badge variant={totalUnderReview > 0 ? "destructive" : "outline"} className="text-[10px] font-bold">
                {totalUnderReview} قيد المراجعة
              </Badge>
            </div>

            <div className="max-h-[340px] overflow-y-auto divide-y divide-border/60">
              {pendingTopUps.length === 0 ? (
                <div className="py-8 text-center px-4 space-y-2">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                  <p className="text-xs font-bold text-foreground">لا توجد طلبات شحن معلقة حالياً</p>
                  <p className="text-[11px] text-muted-foreground">كافة عمليات الشحن السابقة تم تدقيقها واعتمادها بنجاح.</p>
                </div>
              ) : (
                pendingTopUps.map((req) => (
                  <div
                    key={req.id}
                    onClick={() => navigateToTopUp(req)}
                    className="p-3 hover:bg-muted/50 cursor-pointer transition-colors space-y-1.5 text-right group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-muted-foreground" dir="ltr">
                        {req.publicRequestNumber}
                      </span>
                      <strong className="text-xs font-black text-primary font-mono" dir="ltr">
                        +{req.amount.toLocaleString()} DA
                      </strong>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground truncate max-w-[170px]">
                        {req.userName}
                      </span>
                      <Badge variant="outline" className="text-[9px] uppercase font-bold">
                        {req.paymentMethod}
                      </Badge>
                    </div>

                    {/* Postal Transaction Code Highlight */}
                    <div className="flex items-center justify-between p-1.5 rounded-lg bg-background border border-border/80 text-[11px]">
                      <span className="text-muted-foreground text-[10px]">كود العملية البريدية:</span>
                      <div className="flex items-center gap-1.5 font-mono font-bold text-foreground" dir="ltr">
                        <span>{req.postalTransactionCode || 'غير مدخل'}</span>
                        {req.postalTransactionCode && (
                          <button
                            type="button"
                            onClick={(e) => handleCopy(e, req.postalTransactionCode!)}
                            className="p-1 hover:bg-muted rounded text-primary transition-colors"
                            title="نسخ كود العملية"
                          >
                            {copiedCode === req.postalTransactionCode ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-0.5 text-[10px] text-muted-foreground">
                      <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 font-semibold">
                        <Clock className="h-3 w-3" /> بانتظار التدقيق والمطابقة
                      </span>
                      <span className="group-hover:text-primary font-bold flex items-center gap-0.5">
                        فحص الآن <ArrowLeft className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-2 border-t border-border bg-muted/20 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                className="text-[11px] h-7 w-full font-bold text-primary hover:text-primary"
                onClick={() => router.push('/admin/dashboard?section=topup-management')}
              >
                فتح مكتب مطابقة وشحن الأرصدة بالكامل
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Back to Website */}
        <Link href="/" target="_blank">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-9 rounded-xl text-muted-foreground hover:text-foreground hidden sm:flex items-center gap-1"
          >
            <span>الموقع الرئيسي</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </Link>

        {/* Admin Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-9 px-2.5 rounded-xl flex items-center gap-2 hover:bg-muted/60">
              <div className="h-7 w-7 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="text-right hidden lg:block">
                <p className="text-xs font-bold leading-none text-foreground">{user?.name || 'Super Admin'}</p>
                <p className="text-[10px] text-muted-foreground leading-none mt-0.5">{user?.email || 'admin@khidmatik.dz'}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg">
            <DropdownMenuLabel className="text-xs font-bold">حساب المشرف</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/admin/dashboard?section=topup-management')} className="text-xs cursor-pointer">
              <Wallet className="mr-2 h-4 w-4" /> طلبات الشحن
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/admin/dashboard?section=system-configuration')} className="text-xs cursor-pointer">
              <ShieldCheck className="mr-2 h-4 w-4" /> إعدادات المنصة
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-xs text-rose-600 focus:text-rose-600 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" /> تسجيل الخروج
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
