'use client';

import React, { useState, useEffect } from 'react';
import { 
  PackageCheck, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  Camera, 
  Upload, 
  Info,
  Sparkles,
  Eye,
  EyeOff,
  Copy,
  Check,
  Zap,
  ShieldCheck,
  KeyRound,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { DeliveryInspectionSession } from '@/types/marketplaceArchitecture';

interface CustomerInspectionModalProps {
  trackingNumber: string;
  orderNumber?: string;
  customerId?: string;
  onAccepted?: (session: DeliveryInspectionSession) => void;
  onRejected?: (session: DeliveryInspectionSession) => void;
}

export function CustomerInspectionModal({
  trackingNumber,
  orderNumber,
  customerId = 'usr_current',
  onAccepted,
  onRejected,
}: CustomerInspectionModalProps) {
  const [session, setSession] = useState<DeliveryInspectionSession | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [earlyRemainingSeconds, setEarlyRemainingSeconds] = useState<number>(0);
  const [canEarlyAccept, setCanEarlyAccept] = useState<boolean>(false);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [rejectionReasons, setRejectionReasons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Early Acceptance Confirmation Modal
  const [showEarlyAcceptConfirm, setShowEarlyAcceptConfirm] = useState<boolean>(false);

  // Rejection Flow State
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [rejectNotes, setRejectNotes] = useState<string>('');
  const [evidencePhotos, setEvidencePhotos] = useState<string[]>([]);
  const [checklist, setChecklist] = useState({
    package_intact: true,
    product_matches: true,
    no_visible_damage: true,
  });

  // Private Delivery Code Display State (Hidden by default)
  const [isCodeRevealed, setIsCodeRevealed] = useState<boolean>(false);
  const [deliveryCode, setDeliveryCode] = useState<string>('');
  const [isLoadingCode, setIsLoadingCode] = useState<boolean>(false);
  const [hasCopiedCode, setHasCopiedCode] = useState<boolean>(false);

  // 1. Fetch Session Status & Timers
  const fetchSession = async () => {
    try {
      const res = await fetch(`/api/shipments/${trackingNumber}/inspection`);
      const json = await res.json();
      if (json.success && json.data) {
        setSession(json.data.session);
        setRemainingSeconds(json.data.remainingSeconds || 0);
        setEarlyRemainingSeconds(json.data.earlyAcceptanceRemainingSeconds || 0);
        setCanEarlyAccept(json.data.canEarlyAccept || false);
        setIsExpired(json.data.isExpired || false);
        if (json.data.rejectionReasons) {
          setRejectionReasons(json.data.rejectionReasons);
        }
      }
    } catch (e) {
      console.error('Failed to load inspection session:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
    const interval = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });

      setEarlyRemainingSeconds(prev => {
        if (prev <= 1) {
          setCanEarlyAccept(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [trackingNumber]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Helper for Friendly Error Translations
  const getFriendlyError = (rawError?: string): string => {
    if (!rawError) return 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
    if (rawError.includes('Inspection session is not active') || rawError.includes('accepted')) {
      return 'تم قبول المنتج بالفعل. يمكنك الآن الانتقال مباشرة إلى رمز تأكيد الاستلام.';
    }
    if (rawError.includes('Minimum inspection period')) {
      return 'يرجى استكمال فترة الفحص الأساسية قبل التخطي المبكر.';
    }
    if (rawError.includes('Unauthorized')) {
      return 'لا يمكنك الوصول إلى هذه العملية.';
    }
    return rawError;
  };

  // 2. Fetch Private Delivery Code from Secure Backend
  const handleRevealCode = async () => {
    if (isCodeRevealed) {
      setIsCodeRevealed(false);
      return;
    }

    setIsLoadingCode(true);
    try {
      const activeCustomerId = session?.customer_id || customerId;
      const res = await fetch(`/api/shipments/${trackingNumber}/delivery-confirmation?customerId=${activeCustomerId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setDeliveryCode(json.data.code);
        setIsCodeRevealed(true);
      } else {
        throw new Error(json.error || 'تعذر جلب رمز تأكيد الاستلام.');
      }
    } catch (e: any) {
      toast({
        title: 'تنبيه تأكيد الاستلام',
        description: getFriendlyError(e.message),
        variant: 'destructive',
      });
    } finally {
      setIsLoadingCode(false);
    }
  };

  // 3. Handle Normal Accept Product
  const handleNormalAccept = async () => {
    setIsSubmitting(true);
    try {
      const activeCustomerId = session?.customer_id || customerId;
      const res = await fetch(`/api/shipments/${trackingNumber}/inspection/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: activeCustomerId,
          checklist,
          feedback: 'Product inspected and verified by customer at doorstep.',
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSession(json.data);
        toast({
          title: 'تم قبول ومطابقة المنتج بنجاح ✓',
          description: 'رمز الاستلام السري جاهز الآن. يرجى تزويده للمندوب لإتمام الاستلام.',
        });
        if (onAccepted) onAccepted(json.data);
      } else {
        throw new Error(json.error || 'Failed to accept');
      }
    } catch (e: any) {
      toast({
        title: 'تنبيه الفحص',
        description: getFriendlyError(e.message),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Handle Early Accept & Skip Remaining Time
  const handleEarlyAccept = async () => {
    setIsSubmitting(true);
    try {
      const activeCustomerId = session?.customer_id || customerId;
      const res = await fetch(`/api/shipments/${trackingNumber}/inspection/accept-early`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: activeCustomerId,
          checklist,
          feedback: 'Customer accepted early and skipped remaining inspection timer.',
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSession(json.data);
        setShowEarlyAcceptConfirm(false);
        toast({
          title: 'تم القبول الفوري بنجاح ⚡',
          description: 'تم قبول المنتج وتجهيز رمز تأكيد الاستلام السري.',
        });
        if (onAccepted) onAccepted(json.data);
      } else {
        throw new Error(json.error || 'Failed to early accept');
      }
    } catch (e: any) {
      toast({
        title: 'تنبيه الفحص',
        description: getFriendlyError(e.message),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Handle Reject Product
  const handleReject = async () => {
    if (!selectedReason) {
      toast({ title: 'يرجى اختيار سبب الرفض', variant: 'destructive' });
      return;
    }

    const reasonObj = rejectionReasons.find(r => r.code === selectedReason);
    if (reasonObj?.requiresEvidence && evidencePhotos.length === 0) {
      toast({
        title: 'صورة الإثبات مطلوبة',
        description: `السبب المختار (${reasonObj.titleAr}) يتطلب إرفاق صورة واحدة على الأقل.`,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const activeCustomerId = session?.customer_id || customerId;
      const res = await fetch(`/api/shipments/${trackingNumber}/inspection/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: activeCustomerId,
          reasonCode: selectedReason,
          customerNotes: rejectNotes,
          evidencePhotos,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSession(json.data);
        setShowRejectModal(false);
        toast({
          title: 'تم تسجيل رفض استلام الطرد ✕',
          description: 'تم إخطار التاجر ومندوب الشحن وإلغاء كود الاستلام.',
        });
        if (onRejected) onRejected(json.data);
      } else {
        throw new Error(json.error || 'Failed to reject');
      }
    } catch (e: any) {
      toast({
        title: 'خطأ أثناء تسجيل الرفض',
        description: getFriendlyError(e.message),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (deliveryCode || session?.private_delivery_code) {
      const codeToCopy = deliveryCode || session?.private_delivery_code || '583214';
      navigator.clipboard.writeText(codeToCopy);
      setHasCopiedCode(true);
      toast({ title: 'تم نسخ كود الاستلام السري بنجاح ✓' });
      setTimeout(() => setHasCopiedCode(false), 2000);
    }
  };

  const handleAddMockPhoto = () => {
    const mockUrl = `https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=300&auto=format&fit=crop&q=60`;
    setEvidencePhotos(prev => [...prev, mockUrl]);
  };

  if (isLoading || !session) {
    return null;
  }

  // View: Already accepted ➔ Clean Confirmation & Reveal Code Card
  if (session.status === 'accepted') {
    return (
      <Card className="rounded-3xl border-2 border-emerald-500/40 bg-card shadow-xl overflow-hidden animate-fade-in text-right">
        <CardHeader className="bg-emerald-500/10 border-b border-emerald-500/20 pb-4">
          <div className="flex items-center justify-between">
            <Badge className="bg-emerald-600 text-white font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>تم قبول المنتج بنجاح (Product Accepted ✓)</span>
            </Badge>
            <span className="text-xs font-mono text-muted-foreground">{trackingNumber}</span>
          </div>
          <CardTitle className="text-base sm:text-lg font-black text-foreground pt-1">
            رمز تأكيد الاستلام (Delivery Confirmation)
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            لقد أكدت فحص ومطابقة المنتج. رمز تأكيد الاستلام السري جاهز الآن لإعطائه لمندوب التوصيل عند التسليم الفعلي.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6 space-y-4">
          {/* Secret Code Presentation Container */}
          <div className="p-6 rounded-3xl bg-muted/30 border-2 border-dashed border-primary/40 flex flex-col items-center justify-center space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <KeyRound className="h-4 w-4 text-primary" />
              <span>رمز التحقق السري الخاص بك:</span>
            </div>

            {isCodeRevealed ? (
              <div className="flex flex-col items-center space-y-3 animate-scale-up">
                <div className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-primary bg-background px-6 py-2 rounded-2xl border-2 border-primary/50 shadow-inner">
                  {deliveryCode || session.private_delivery_code || '583214'}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRevealCode}
                    className="rounded-xl text-xs gap-1.5 font-bold h-8 border-muted-foreground/30"
                  >
                    <EyeOff className="h-3.5 w-3.5" />
                    <span>إخفاء الرمز</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyCode}
                    className="rounded-xl text-xs gap-1.5 font-bold h-8 border-primary/40 text-primary"
                  >
                    {hasCopiedCode ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{hasCopiedCode ? 'تم النسخ' : 'نسخ الرمز'}</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-3">
                <div className="text-2xl sm:text-3xl font-mono text-muted-foreground font-bold tracking-widest">
                  ••••••
                </div>
                <Button
                  onClick={handleRevealCode}
                  disabled={isLoadingCode}
                  className="rounded-2xl font-bold bg-primary text-primary-foreground shadow-md gap-2 px-6 h-11"
                >
                  {isLoadingCode ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>جاري جلب الرمز...</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      <span>إظهار رمز تأكيد الاستلام</span>
                    </>
                  )}
                </Button>
              </div>
            )}

            <div className="text-[11px] text-muted-foreground text-center">
              الحالة: <strong className="text-foreground">بانتظار التحقق الميداني من المندوب</strong>
            </div>
          </div>

          {/* Security Alert Notice */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-400">
            <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-bold">تنبيه أمان وحماية المستهلك:</div>
              <div className="text-[11px] leading-relaxed">
                أعطِ هذا الرمز لمندوب التوصيل فقط عند لحظة التسليم الفعلي بعد استلام كافة المنتجات بيدك. إعطاء الرمز يعتبر إقراراً نهائياً بالاستلام.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // View: Already rejected
  if (session.status === 'rejected') {
    return (
      <div className="p-5 rounded-3xl bg-destructive/10 border border-destructive/30 flex flex-col gap-2 text-right">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-destructive font-bold text-sm">
            <XCircle className="h-5 w-5 shrink-0" />
            <span>تم رفض استلام هذا الطرد أثناء جلسة المعاينة المباشرة.</span>
          </div>
          <Badge variant="destructive" className="text-xs font-bold">مرفوض ✕</Badge>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          تم تعطيل كود الاستلام نهائياً، والطلب مسجل في مسار المرتجعات وحماية المشتري لضمان حقوقك.
        </p>
      </div>
    );
  }

  // View: Active Inspection Session
  return (
    <Card className="rounded-3xl border-2 border-primary/40 bg-gradient-to-br from-card via-card to-primary/5 shadow-xl overflow-hidden animate-fade-in text-right">
      {/* Top Banner with live server timer */}
      <CardHeader className="bg-primary/10 border-b border-primary/20 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-500 text-white font-black text-xs px-2.5 py-0.5 rounded-full animate-pulse">
                جلسة معاينة نشطة الآن
              </Badge>
              <span className="text-xs text-muted-foreground">• وصل مندوب التوصيل لبابك</span>
            </div>
            <CardTitle className="text-lg sm:text-xl font-black text-foreground">
              افحص طلبك وتأكد من مطابقته قبل الاستلام
            </CardTitle>
          </div>

          {/* Live Countdown Timer */}
          <div className="flex items-center gap-2 bg-background/90 px-4 py-2 rounded-2xl border border-primary/30 shadow-inner">
            <Clock className={cn("h-5 w-5", remainingSeconds < 180 ? "text-destructive animate-spin" : "text-primary")} />
            <div className="text-left font-mono">
              <div className="text-base font-black text-foreground tracking-wider">
                {formatTimer(remainingSeconds)}
              </div>
              <div className="text-[9px] text-muted-foreground font-sans">الوقت المتبقي للمعاينة</div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          لديك مهلة <strong className="text-foreground">{session.max_duration_minutes} دقيقة</strong> لمعاينة المنتج، فتح الصندوق، والتأكد من سلامة الأجهزة والمقاسات قبل تأكيد الاستلام.
        </p>

        {/* Quick Inspection Checklist */}
        <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 space-y-2.5">
          <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <PackageCheck className="h-4 w-4 text-primary" />
            <span>قائمة التحقق الميداني:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <label className="flex items-center gap-2 p-2 rounded-xl bg-card border cursor-pointer hover:border-primary/50 transition-colors">
              <input
                type="checkbox"
                checked={checklist.package_intact}
                onChange={e => setChecklist({ ...checklist, package_intact: e.target.checked })}
                className="rounded accent-primary"
              />
              <span>سلامة التغليف الخارجي</span>
            </label>
            <label className="flex items-center gap-2 p-2 rounded-xl bg-card border cursor-pointer hover:border-primary/50 transition-colors">
              <input
                type="checkbox"
                checked={checklist.product_matches}
                onChange={e => setChecklist({ ...checklist, product_matches: e.target.checked })}
                className="rounded accent-primary"
              />
              <span>مطابقة المقاس واللون</span>
            </label>
            <label className="flex items-center gap-2 p-2 rounded-xl bg-card border cursor-pointer hover:border-primary/50 transition-colors">
              <input
                type="checkbox"
                checked={checklist.no_visible_damage}
                onChange={e => setChecklist({ ...checklist, no_visible_damage: e.target.checked })}
                className="rounded accent-primary"
              />
              <span>خلو المنتج من أي كسر</span>
            </label>
          </div>
        </div>

        {/* Early Acceptance Banner & Trigger Button */}
        {canEarlyAccept ? (
          <div className="p-4 rounded-2xl bg-primary/10 border border-primary/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-primary">
                <Sparkles className="h-4 w-4" />
                <span>أتممت الحد الأدنى للمعاينة ({session.minimum_inspection_minutes || 5} دقائق)</span>
              </div>
              <Badge className="bg-primary text-primary-foreground text-[10px] font-bold">متاح التخطي الآن</Badge>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              إذا تأكدت من سلامة المنتج، يمكنك قبول الطلب الآن وتجاوز الوقت المتبقي والانتقال مباشرة لرمز الاستلام.
            </p>
            <Button
              onClick={() => setShowEarlyAcceptConfirm(true)}
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl font-bold bg-primary text-primary-foreground shadow-md gap-2"
            >
              <Zap className="h-4 w-4 fill-current" />
              <span>قبول الطلب وتجاوز الوقت المتبقي</span>
            </Button>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-muted/30 border text-[11px] text-muted-foreground flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span>إمكانية القبول الفوري تتاح بعد إتمام الحد الأدنى ({session.minimum_inspection_minutes || 5} دقائق):</span>
            </div>
            <span className="font-mono font-bold text-foreground">{formatTimer(earlyRemainingSeconds)}</span>
          </div>
        )}

        {/* Standard Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <Button
            onClick={handleNormalAccept}
            disabled={isSubmitting || isExpired}
            className="h-12 rounded-2xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md gap-2"
          >
            <CheckCircle2 className="h-5 w-5" />
            <span>المنتج مطابق وسليم (قبول الاستلام)</span>
          </Button>

          <Button
            onClick={() => setShowRejectModal(true)}
            disabled={isSubmitting || isExpired}
            variant="outline"
            className="h-12 rounded-2xl font-bold border-destructive/40 text-destructive hover:bg-destructive/10 gap-2"
          >
            <XCircle className="h-5 w-5" />
            <span>رفض استلام المنتج</span>
          </Button>
        </div>
      </CardContent>

      {/* Clean Early Acceptance Confirmation Modal */}
      {showEarlyAcceptConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-3xl border shadow-2xl p-6 space-y-4 text-right animate-scale-up">
            <div className="flex items-center gap-2 text-primary font-black text-base border-b pb-3">
              <Zap className="h-5 w-5 fill-current" />
              <span>تأكيد القبول الفوري</span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              لقد أكملت مدة الفحص الأساسية. إذا كنت قد تحققت من المنتج وكان مطابقًا، يمكنك الآن قبول الطلب وتجاوز الوقت المتبقي.
            </p>

            <div className="p-3.5 rounded-2xl bg-muted/40 text-xs space-y-2 border">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">الفحص الأساسي:</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" />
                  <span>مكتمل ✓</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">الوقت المتبقي للمعاينة:</span>
                <span className="font-mono font-bold text-foreground">{formatTimer(remainingSeconds)}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleEarlyAccept}
                disabled={isSubmitting}
                className="flex-1 rounded-xl bg-primary text-primary-foreground font-bold h-11 gap-1.5 shadow-md"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>جاري التأكيد...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>تأكيد القبول الآن</span>
                  </>
                )}
              </Button>
              <Button
                onClick={() => setShowEarlyAcceptConfirm(false)}
                variant="ghost"
                className="rounded-xl h-11"
              >
                متابعة الفحص
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-3xl border shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto text-right animate-scale-up">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-destructive font-black text-base">
                <ShieldAlert className="h-5 w-5" />
                <span>تحديد سبب رفض استلام الطلب</span>
              </div>
              <button 
                onClick={() => setShowRejectModal(false)}
                className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              يرجى اختيار السبب الدقيق لرفض الطرد لضمان حفظ حقوقك وتطبيق سياسة استرجاع الأموال المناسبة.
            </p>

            {/* Rejection Reasons List */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {rejectionReasons.map(r => (
                <label
                  key={r.code}
                  className={cn(
                    "flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all",
                    selectedReason === r.code ? "bg-primary/10 border-primary font-bold text-foreground" : "bg-card border-border/60 hover:bg-muted/40"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="rejection_reason"
                      value={r.code}
                      checked={selectedReason === r.code}
                      onChange={() => setSelectedReason(r.code)}
                      className="accent-primary"
                    />
                    <span>{r.titleAr}</span>
                  </div>
                  {r.requiresEvidence && (
                    <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30">
                      صورة مطلوبة
                    </Badge>
                  )}
                </label>
              ))}
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">ملاحظات توضيحية إضافية (اختياري)</Label>
              <Textarea
                value={rejectNotes}
                onChange={e => setRejectNotes(e.target.value)}
                placeholder="اشرح المشكلة بالتفصيل (مثل: تم طلب مقاس 42 واستلمت مقاس 39)..."
                className="text-xs rounded-xl min-h-[60px]"
              />
            </div>

            {/* Photo Evidence Upload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold flex items-center gap-1.5">
                  <Camera className="h-3.5 w-3.5 text-primary" />
                  <span>صور الإثبات الميدانية ({evidencePhotos.length}/5)</span>
                </Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddMockPhoto}
                  className="h-7 text-xs rounded-lg gap-1 border-primary/40 text-primary"
                >
                  <Upload className="h-3 w-3" />
                  <span>التقاط / رفع صورة</span>
                </Button>
              </div>

              {evidencePhotos.length > 0 && (
                <div className="flex gap-2 overflow-x-auto py-1">
                  {evidencePhotos.map((url, idx) => (
                    <div key={idx} className="relative h-16 w-16 rounded-xl overflow-hidden border">
                      <img src={url} alt="Evidence" className="h-full w-full object-cover" />
                      <button
                        onClick={() => setEvidencePhotos(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute top-0.5 right-0.5 bg-destructive text-white rounded-full h-4 w-4 flex items-center justify-center text-[10px]"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Legal / Policy Disclaimer */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 text-[11px] text-amber-700 dark:text-amber-400">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                سيتم تحديد مسؤولية تكاليف الشحن والاسترجاع النهائي بناءً على سياسة سوق خدماتك المعتمدة وحماية البائع والمشتري.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleReject}
                disabled={isSubmitting || !selectedReason}
                className="flex-1 rounded-xl bg-destructive hover:bg-destructive/90 text-white font-bold h-10"
              >
                تأكيد رفض الاستلام
              </Button>
              <Button
                onClick={() => setShowRejectModal(false)}
                variant="ghost"
                className="rounded-xl h-10"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
