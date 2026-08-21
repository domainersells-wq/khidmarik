'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  AlertOctagon, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  Wrench, 
  User, 
  Phone, 
  Star, 
  Navigation, 
  Sparkles, 
  KeyRound, 
  Camera, 
  Receipt, 
  AlertTriangle, 
  HelpCircle, 
  ArrowRight,
  RotateCcw,
  Check,
  Building2,
  Lock,
  Eye,
  MessageSquare,
  Radio,
  Volume2,
  VolumeX,
  Compass,
  Car
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  CraftsmanOrder, 
  CraftsmanOrderStatus, 
  ServiceEmergencyCategory, 
  QuotationDetails, 
  JobVerificationPhotos, 
  OtpSecurityState, 
  MutualReviewState 
} from '@/types/craftsmen';
import { craftsmenService } from '@/services/craftsmenService';

import { EmergencySOSButton } from './EmergencySOSButton';
import { EmergencyWakeupAlertModal } from './EmergencyWakeupAlertModal';
import { DualStepOtpModal } from './DualStepOtpModal';
import { BeforeAfterPhotoCapture } from './BeforeAfterPhotoCapture';
import { QuotationPartsCostManager } from './QuotationPartsCostManager';
import { MutualTwoWayReviewModal } from './MutualTwoWayReviewModal';

interface CraftsmenDispatchContainerProps {
  forcedRole?: 'customer' | 'craftsman' | 'admin';
}

export function CraftsmenDispatchContainer({ forcedRole }: CraftsmenDispatchContainerProps) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const { toast } = useToast();
  const { user } = useAuth();

  // Determine active role dynamically: forcedRole > user auth profile > fallback
  const resolvedRole: 'customer' | 'craftsman' | 'admin' = forcedRole || (
    user?.role === 'admin' 
      ? 'admin' 
      : (user?.userType === 'professional' || (user as any)?.storeId)
      ? 'craftsman'
      : 'customer'
  );

  // Active Order State loaded from Service
  const [order, setOrder] = useState<CraftsmanOrder>(() => craftsmenService.getActiveOrder());
  const [isOnDuty, setIsOnDuty] = useState<boolean>(() => craftsmenService.getDutyStatus());
  const [isAudioAlarmEnabled, setIsAudioAlarmEnabled] = useState<boolean>(true);

  // Listen to cross-window or state updates
  useEffect(() => {
    const handleOrderSync = (e: any) => {
      if (e.detail) setOrder(e.detail);
    };
    window.addEventListener('khidmatik_order_updated', handleOrderSync);
    return () => window.removeEventListener('khidmatik_order_updated', handleOrderSync);
  }, []);

  // Modals visibility
  const [isWakeupModalOpen, setIsWakeupModalOpen] = useState(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpModalType, setOtpModalType] = useState<'START' | 'COMPLETION'>('START');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Web Audio Alarm Synthesizer for Emergency Broadcasts
  const playEmergencyAlarmSound = () => {
    if (!isAudioAlarmEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (err) {
      console.warn('Audio playback not supported or user gesture needed:', err);
    }
  };

  // Status Flow Helper
  const statusSteps: { key: CraftsmanOrderStatus; titleAr: string; titleEn: string; descAr: string; descEn: string }[] = [
    { key: 'REQUESTED', titleAr: 'بث الطلب (SOS)', titleEn: 'SOS Broadcast', descAr: 'بث الطلب للحرفيين في النطاق', descEn: 'Searching nearby pros' },
    { key: 'ACCEPTED', titleAr: 'تم القبول', titleEn: 'Accepted', descAr: 'تم قبول الطلب وتعيين الحرفي', descEn: 'Craftsman assigned' },
    { key: 'EN_ROUTE', titleAr: 'في الطريق', titleEn: 'En Route', descAr: 'الحرفي متوجه لموقع العميل', descEn: 'Heading to location' },
    { key: 'ARRIVED', titleAr: 'وصل للموقع', titleEn: 'Arrived', descAr: 'وصل لمكان العمل بانتظار OTP البدء', descEn: 'Awaiting Start OTP' },
    { key: 'OTP_STARTED', titleAr: 'تحقق البدء (OTP)', titleEn: 'Start OTP Verified', descAr: 'تم مطابقة الرمز وبدء التوثيق', descEn: 'Handshake complete' },
    { key: 'IN_PROGRESS', titleAr: 'جاري التنفيذ', titleEn: 'In Progress', descAr: 'جاري أعمال الصيانة وتركيب القطع', descEn: 'Executing repairs' },
    { key: 'OTP_COMPLETED', titleAr: 'تحقق الإنجاز (OTP)', titleEn: 'Completed OTP', descAr: 'تم فحص العمل واستلام رمز الإغلاق', descEn: 'Inspection verified' },
    { key: 'REVIEWED', titleAr: 'تم التقييم المتبادل', titleEn: 'Reviewed', descAr: 'اكتمل التقييم المزدوج والسمعة', descEn: 'Double-blind finished' }
  ];

  const currentStepIndex = statusSteps.findIndex(s => s.key === order.status);

  // --- Operational Actions ---
  const handleTriggerSOS = (category: ServiceEmergencyCategory, radiusKm: number, surgeFeeDA: number) => {
    const newEmergencyOrder = craftsmenService.createEmergencyOrder(
      category,
      radiusKm,
      surgeFeeDA,
      user ? {
        name: user.name || 'عميل خدماتك',
        phone: user.email ? '0550 12 34 56' : '0550 12 34 56',
        wilaya: 'الجزائر العاصمة (Alger)',
        address: 'حي 150 مسكن، دالي إبراهيم'
      } : undefined
    );

    setOrder(newEmergencyOrder);

    toast({
      title: isAr ? '🚨 تم إطلاق نداء الطوارئ الفوري!' : '🚨 SOS Broadcasted!',
      description: isAr ? `جاري البحث عن الحرفيين في نطاق ${radiusKm} كم...` : `Broadcasting to pros in ${radiusKm} km radius...`
    });

    playEmergencyAlarmSound();

    // Auto trigger craftsman wake-up alert if duty is active
    if (isOnDuty) {
      setTimeout(() => {
        setIsWakeupModalOpen(true);
      }, 1000);
    }
  };

  const updateOrderStatus = (nextStatus: CraftsmanOrderStatus, extraData: Partial<CraftsmanOrder> = {}) => {
    const updated: CraftsmanOrder = {
      ...order,
      ...extraData,
      status: nextStatus,
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };
    setOrder(updated);
    craftsmenService.saveOrder(updated);
  };

  const handleCraftsmanAcceptOrder = () => {
    setIsWakeupModalOpen(false);
    updateOrderStatus('ACCEPTED');
    toast({
      title: isAr ? '🎉 تم قبول الطلب بنجاح!' : '🎉 Job Accepted!',
      description: isAr ? 'تم إشعار العميل وتجهيز مسار التوجه للموقع.' : 'Customer notified. Navigation active.'
    });
  };

  const handleCraftsmanDeclineOrder = () => {
    setIsWakeupModalOpen(false);
    toast({
      title: isAr ? 'تم الاعتذار عن الطلب' : 'Job Declined',
      description: isAr ? 'تم تحويل الطلب تلقائياً للحرفي التالي في النطاق.' : 'Escalated to next available craftsman.'
    });
  };

  const handleCraftsmanStartRoute = () => {
    updateOrderStatus('EN_ROUTE');
    toast({
      title: isAr ? '🚗 الحرفي في الطريق إلى موقعك' : '🚗 Craftsman En Route',
      description: isAr ? 'الوقت المقدر للوصول: 12 دقيقة.' : 'Estimated arrival: 12 mins.'
    });
  };

  const handleCraftsmanArrive = () => {
    updateOrderStatus('ARRIVED');
    toast({
      title: isAr ? '📍 وصل الحرفي إلى الموقع' : '📍 Craftsman Arrived',
      description: isAr ? 'يرجى تزويد الحرفي برمز التحقق (Start OTP) لبدء العمل.' : 'Please provide Start OTP to begin job.'
    });
  };

  const handleOpenOtpModal = (type: 'START' | 'COMPLETION') => {
    setOtpModalType(type);
    setIsOtpModalOpen(true);
  };

  const handleOtpSuccess = (type: 'START' | 'COMPLETION') => {
    if (type === 'START') {
      updateOrderStatus('IN_PROGRESS', {
        otpSecurity: { ...order.otpSecurity, isStartOtpVerified: true }
      });
    } else {
      updateOrderStatus('OTP_COMPLETED', {
        otpSecurity: { ...order.otpSecurity, isCompletionOtpVerified: true }
      });
    }
  };

  const handleLockoutEscalate = (reason: string) => {
    updateOrderStatus('DISPUTED', {
      otpSecurity: { ...order.otpSecurity, isLockedOut: true, lockoutReason: reason }
    });
  };

  const handleReviewSubmitted = (updatedReviews: MutualReviewState) => {
    updateOrderStatus(updatedReviews.isRevealed ? 'REVIEWED' : order.status, {
      reviews: updatedReviews
    });
  };

  const handleDutyToggle = (checked: boolean) => {
    setIsOnDuty(checked);
    craftsmenService.setDutyStatus(checked);
    toast({
      title: checked 
        ? (isAr ? '🟢 أنت الآن متاح لاستقبال نداءات الطوارئ 24/7' : '🟢 You are now On Duty for SOS Calls')
        : (isAr ? '🔴 تم إيقاف استقبال الطلبات الطارئة مؤقتاً' : '🔴 You are now Offline for SOS Calls'),
    });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Header Information & Duty Controls for Craftsmen */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black font-headline tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <Wrench className="h-8 w-8 text-primary" />
              {isAr ? 'منظومة الحرفيين والتدخلات الطارئة (SOS)' : 'On-Demand Craftsmen Dispatch'}
            </h1>
            <Badge className="bg-emerald-600 text-white font-bold text-xs uppercase">
              Live Verified
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
            {isAr 
              ? 'إدارة التدخلات العاجلة مع تسعير شفاف لقطع الغيار، التوثيق البصري الإلزامي، ومصادقة التحقق الأمني المزدوج (Dual-OTP).' 
              : 'Enterprise dispatch with transparent parts quotes, before/after photo proof & dual-step OTP handshake.'}
          </p>
        </div>

        {/* Craftsman Duty Switch (When in Craftsman view) */}
        {resolvedRole === 'craftsman' && (
          <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border">
            <div className="space-y-0.5">
              <Label className="text-xs font-bold flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${isOnDuty ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                {isAr ? 'حالة الجاهزية (On Duty):' : 'Duty Availability:'}
              </Label>
              <span className="text-[10px] text-muted-foreground block">
                {isOnDuty 
                  ? (isAr ? 'مستعد لاستقبال نداءات الطوارئ' : 'Ready for live emergency alerts')
                  : (isAr ? 'غير متاح حالياً' : 'Offline / Paused')}
              </span>
            </div>
            <Switch 
              checked={isOnDuty}
              onCheckedChange={handleDutyToggle}
            />
          </div>
        )}
      </div>

      {/* Emergency SOS Trigger & Order Status Tracker */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
              {isAr ? 'حالة الطلب الحالية:' : 'Live Order Progress:'}
            </span>
            <Badge className="bg-primary text-primary-foreground font-mono text-xs px-3 py-1 font-bold">
              #{order.id} • {order.status}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <EmergencySOSButton onTriggerSOS={handleTriggerSOS} />
          </div>
        </div>

        {/* State Machine Step Progress Timeline */}
        <div className="p-4 rounded-2xl bg-card border shadow-sm overflow-x-auto">
          <div className="flex items-center justify-between min-w-[750px] relative">
            <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0" />
            
            {statusSteps.map((step, idx) => {
              const isPast = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div key={step.key} className="relative z-10 flex flex-col items-center text-center gap-1.5 max-w-[100px]">
                  <div 
                    className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs shadow-sm transition-all duration-300 ${
                      isPast 
                        ? 'bg-emerald-600 text-white' 
                        : isCurrent 
                        ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110' 
                        : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground border'
                    }`}
                  >
                    {isPast ? <Check className="h-4 w-4 stroke-[3]" /> : idx + 1}
                  </div>
                  <span className={`text-[11px] font-bold leading-tight ${isCurrent ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>
                    {isAr ? step.titleAr : step.titleEn}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Operational Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Context Card & Dynamic Step Actions (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Order Details & Contact Card */}
          <Card className="shadow-md border overflow-hidden">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/60 border-b pb-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <img 
                    src={resolvedRole === 'craftsman' ? order.customer.avatarUrl : order.craftsman.avatarUrl} 
                    alt="Avatar" 
                    className="h-12 w-12 rounded-xl object-cover border shadow-sm" 
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-bold">
                        {resolvedRole === 'craftsman' ? order.customer.name : order.craftsman.name}
                      </CardTitle>
                      <Badge className="bg-amber-500 text-white text-[10px] flex items-center gap-1">
                        <Star className="h-3 w-3 fill-white" />
                        {resolvedRole === 'craftsman' ? order.customer.rating : order.craftsman.rating}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs mt-0.5">
                      {resolvedRole === 'craftsman'
                        ? `${order.customer.address} (${order.customer.wilaya})`
                        : `${order.craftsman.specialtyAr} • ${order.craftsman.completedJobsCount} ${isAr ? 'عمل منجز' : 'jobs done'}`}
                    </CardDescription>
                  </div>
                </div>

                <div className="text-right">
                  <Badge variant="outline" className="text-xs font-mono font-bold border-red-300 text-red-600 bg-red-50 dark:bg-red-950/30">
                    {order.isEmergency ? '🚨 SOS EMERGENCY' : 'STANDARD'}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {/* Dynamic Action Buttons based on Role and Status */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase text-muted-foreground">
                    {isAr ? 'الإجراء التشغيلي للخطوة الحالية:' : 'Active Action:'}
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    {isAr ? 'المرحلة قيد المتابعة' : 'In Execution'}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {/* Step 1: Accept/Dispatch */}
                  {order.status === 'REQUESTED' && resolvedRole === 'craftsman' && (
                    <Button 
                      onClick={() => setIsWakeupModalOpen(true)}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs gap-1.5"
                    >
                      <AlertOctagon className="h-4 w-4" />
                      {isAr ? 'فتح إنذار الطوارئ والقبول' : 'View Emergency Alert'}
                    </Button>
                  )}

                  {/* Step 2: En Route */}
                  {order.status === 'ACCEPTED' && resolvedRole === 'craftsman' && (
                    <Button 
                      onClick={handleCraftsmanStartRoute}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs gap-1.5"
                    >
                      <Navigation className="h-4 w-4" />
                      {isAr ? 'بدء التوجه لموقع العميل (En Route)' : 'Start Route to Client'}
                    </Button>
                  )}

                  {/* Step 3: Arrived */}
                  {order.status === 'EN_ROUTE' && resolvedRole === 'craftsman' && (
                    <Button 
                      onClick={handleCraftsmanArrive}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5"
                    >
                      <MapPin className="h-4 w-4" />
                      {isAr ? 'تأكيد الوصول إلى باب العميل (Arrived)' : 'Confirm Arrival at Door'}
                    </Button>
                  )}

                  {/* Step 4: Start OTP Handshake */}
                  {order.status === 'ARRIVED' && (
                    <Button 
                      onClick={() => handleOpenOtpModal('START')}
                      className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs gap-1.5 shadow-md"
                    >
                      <KeyRound className="h-4 w-4" />
                      {resolvedRole === 'customer' 
                        ? (isAr ? 'عرض رمز بدء العمل (Start OTP)' : 'View Start OTP Code')
                        : (isAr ? 'إدخال رمز بدء العمل من العميل' : 'Input Start OTP')}
                    </Button>
                  )}

                  {/* Step 5: Completion OTP Handshake */}
                  {order.status === 'IN_PROGRESS' && (
                    <Button 
                      onClick={() => handleOpenOtpModal('COMPLETION')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-md"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {resolvedRole === 'customer' 
                        ? (isAr ? 'فحص العمل وإعطاء رمز الإغلاق' : 'Inspect & Give Completion OTP')
                        : (isAr ? 'إدخال رمز إغلاق العمل (Completion OTP)' : 'Enter Completion OTP')}
                    </Button>
                  )}

                  {/* Step 6: Mutual Two-Way Review */}
                  {(order.status === 'OTP_COMPLETED' || order.status === 'REVIEWED') && (
                    <Button 
                      onClick={() => setIsReviewModalOpen(true)}
                      className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-bold text-xs gap-1.5 shadow-md"
                    >
                      <Star className="h-4 w-4" />
                      {isAr ? 'التقييم المتبادل ونظام السمعة (Double-Blind)' : 'Mutual Rating Modal'}
                    </Button>
                  )}
                </div>
              </div>

              {/* Masked Contact Security Indicator (Feature RBAC) */}
              <div className="p-3 rounded-xl border bg-slate-50 dark:bg-slate-900/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-emerald-600" />
                  <span className="font-semibold text-muted-foreground">
                    {isAr ? 'أمان الخصوصية (RBAC):' : 'Privacy Protection:'}
                  </span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {order.status === 'EN_ROUTE' || order.status === 'IN_PROGRESS' 
                      ? (resolvedRole === 'craftsman' ? order.customer.phone : order.craftsman.phone)
                      : (resolvedRole === 'craftsman' ? order.customer.maskedPhone : '0661 •• •• 54')}
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {order.status === 'EN_ROUTE' || order.status === 'IN_PROGRESS' ? 'Direct Calling Unlocked' : 'Masked for Security'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Feature 1: Transparent Quotation & Parts Cost Manager */}
          <QuotationPartsCostManager 
            quotation={order.quotation}
            onUpdateQuotation={(updated) => {
              const newOrder = { ...order, quotation: updated };
              setOrder(newOrder);
              craftsmenService.saveOrder(newOrder);
            }}
            userRole={resolvedRole}
            orderId={order.id}
            customerName={order.customer.name}
            craftsmanName={order.craftsman.name}
            isLocked={order.status === 'OTP_COMPLETED' || order.status === 'REVIEWED'}
          />
        </div>

        {/* Right Column: Feature 2 Before/After Capture & GPS Live Route (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Live GPS Route & ETA Card */}
          <Card className="shadow-sm border overflow-hidden">
            <CardHeader className="bg-slate-900 text-white p-4 pb-3">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2 font-bold text-white">
                  <Compass className="h-4 w-4 text-primary animate-spin" />
                  <span>{isAr ? 'تتبع مسار الوصول الميداني (Live Route)' : 'Live Dispatch Navigation'}</span>
                </div>
                <Badge className="bg-primary/20 text-primary-foreground border-primary/40 text-[10px]">
                  GPS Live
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0 relative">
              {/* Simulated Map Visual */}
              <div className="h-44 bg-slate-950 relative overflow-hidden flex items-center justify-center p-4">
                <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
                
                {/* Route Connecting Line */}
                <div className="absolute top-1/2 left-16 right-16 h-1 bg-gradient-to-r from-emerald-500 via-primary to-rose-500 -translate-y-1/2 border-dashed" />
                
                {/* Point A: Craftsman */}
                <div className="absolute left-10 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 z-10 animate-pulse">
                  <div className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg border-2 border-white">
                    <Car className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-slate-900/90 px-1.5 py-0.5 rounded border border-emerald-800">
                    {order.craftsman.name.split(' ')[0]}
                  </span>
                </div>

                {/* Point B: Customer */}
                <div className="absolute right-10 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 z-10">
                  <div className="h-10 w-10 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg border-2 border-white">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-bold text-rose-400 bg-slate-900/90 px-1.5 py-0.5 rounded border border-rose-800">
                    {order.customer.maskedAddress}
                  </span>
                </div>
              </div>

              {/* Route ETA Footer */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/90 border-t flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>{isAr ? 'الوصول التقديري:' : 'Estimated Arrival:'}</span>
                  <span className="font-bold text-slate-900 dark:text-white">~{order.craftsman.estimatedArrivalMinutes} min</span>
                </div>
                <div className="text-right font-mono font-bold text-primary">
                  {order.craftsman.currentDistanceKm} km away
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feature 2: Mandatory Before & After Photo Capture */}
          <BeforeAfterPhotoCapture 
            photos={order.verificationPhotos}
            onUpdatePhotos={(updated) => {
              const newOrder = { ...order, verificationPhotos: updated };
              setOrder(newOrder);
              craftsmenService.saveOrder(newOrder);
            }}
            userRole={resolvedRole}
            orderStatus={order.status}
          />
        </div>

      </div>

      {/* --- ALL OPERATIONAL MODALS --- */}

      {/* 1. Craftsman Wake-Up Alert Modal with 30s Countdown */}
      <EmergencyWakeupAlertModal 
        isOpen={isWakeupModalOpen}
        order={order}
        onAccept={handleCraftsmanAcceptOrder}
        onDecline={handleCraftsmanDeclineOrder}
        onTimeoutEscalate={() => {
          setIsWakeupModalOpen(false);
          toast({
            title: isAr ? 'انتهت مهلة الـ 30 ثانية' : '30s Timeout Reached',
            description: isAr ? 'تم توسيع نطاق البحث بمقدار 5 كم إضافية تلقائياً.' : 'Radius auto-expanded by +5 km.'
          });
        }}
      />

      {/* 2. Dual-Step OTP Handshake Modal */}
      <DualStepOtpModal 
        isOpen={isOtpModalOpen}
        onClose={() => setIsOtpModalOpen(false)}
        otpType={otpModalType}
        otpSecurity={order.otpSecurity}
        onVerifySuccess={handleOtpSuccess}
        onLockoutEscalate={handleLockoutEscalate}
        userRole={resolvedRole}
      />

      {/* 3. Mutual Two-Way Review Modal */}
      <MutualTwoWayReviewModal 
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        userRole={resolvedRole}
        reviews={order.reviews}
        onSubmitReview={handleReviewSubmitted}
        craftsmanName={order.craftsman.name}
        customerName={order.customer.name}
      />
    </div>
  );
}
