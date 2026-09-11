'use client';

import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Play, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert, 
  ShieldCheck, 
  KeyRound, 
  Loader2, 
  RotateCcw,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import type { DeliveryInspectionSession } from '@/types/marketplaceArchitecture';

interface CourierInspectionCardProps {
  trackingNumber: string;
  orderNumber?: string;
  recipientName?: string;
  recipientPhone?: string;
  deliveryAgentId?: string;
  onSessionStarted?: (session: DeliveryInspectionSession) => void;
  onDeliveryVerified?: () => void;
}

export function CourierInspectionCard({
  trackingNumber,
  orderNumber,
  recipientName,
  recipientPhone,
  deliveryAgentId = 'drv_01',
  onSessionStarted,
  onDeliveryVerified,
}: CourierInspectionCardProps) {
  const [session, setSession] = useState<DeliveryInspectionSession | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isStarting, setIsStarting] = useState<boolean>(false);

  // Phase 4: OTP Verification State
  const [otpCode, setOtpCode] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isVerifiedSuccess, setIsVerifiedSuccess] = useState<boolean>(false);
  const [verifiedTime, setVerifiedTime] = useState<string>('');
  const [attemptsInfo, setAttemptsInfo] = useState<{ attempts: number; maxAttempts: number }>({ attempts: 0, maxAttempts: 5 });

  const fetchSession = async () => {
    try {
      const res = await fetch(`/api/shipments/${trackingNumber}/inspection`);
      const json = await res.json();
      if (json.success && json.data) {
        setSession(json.data.session);
        setRemainingSeconds(json.data.remainingSeconds || 0);
      }
    } catch (e) {
      console.error('Failed to load courier inspection:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
    const interval = setInterval(() => {
      setRemainingSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [trackingNumber]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Start Inspection Session
  const handleStartInspection = async () => {
    setIsStarting(true);
    try {
      const res = await fetch(`/api/shipments/${trackingNumber}/inspection/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryAgentId }),
      });
      const json = await res.json();
      if (json.success) {
        setSession(json.data.session);
        toast({
          title: 'بدأت مهلة المعاينة الميدانية ⏱️',
          description: 'تم بدء العداد وإخطار الزبون بفتح وفحص الطرد عند الباب.',
        });
        if (onSessionStarted) onSessionStarted(json.data.session);
      } else {
        throw new Error(json.error || 'Failed to start');
      }
    } catch (e: any) {
      toast({
        title: 'تعذر بدء المعاينة',
        description: e.message || 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    } finally {
      setIsStarting(false);
    }
  };

  // Phase 4: Handle Courier Enter Customer OTP Code
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otpCode || otpCode.trim().length < 4) {
      toast({
        title: 'يرجى إدخال كود الاستلام السري',
        description: 'اطلب من الزبون قراءة كود التأكيد الظاهر في شاشة هاتفه.',
        variant: 'destructive',
      });
      return;
    }

    setIsVerifying(true);
    try {
      const res = await fetch(`/api/shipments/${trackingNumber}/verify-delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: otpCode.trim(),
          deliveryAgentId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIsVerifiedSuccess(true);
        setVerifiedTime(new Date(json.data.verifiedAt).toLocaleTimeString('ar-DZ'));
        toast({
          title: 'تم تأكيد الاستلام بنجاح ✓',
          description: 'تم توثيق التسليم في سجل المنظومة بنجاح.',
        });
        if (onDeliveryVerified) onDeliveryVerified();
      } else {
        throw new Error(json.error || 'رمز التأكيد غير صحيح');
      }
    } catch (e: any) {
      toast({
        title: 'فشل التحقق من الكود',
        description: e.message || 'رمز التأكيد غير صحيح!',
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) return null;

  // View: Delivery Verified
  if (isVerifiedSuccess) {
    return (
      <Card className="rounded-3xl border-2 border-emerald-500/50 bg-emerald-500/10 shadow-lg text-right p-6 space-y-3 animate-fade-in">
        <div className="flex items-center justify-between">
          <Badge className="bg-emerald-600 text-white font-bold gap-1 px-3 py-1 text-xs">
            <CheckCircle2 className="h-4 w-4" />
            <span>تم تأكيد التسليم بنجاح (Delivery Verified)</span>
          </Badge>
          <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">{verifiedTime}</span>
        </div>
        <CardTitle className="text-base font-black text-foreground">
          اكتمل تسليم الشحنة {trackingNumber}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          تم التحقق الميداني من كود الأمان وتوثيق اكتمال التوصيل في النظام.
        </CardDescription>
      </Card>
    );
  }

  // View: Customer Accepted ➔ Ready for Courier OTP Entry
  if (session?.status === 'accepted') {
    return (
      <Card className="rounded-3xl border-2 border-primary/40 bg-card shadow-xl overflow-hidden text-right animate-scale-up">
        <CardHeader className="bg-primary/10 border-b border-primary/20 pb-3">
          <div className="flex items-center justify-between">
            <Badge className="bg-emerald-600 text-white font-bold text-xs gap-1">
              <Check className="h-3.5 w-3.5" />
              <span>وافق الزبون على استلام الطرد</span>
            </Badge>
            <span className="text-xs font-mono text-muted-foreground">{trackingNumber}</span>
          </div>
          <CardTitle className="text-base font-black pt-1">
            إدخال كود تأكيد الاستلام (Customer OTP Handover)
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            اطلب من الزبون الرمز المكون من 6 أرقام الظاهر على شاشة هاتفه لإثبات التسليم.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-5 space-y-4">
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span>أدخل رمز التأكيد السري:</span>
                <span className="text-[11px] text-muted-foreground font-normal">المحاولات المتبقية: 5</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="• • • • • •"
                  className="text-center font-mono text-2xl font-black tracking-widest h-14 rounded-2xl border-2 border-primary/50 bg-background"
                  autoFocus
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isVerifying || otpCode.length < 4}
              className="w-full h-12 rounded-2xl font-bold bg-primary text-primary-foreground shadow-lg gap-2 text-sm"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>جاري التحقق من الكود...</span>
                </>
              ) : (
                <>
                  <KeyRound className="h-5 w-5" />
                  <span>تأكيد التحقق وتسليم الطلب</span>
                </>
              )}
            </Button>
          </form>

          <div className="p-3 rounded-xl bg-muted/40 border text-[11px] text-muted-foreground flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-500" />
            <span>
              لا يمكن للمندوب تجاوز كود التأكيد. يضمن هذا الإجراء إثبات التسليم الميداني الفعلي للطرفين.
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // View: No session yet
  if (!session) {
    return (
      <Card className="rounded-3xl border-2 border-border/80 bg-card shadow-lg overflow-hidden text-right">
        <CardHeader className="bg-muted/30 pb-3">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs font-bold gap-1 bg-background">
              <Truck className="h-3.5 w-3.5 text-primary" />
              <span>مندوب التوصيل الميداني</span>
            </Badge>
            <span className="text-xs font-mono text-muted-foreground">{trackingNumber}</span>
          </div>
          <CardTitle className="text-base font-black pt-1">
            تسليم الطرد للزبون: {recipientName || 'الزبون'}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            عند الوصول للعنوان، ابدأ مهلة المعاينة الميدانية لتمكين الزبون من فحص الطرد.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4 space-y-3">
          <Button
            onClick={handleStartInspection}
            disabled={isStarting}
            className="w-full h-12 rounded-2xl font-black bg-primary text-primary-foreground shadow-md gap-2"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>وصلت للعنوان (بدء مهلة معاينة الطرد)</span>
          </Button>

          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-[11px] text-amber-700 dark:text-amber-400">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>قرار القبول أو الرفض يتخذه الزبون حصراً من شاشة هاتفه لضمان الشفافية.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // View: Inspection in progress
  return (
    <Card className="rounded-3xl border-2 border-amber-500/40 bg-amber-500/5 shadow-lg overflow-hidden text-right">
      <CardHeader className="bg-amber-500/10 pb-3 border-b border-amber-500/20">
        <div className="flex items-center justify-between">
          <Badge className="bg-amber-500 text-white font-bold text-xs gap-1 animate-pulse">
            <Clock className="h-3.5 w-3.5" />
            <span>جلسة المعاينة جارية الآن</span>
          </Badge>
          <span className="text-xs font-mono font-bold">{formatTimer(remainingSeconds)}</span>
        </div>
        <CardTitle className="text-base font-black pt-1">
          الزبون يقوم بفحص الطرد حالياً...
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          بمجرد أن يوافق الزبون، سيظهر كود الاستلام السري على شاشته لإدخاله هنا.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4 space-y-2.5 text-xs text-muted-foreground">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-background/80 border">
          <span>الزبون المستلم:</span>
          <span className="font-bold text-foreground">{recipientName || 'الزبون'}</span>
        </div>
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-background/80 border">
          <span>الهاتف:</span>
          <span className="font-mono font-bold text-foreground">{recipientPhone || '0550...'}</span>
        </div>
      </CardContent>
    </Card>
  );
}
