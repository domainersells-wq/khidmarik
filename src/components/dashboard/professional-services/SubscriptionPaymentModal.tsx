'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Wallet, 
  Smartphone, 
  Building2, 
  CheckCircle2, 
  Lock, 
  ShieldCheck, 
  Sparkles, 
  Copy, 
  UploadCloud, 
  AlertCircle,
  Loader2,
  FileCheck,
  Check,
  QrCode
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { PlanDetail } from './SubscriptionPlansModal';
import { TIER_THEMES } from '@/lib/subscriptionTheme';

interface SubscriptionPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PlanDetail | null;
  onPaymentSuccess: (plan: PlanDetail, paymentMethod: string, txRef: string) => void;
  userWalletBalance?: number;
}

export function SubscriptionPaymentModal({
  isOpen,
  onClose,
  plan,
  onPaymentSuccess,
  userWalletBalance = 35000 // default simulated balance
}: SubscriptionPaymentModalProps) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const { toast } = useToast();

  const [paymentMethod, setPaymentMethod] = useState<'edahabia' | 'baridimob' | 'wallet' | 'ccp'>('edahabia');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'details' | 'otp' | 'success'>('details');

  // Form Fields
  // 1. Edahabia / CIB
  const [cardNumber, setCardNumber] = useState('4000 1234 5678 9010');
  const [cardHolder, setCardHolder] = useState('MOHAMED ALI');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('890');
  const [otpCode, setOtpCode] = useState('');

  // 2. BaridiMob
  const [baridimobTxRef, setBaridimobTxRef] = useState('');
  const [baridimobSenderPhone, setBaridimobSenderPhone] = useState('0661234567');
  const [baridimobReceiptUploaded, setBaridimobReceiptUploaded] = useState(false);

  // 3. CCP
  const [ccpMandateNumber, setCcpMandateNumber] = useState('');
  const [ccpReceiptUploaded, setCcpReceiptUploaded] = useState(false);

  const KHIDMATIK_BARIDIMOB_RIP = '00799999000002134567';
  const KHIDMATIK_CCP_ACCOUNT = '0012345678 Cle 45';
  const KHIDMATIK_BANK_RIB = 'BNA: 00100 00234 1234567890 22';

  if (!plan) return null;

  // Safe fallback for theme
  const defaultTheme = TIER_THEMES.gold || {
    id: 'gold',
    nameEn: 'Gold Plan',
    nameAr: 'الباقة الذهبية',
    iconName: 'Award',
    accentColor: '#f59e0b',
    accentHsl: '38 92% 50%',
    coverGradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    avatarFrameBorder: 'border-amber-400',
    badgeClass: 'bg-amber-100 text-amber-800',
    textClass: 'text-amber-600',
    cardBorderClass: 'border-amber-400',
    progressClass: 'bg-amber-100',
    buttonClass: 'bg-amber-500',
    chartColor: '#f59e0b',
    qrFrameColor: '#f59e0b',
    hasGlow: true,
    hasShine: true,
    hasBorderSweep: true
  };

  const theme = (plan.tier && TIER_THEMES[plan.tier]) ? TIER_THEMES[plan.tier] : defaultTheme;

  const planPriceNumber = typeof plan.price === 'number'
    ? plan.price
    : (typeof (plan as any).priceNumberDA === 'number'
      ? (plan as any).priceNumberDA
      : (typeof (plan as any).price === 'string' ? parseFloat((plan as any).price.replace(/[^\d.]/g, '')) || 2500 : 2500));

  const isWalletSufficient = userWalletBalance >= planPriceNumber;
  const planTitleAr = plan.nameAr || (plan as any).name || 'الباقة المختارة';
  const planTitleEn = plan.nameEn || (plan as any).name || 'Selected Plan';

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: isAr ? 'تم النسخ!' : 'Copied!',
      description: `${label}: ${text}`
    });
  };

  const handleStartPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentMethod === 'edahabia') {
      if (cardNumber.replace(/\s/g, '').length < 16) {
        toast({ title: isAr ? 'رقم البطاقة غير مكتمل' : 'Invalid card number', variant: 'destructive' });
        return;
      }
      setIsProcessing(true);
      // Simulate 3DS OTP Gateway
      setTimeout(() => {
        setIsProcessing(false);
        setStep('otp');
        toast({
          title: isAr ? 'رمز التحقق OTP مرسل' : 'OTP Code Dispatched',
          description: isAr ? 'تم إرسال رمز الأمان إلى رقم هاتفك المرتبط بالبطاقة (الرمز للتجربة: 123456)' : 'Security code sent to your phone (Demo Code: 123456)'
        });
      }, 1000);
      return;
    }

    if (paymentMethod === 'baridimob') {
      if (!baridimobTxRef.trim()) {
        toast({ 
          title: isAr ? 'رقم المعاملة مطلوب' : 'Tx Reference Required', 
          description: isAr ? 'يرجى إدخال رقم المعاملة من تطبيق بريدي موب لإتمام العملية.' : 'Please enter BaridiMob transfer reference code.',
          variant: 'destructive' 
        });
        return;
      }
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        completePayment(`BM-${baridimobTxRef.trim()}`);
      }, 1200);
      return;
    }

    if (paymentMethod === 'wallet') {
      if (!isWalletSufficient) {
        toast({
          title: isAr ? 'رصيد المحفظة غير كافٍ' : 'Insufficient Wallet Balance',
          description: isAr ? `رصيدك الحالي هو ${userWalletBalance} دج. يرجى اختيار طريقة دفع أخرى أو شحن المحفظة.` : 'Please top up your wallet or choose another payment method.',
          variant: 'destructive'
        });
        return;
      }
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        completePayment(`WLT-SUB-${Date.now().toString().slice(-6)}`);
      }, 900);
      return;
    }

    if (paymentMethod === 'ccp') {
      if (!ccpMandateNumber.trim()) {
        toast({
          title: isAr ? 'رقم الحوالة مطلوب' : 'Mandate Number Required',
          description: isAr ? 'يرجى إدخال رقم الحوالة البريدية أو إيصال الدفع.' : 'Please enter the CCP mandate number.',
          variant: 'destructive'
        });
        return;
      }
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        completePayment(`CCP-${ccpMandateNumber.trim()}`);
      }, 1200);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      toast({ title: isAr ? 'يرجى إدخال رمز OTP' : 'Please enter OTP', variant: 'destructive' });
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      completePayment(`SATIM-CIB-${Date.now().toString().slice(-6)}`);
    }, 1200);
  };

  const completePayment = (txReference: string) => {
    setStep('success');
    toast({
      title: isAr ? '✅ تم استلام وتأكيد الدفع بنجاح!' : '✅ Payment Verified & Confirmed!',
      description: isAr 
        ? `تم تفعيل اشتراكك في ${planTitleAr} وفتح جميع الميزات فوراً!` 
        : `Your subscription to ${planTitleEn} is active!`,
    });
    setTimeout(() => {
      onPaymentSuccess(plan, paymentMethod, txReference);
      setStep('details');
    }, 1500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-6 bg-white dark:bg-slate-900 border text-slate-900 dark:text-slate-100">
        <DialogHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="h-10 w-10 rounded-xl flex items-center justify-center shadow-sm"
                style={{ backgroundColor: `${theme.accentColor}20`, color: theme.accentColor }}
              >
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold font-headline">
                  {isAr ? 'إتمام الدفع وتفعيل الاشتراك' : 'Checkout & Activate Subscription'}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {isAr 
                    ? 'يتم تفعيل ميزات الباقة فور تأكيد عملية الدفع بأمان' 
                    : 'Features will unlock instantly upon payment confirmation'}
                </DialogDescription>
              </div>
            </div>
            <Badge 
              className="text-xs px-2.5 py-1 font-bold"
              style={{ backgroundColor: theme.accentColor, color: '#fff' }}
            >
              {isAr ? planTitleAr : planTitleEn}
            </Badge>
          </div>
        </DialogHeader>

        {step === 'details' && (
          <form onSubmit={handleStartPayment} className="space-y-5 pt-3">
            {/* Plan Price Summary Box */}
            <div className="rounded-xl p-4 bg-slate-50 dark:bg-slate-800/60 border space-y-2">
              <div className="flex justify-between items-center text-sm font-semibold text-muted-foreground">
                <span>{isAr ? 'الباقة المختارة:' : 'Selected Plan:'}</span>
                <span className="text-slate-900 dark:text-white font-bold">{isAr ? planTitleAr : planTitleEn}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-semibold text-muted-foreground">
                <span>{isAr ? 'المدة الدورية:' : 'Billing Period:'}</span>
                <span className="text-slate-900 dark:text-white">{isAr ? '30 يوماً (شهرياً)' : '30 Days (Monthly)'}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-semibold text-muted-foreground">
                <span>{isAr ? 'رسوم المعاملة / الضريبة:' : 'Processing Fee / VAT:'}</span>
                <span className="text-emerald-600 font-bold">{isAr ? '0.00 دج (مجاناً)' : '0.00 DA (Free)'}</span>
              </div>
              <div className="pt-2 border-t flex justify-between items-center">
                <span className="text-base font-bold text-slate-900 dark:text-white">{isAr ? 'المبلغ الإجمالي المستحق:' : 'Total Amount Due:'}</span>
                <div className="text-right">
                  <span className="text-2xl font-black text-primary">{planPriceNumber.toLocaleString()}</span>
                  <span className="text-xs font-bold text-slate-500 ml-1">دج (DA)</span>
                </div>
              </div>
            </div>

            {/* Select Payment Method */}
            <div className="space-y-3">
              <Label className="text-sm font-bold block">
                {isAr ? 'اختر طريقة الدفع المناسبة لك:' : 'Select Payment Method:'}
              </Label>
              <RadioGroup 
                value={paymentMethod} 
                onValueChange={(val) => setPaymentMethod(val as any)}
                className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
              >
                {/* 1. Edahabia / CIB */}
                <Label
                  htmlFor="method-edahabia"
                  className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'edahabia' 
                      ? 'border-primary bg-primary/5 shadow-sm' 
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <RadioGroupItem value="edahabia" id="method-edahabia" className="mt-1" />
                  <div className="flex-1 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                      <CreditCard className="h-4 w-4 text-amber-600" />
                      <span>{isAr ? 'البطاقة الذهبية / CIB' : 'Edahabia / CIB Card'}</span>
                    </div>
                    <p className="text-muted-foreground mt-0.5">{isAr ? 'دفع إلكتروني آمن SATIM فوري' : 'Instant 3DS online payment'}</p>
                  </div>
                </Label>

                {/* 2. BaridiMob */}
                <Label
                  htmlFor="method-baridimob"
                  className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'baridimob' 
                      ? 'border-primary bg-primary/5 shadow-sm' 
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <RadioGroupItem value="baridimob" id="method-baridimob" className="mt-1" />
                  <div className="flex-1 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                      <Smartphone className="h-4 w-4 text-blue-600" />
                      <span>{isAr ? 'تطبيق بريدي موب (BaridiMob)' : 'BaridiMob App'}</span>
                    </div>
                    <p className="text-muted-foreground mt-0.5">{isAr ? 'تحويل فوري عبر RIP' : 'Direct RIP transfer'}</p>
                  </div>
                </Label>

                {/* 3. Escrow Wallet */}
                <Label
                  htmlFor="method-wallet"
                  className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'wallet' 
                      ? 'border-primary bg-primary/5 shadow-sm' 
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <RadioGroupItem value="wallet" id="method-wallet" className="mt-1" />
                  <div className="flex-1 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                      <Wallet className="h-4 w-4 text-emerald-600" />
                      <span>{isAr ? 'رصيد المحفظة (Wallet)' : 'Escrow Wallet Balance'}</span>
                    </div>
                    <p className="text-muted-foreground mt-0.5 font-semibold text-emerald-600">
                      {isAr ? `الرصيد: ${userWalletBalance.toLocaleString()} دج` : `Balance: ${userWalletBalance.toLocaleString()} DA`}
                    </p>
                  </div>
                </Label>

                {/* 4. CCP / Bank Transfer */}
                <Label
                  htmlFor="method-ccp"
                  className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'ccp' 
                      ? 'border-primary bg-primary/5 shadow-sm' 
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <RadioGroupItem value="ccp" id="method-ccp" className="mt-1" />
                  <div className="flex-1 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                      <Building2 className="h-4 w-4 text-purple-600" />
                      <span>{isAr ? 'حوالة CCP / تحويل بنكي' : 'CCP / Bank Transfer'}</span>
                    </div>
                    <p className="text-muted-foreground mt-0.5">{isAr ? 'عبر مركز البريد أو البنك' : 'Postal mandate or bank wire'}</p>
                  </div>
                </Label>
              </RadioGroup>
            </div>

            {/* Dynamic Inputs according to Payment Method */}
            {paymentMethod === 'edahabia' && (
              <div className="p-4 rounded-xl border bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4 text-primary" />
                    {isAr ? 'بيانات البطاقة البنكية / الذهبية:' : 'Card Information:'}
                  </span>
                  <span className="text-[10px] text-muted-foreground bg-white dark:bg-slate-800 px-2 py-0.5 rounded border">
                    🔒 SATIM 256-bit SSL Secure
                  </span>
                </div>

                <div>
                  <Label htmlFor="card-num" className="text-xs">{isAr ? 'رقم البطاقة (16 رقم)' : 'Card Number (16 Digits)'}</Label>
                  <Input 
                    id="card-num"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="6280 xxxx xxxx xxxx"
                    className="font-mono text-xs mt-1 bg-white dark:bg-slate-900"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div className="col-span-2">
                    <Label htmlFor="card-name" className="text-xs">{isAr ? 'اسم صاحب البطاقة' : 'Cardholder Name'}</Label>
                    <Input 
                      id="card-name"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder="MOHAMED ALI"
                      className="text-xs mt-1 uppercase bg-white dark:bg-slate-900"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="card-exp" className="text-xs">{isAr ? 'الصلاحية (MM/YY)' : 'Expiry (MM/YY)'}</Label>
                    <Input 
                      id="card-exp"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="12/28"
                      className="font-mono text-xs mt-1 bg-white dark:bg-slate-900 text-center"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'baridimob' && (
              <div className="p-4 rounded-xl border bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900 dark:text-blue-300">
                    {isAr ? 'معلومات التحويل عبر بريدي موب:' : 'Khidmatik BaridiMob Account:'}
                  </span>
                  <Badge variant="outline" className="text-[10px] bg-white border-blue-300 text-blue-800">
                    Algeria Post RIP
                  </Badge>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border text-center space-y-1">
                  <span className="text-[11px] text-muted-foreground block">{isAr ? 'رقم حساب المنصة (RIP) للتحويل:' : 'Transfer RIP Account:'}</span>
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-mono font-black text-sm text-slate-900 dark:text-white select-all">{KHIDMATIK_BARIDIMOB_RIP}</span>
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 px-2 text-xs" 
                      onClick={() => copyToClipboard(KHIDMATIK_BARIDIMOB_RIP, 'RIP')}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="bm-tx" className="text-xs font-bold text-blue-950 dark:text-blue-200">
                    {isAr ? 'رقم المعاملة من وصل بريدي موب (Tx Reference) *' : 'Transaction Reference Code (Tx Ref) *'}
                  </Label>
                  <Input 
                    id="bm-tx"
                    value={baridimobTxRef}
                    onChange={(e) => setBaridimobTxRef(e.target.value)}
                    placeholder="e.g. BM-90823412"
                    className="font-mono text-xs mt-1 bg-white dark:bg-slate-900"
                    required
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="text-xs h-8 bg-white dark:bg-slate-900"
                    onClick={() => {
                      setBaridimobReceiptUploaded(true);
                      toast({ title: isAr ? 'تم إرفاق صورة الوصل' : 'Receipt uploaded successfully' });
                    }}
                  >
                    <UploadCloud className="h-3.5 w-3.5 mr-1" />
                    {baridimobReceiptUploaded 
                      ? (isAr ? '✓ تم إرفاق الوصل' : '✓ Receipt Attached') 
                      : (isAr ? 'إرفاق صورة الوصل (اختياري)' : 'Upload Receipt Screenshot')}
                  </Button>
                </div>
              </div>
            )}

            {paymentMethod === 'wallet' && (
              <div className="p-4 rounded-xl border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-950 dark:text-emerald-200">{isAr ? 'الدفع من محفظة خدماتك:' : 'Pay from Escrow Wallet:'}</span>
                  <Badge className="bg-emerald-600 text-white text-[10px]">Instant Activation</Badge>
                </div>
                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">{isAr ? 'الرصيد المتوفر لديك:' : 'Available Balance:'}</span>
                  <span className="font-mono font-bold text-sm text-emerald-600">{userWalletBalance.toLocaleString()} دج</span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">{isAr ? 'المتبقي بعد الخصم:' : 'Remaining after payment:'}</span>
                  <span className="font-mono font-bold text-sm text-slate-700 dark:text-slate-300">
                    {(userWalletBalance - planPriceNumber).toLocaleString()} دج
                  </span>
                </div>
              </div>
            )}

            {paymentMethod === 'ccp' && (
              <div className="p-4 rounded-xl border bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900 space-y-3">
                <div className="text-xs font-bold text-purple-950 dark:text-purple-200">{isAr ? 'بيانات الحساب البريدي الجاري والبنك:' : 'Postal & Bank Details:'}</div>
                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">CCP Account:</span>
                    <span className="font-mono font-bold select-all">{KHIDMATIK_CCP_ACCOUNT}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Bank RIB:</span>
                    <span className="font-mono font-bold select-all">{KHIDMATIK_BANK_RIB}</span>
                  </div>
                </div>
                <div>
                  <Label htmlFor="ccp-mandate" className="text-xs font-bold">{isAr ? 'رقم الحوالة أو إيصال الدفع *' : 'Mandate / Receipt Ref *'}</Label>
                  <Input 
                    id="ccp-mandate"
                    value={ccpMandateNumber}
                    onChange={(e) => setCcpMandateNumber(e.target.value)}
                    placeholder="e.g. CCP-893021"
                    className="font-mono text-xs mt-1 bg-white dark:bg-slate-900"
                    required
                  />
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isProcessing}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button 
                type="submit" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md"
                disabled={isProcessing || (paymentMethod === 'wallet' && !isWalletSufficient)}
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isAr ? 'جاري معالجة الدفع...' : 'Processing Payment...'}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    {isAr ? `تأكيد الدفع (${planPriceNumber.toLocaleString()} دج)` : `Pay & Unlock (${planPriceNumber.toLocaleString()} DA)`}
                  </span>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}

        {/* Step 2: 3DS OTP Verification */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4 py-4">
            <div className="text-center space-y-2">
              <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 mx-auto flex items-center justify-center">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">{isAr ? 'التحقق الأمني SATIM 3-D Secure' : 'SATIM 3-D Secure Verification'}</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {isAr 
                  ? 'تم إرسال رمز التحقق المكون من 6 أرقام عبر SMS إلى هاتفك. (رمز التجربة السريع: 123456)' 
                  : 'Please enter the 6-digit confirmation code sent to your phone. (Demo Code: 123456)'}
              </p>
            </div>

            <div className="max-w-xs mx-auto space-y-1">
              <Label htmlFor="otp-in" className="text-xs font-bold text-center block">{isAr ? 'رمز الأمان (OTP)' : 'Security OTP Code'}</Label>
              <Input 
                id="otp-in"
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                className="font-mono text-xl text-center tracking-widest bg-white dark:bg-slate-900 font-bold"
                required
                autoFocus
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3">
              <Button type="button" variant="outline" onClick={() => setStep('details')} disabled={isProcessing}>
                {isAr ? 'رجوع' : 'Back'}
              </Button>
              <Button 
                type="submit" 
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isAr ? 'جاري التحقق...' : 'Verifying...'}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    {isAr ? 'تأكيد الرمز وفتح الباقة' : 'Confirm & Unlock'}
                  </span>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}

        {/* Step 3: Success Confirmation Animation */}
        {step === 'success' && (
          <div className="py-8 text-center space-y-3 animate-fade-in">
            <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 mx-auto flex items-center justify-center shadow-lg animate-bounce">
              <Check className="h-9 w-9 stroke-[3]" />
            </div>
            <h3 className="text-2xl font-bold text-emerald-600">
              {isAr ? 'تم الدفع وتفعيل الباقة بنجاح!' : 'Payment Success & Plan Activated!'}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {isAr 
                ? `مبروك! تم تفعيل ميزات ${plan.nameAr} في حسابك، تم فتح كافة الميزات المقفلة.` 
                : `Congratulations! ${plan.nameEn} features are now unlocked on your account.`}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
