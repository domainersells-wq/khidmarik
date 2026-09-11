'use client';

import { useState } from 'react';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  CreditCard, Landmark, FileText, PackageCheck, AlertCircle,
  CheckCircle, ArrowRight, ArrowLeft, Wallet, Copy, ShieldCheck,
  BadgeCheck, Clock, CircleDollarSign, AlertTriangle, UserCheck
} from 'lucide-react';
import { financialService } from '@/services/financialService';
import { TopUpRequest, TopUpMethod } from '@/types/financials';
import type { TopUpTransaction } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { ThinkingOrbs } from '@/components/ui/thinking-orbs';

interface TopUpDialogProps {
  currentBalance: number;
  onClose: () => void;
  onTopUpSuccess: (newTransaction: TopUpTransaction) => void;
}

type TopUpStep = 'enterAmount' | 'selectMethod' | 'paymentInstructions' | 'confirmCompletion';

const STEPS: TopUpStep[] = ['enterAmount', 'selectMethod', 'paymentInstructions', 'confirmCompletion'];
const STEP_LABELS = ['المبلغ', 'الطريقة', 'التعليمات', 'تأكيد التحويل'];

export function TopUpDialog({ currentBalance, onClose, onTopUpSuccess }: TopUpDialogProps) {
  const { toast } = useToast();
  const { user: authUser } = useAuth();
  const [step, setStep] = useState<TopUpStep>('enterAmount');
  const [amount, setAmount] = useState<string>('20000');
  const [selectedMethod, setSelectedMethod] = useState<TopUpMethod | ''>('ccp');
  
  // Real created Top-Up request from backend
  const [createdTopUp, setCreatedTopUp] = useState<TopUpRequest | null>(null);
  const [postalTransactionCode, setPostalTransactionCode] = useState('');
  const [senderName, setSenderName] = useState(authUser?.name || '');
  const [senderAccount, setSenderAccount] = useState('');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [userNotes, setUserNotes] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStepIndex = STEPS.indexOf(step);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAmountSubmit = () => {
    const numAmount = parseFloat(amount);
    if (numAmount < 500 || isNaN(numAmount)) {
      toast({ title: "مبلغ غير صالح", description: "الحد الأدنى للشحن هو 500 DA.", variant: "destructive" });
      return;
    }
    setStep('selectMethod');
  };

  const handleMethodSelect = (method: TopUpMethod) => {
    setSelectedMethod(method);
    setStep('paymentInstructions');
  };

  const handleConfirmTransfer = () => {
    if (!postalTransactionCode.trim()) {
      toast({
        title: "رمز العملية البريدية مطلوب",
        description: "يرجى كتابة رقم العملية المذكور في وصل التحويل لمطابقة الدفعة.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const numAmount = parseFloat(amount);
      const resolvedUserId = financialService.normalizeUserId(authUser?.id);
      
      const result = financialService.submitUserTopUpRequest({
        userId: resolvedUserId,
        userName: authUser?.name || 'Ahmed Benali',
        userEmail: authUser?.email || 'admin@khidmatik.dz',
        userPhone: (authUser as any)?.phone || '',
        accountType: 'client',
        amount: numAmount,
        paymentMethod: (selectedMethod || 'baridimob') as TopUpMethod,
        postalTransactionCode: postalTransactionCode.trim(),
        senderName: senderName.trim() || authUser?.name || 'Client',
        senderAccount: senderAccount.trim(),
        transferDate,
        userNotes: userNotes.trim(),
      });

      if (!result.success || !result.topUp) {
        toast({
          title: "تعذر إرسال إثبات التحويل",
          description: result.error || "يرجى التأكد من صحة البيانات",
          variant: "destructive"
        });
        return;
      }

      const createdReq = result.topUp;

      // Format standardized transaction for profile state
      const legacyTx: TopUpTransaction = {
        id: createdReq.id,
        userId: resolvedUserId,
        amount: createdReq.amount,
        method: createdReq.paymentMethod as any,
        status: 'pending-review',
        transactionCode: createdReq.publicRequestNumber,
        createdAt: new Date().toISOString(),
      };

      onTopUpSuccess(legacyTx);
      toast({
        title: "✅ تم إرسال طلب الشحن للإدارة بنجاح",
        description: `رقم الطلب (${createdReq.publicRequestNumber}) قيد المراجعة والمطابقة المالية من قِبل إدارة منصة خدماتك.`,
        duration: 8000,
      });
      onClose();
    } catch (e: any) {
      toast({
        title: "خطأ في الاتصال",
        description: e.message || "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickAmounts = [1000, 2000, 5000, 10000, 20000, 50000];

  return (
    <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-0 shadow-2xl rounded-2xl">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 px-6 pt-6 pb-5 text-primary-foreground">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-md">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <div>
            <DialogTitle className="text-white text-base font-bold font-headline">
              {step === 'enterAmount' && 'شحن المحفظة الرقمية / Top Up Wallet'}
              {step === 'selectMethod' && 'اختيار طريقة الدفع / Payment Method'}
              {step === 'paymentInstructions' && 'بيانات حساب منصة خدماتك للتحويل'}
              {step === 'confirmCompletion' && 'تأكيد إرسال رمز العملية البريدية'}
            </DialogTitle>
            <DialogDescription className="text-white/80 text-xs mt-0.5">
              الرصيد المتاح الحالي: <strong className="text-white font-mono" dir="ltr">{currentBalance.toFixed(2)} DA</strong>
            </DialogDescription>
          </div>
        </div>

        {/* Step progress dots */}
        <div className="flex items-center gap-1.5 mt-3">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1.5">
              <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                i === currentStepIndex
                  ? 'bg-white text-primary shadow-xs'
                  : i < currentStepIndex
                  ? 'bg-white/30 text-white'
                  : 'bg-white/10 text-white/50'
              }`}>
                {i < currentStepIndex ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <span>{i + 1}</span>
                )}
                <span>{STEP_LABELS[i]}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-px w-4 transition-all ${i < currentStepIndex ? 'bg-white/60' : 'bg-white/20'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5 space-y-4 bg-background max-h-[70vh] overflow-y-auto">

        {/* ── Step 1: Enter Amount ── */}
        {step === 'enterAmount' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="topup-amount" className="text-xs font-bold mb-2 block text-foreground">
                المبلغ المراد شحنه إلى رصيدك بالدينار الجزائري (DA) *
              </Label>
              <div className="relative">
                <CircleDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="topup-amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="أدخل المبلغ..."
                  min="500"
                  className="pl-9 h-11 text-base font-bold font-mono rounded-xl"
                  dir="ltr"
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">الحد الأدنى للشحن عبر CCP أو التحويل البنكي هو 500 DA.</p>
            </div>

            {/* Quick amount chips */}
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-semibold">مبالغ شائعة سريعة:</p>
              <div className="grid grid-cols-3 gap-2">
                {quickAmounts.map(q => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setAmount(String(q))}
                    className={`text-xs py-2 rounded-xl border font-bold font-mono transition-all hover:scale-[1.02] ${
                      amount === String(q)
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                        : 'border-border/80 hover:border-primary/50 hover:bg-muted/50 text-foreground'
                    }`}
                    dir="ltr"
                  >
                    {q.toLocaleString()} DA
                  </button>
                ))}
              </div>
            </div>

            {/* Escrow Guarantee Notice */}
            <div className="p-3 rounded-xl bg-muted/20 border border-border/80 flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> حماية الضمان الرقمي
              </span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-bold">مفعلة وتلقائية</strong>
            </div>
          </div>
        )}

        {/* ── Step 2: Select Method ── */}
        {step === 'selectMethod' && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground font-semibold">اختر طريقة التحويل إلى حساب منصة خدماتك:</p>
            {[
              { id: 'baridimob', icon: CreditCard, label: 'تطبيق بريدي موب (BaridiMob)', desc: 'تحويل فوري عبر RIP من تطبيق الهاتف', available: true },
              { id: 'ccp', icon: FileText, label: 'بريد الجزائر (حوالة بريدية CCP)', desc: 'تحويل يدوي في أي مكتب بريد بالجزائر', available: true },
              { id: 'bank_transfer', icon: Landmark, label: 'تحويل بنكي رسمي (Virement BNA / CPA / BEA)', desc: 'تحويل من حساب بنكي جزائري', available: true },
            ].map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => handleMethodSelect(m.id as TopUpMethod)}
                className="w-full flex items-center gap-3.5 p-3.5 border border-border/80 rounded-xl text-right transition-all cursor-pointer hover:border-primary/50 hover:bg-muted/40 hover:shadow-xs group"
              >
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0 group-hover:scale-105 transition-transform">
                  <m.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 text-right">
                  <p className="text-xs font-bold text-foreground">{m.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{m.desc}</p>
                </div>
                <ArrowLeft className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        )}

        {/* ── Step 3: Payment Instructions ── */}
        {step === 'paymentInstructions' && (
          <div className="space-y-4">
            {/* Amount & Method Box */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 text-center space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                المبلغ المراد تحويله لحساب المنصة
              </span>
              <p className="text-2xl font-black text-primary font-mono" dir="ltr">
                {parseFloat(amount || '0').toLocaleString()} DA
              </p>
              <Badge variant="outline" className="text-xs font-bold uppercase mt-1">
                {selectedMethod === 'baridimob' ? 'BaridiMob / بريدي موب' : selectedMethod === 'ccp' ? 'Algérie Poste (CCP)' : 'Bank Transfer'}
              </Badge>
            </div>

            {/* Official Platform Account Card */}
            <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-2.5 text-xs">
              <p className="font-bold text-foreground flex items-center gap-2">
                <Landmark className="h-4 w-4 text-primary" />
                <span>بيانات حساب منصة خدماتك للتحويل:</span>
              </p>
              
              <div className="space-y-2 bg-background p-3 rounded-lg border border-border/60">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">صاحب الحساب:</span>
                  <strong className="text-foreground">KHIDMATIK / منصة خدماتك الجزائر</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">رقم الحساب الجاري (CCP):</span>
                  <div className="flex items-center gap-2">
                    <strong className="font-mono text-foreground" dir="ltr">0022334455 88</strong>
                    <button type="button" onClick={() => handleCopy('0022334455 88')} className="text-primary hover:underline text-[10px]">نسخ</button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">رقم الهوية البريدية (RIP):</span>
                  <div className="flex items-center gap-2">
                    <strong className="font-mono text-foreground text-[11px]" dir="ltr">00799999002233445588</strong>
                    <button type="button" onClick={() => handleCopy('00799999002233445588')} className="text-primary hover:underline text-[10px]">نسخ</button>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="text-muted-foreground">المبلغ الصافي:</span>
                  <strong className="font-black text-sm text-primary font-mono" dir="ltr">
                    {parseFloat(amount || '0').toLocaleString()} DA
                  </strong>
                </div>
              </div>
            </div>

            {/* Transfer Instructions Alert */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs flex items-start gap-2.5 text-amber-800 dark:text-amber-300">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
              <p className="leading-relaxed">
                <strong>خطوات التحويل:</strong> قم بالتحويل من تطبيق BaridiMob أو أقرب مكتب بريد، ثم احتفظ برقم العملية (N° de transaction) للضغط على التالي وإدخاله.
              </p>
            </div>
          </div>
        )}

        {/* ── Step 4: Confirm Completion & Input Postal Code ── */}
        {step === 'confirmCompletion' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-muted/20 border border-border/80 text-xs flex justify-between items-center">
              <div>
                <span className="text-muted-foreground block text-[10px]">طريقة التحويل:</span>
                <strong className="text-foreground font-bold uppercase">
                  {selectedMethod === 'baridimob' ? 'BaridiMob' : selectedMethod === 'ccp' ? 'Algérie Poste (CCP)' : 'Bank Transfer'}
                </strong>
              </div>
              <div className="text-left">
                <span className="text-muted-foreground block text-[10px]">المبلغ:</span>
                <strong className="font-mono text-primary font-black text-sm" dir="ltr">
                  {parseFloat(amount || '0').toLocaleString()} DA
                </strong>
              </div>
            </div>

            {/* Postal Transaction Code Input */}
            <div className="space-y-1.5">
              <Label htmlFor="postal-code" className="text-xs font-bold block text-foreground">
                رمز العملية البريدية / رقم الوصل (Transaction Reference) *
              </Label>
              <Input
                id="postal-code"
                type="text"
                value={postalTransactionCode}
                onChange={(e) => setPostalTransactionCode(e.target.value)}
                placeholder="أدخل رمز العملية (مثال: BM-20260827-1122 أو رقم الوصل)..."
                className="h-10 text-xs font-mono rounded-xl bg-background"
                dir="ltr"
                required
              />
              <p className="text-[10px] text-muted-foreground">
                يقوم فريق مالية المنصة بمطابقة هذا الرمز فوراً مع كشف الحساب البنكي/البريدي لاعتماد الإيداع.
              </p>
            </div>

            {/* Sender Details */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="sender-name" className="text-[11px] font-semibold text-foreground">اسم المرسل</Label>
                <Input
                  id="sender-name"
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="اسم صاحب الحساب المحوّل منه..."
                  className="h-9 text-xs rounded-xl bg-background"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="transfer-date" className="text-[11px] font-semibold text-foreground">تاريخ التحويل</Label>
                <Input
                  id="transfer-date"
                  type="date"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  className="h-9 text-xs font-mono rounded-xl bg-background"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Sender Account */}
            <div className="space-y-1">
              <Label htmlFor="sender-account" className="text-[11px] font-semibold text-foreground">رقم حساب المرسل (اختياري)</Label>
              <Input
                id="sender-account"
                type="text"
                value={senderAccount}
                onChange={(e) => setSenderAccount(e.target.value)}
                placeholder="رقم CCP أو RIP الذي تم التحويل منه..."
                className="h-9 text-xs font-mono rounded-xl bg-background"
                dir="ltr"
              />
            </div>

            {/* Under Review Notice */}
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs flex items-start gap-2.5 text-blue-800 dark:text-blue-300">
              <Clock className="h-4 w-4 shrink-0 mt-0.5 text-blue-600 animate-pulse" />
              <p className="leading-relaxed text-[11px]">
                <strong>تأكيد الأمان المالي:</strong> بعد الضغط على الإرسال، يُحال طلبك مباشرة إلى لوحة مراجعة الإدارة للتحقق من وصول المبلغ ومطابقته ثم إضافة الرصيد إلى محفظتك.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 pb-5 flex items-center justify-between gap-2 bg-background border-t border-border pt-4">
        {/* Left: Back / Cancel */}
        <div>
          {step === 'enterAmount' ? (
            <DialogClose asChild>
              <Button variant="ghost" size="sm" onClick={onClose} className="text-xs h-9 rounded-xl">
                إلغاء
              </Button>
            </DialogClose>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-9 rounded-xl flex items-center gap-1"
              onClick={() => {
                if (step === 'selectMethod') setStep('enterAmount');
                else if (step === 'paymentInstructions') setStep('selectMethod');
                else if (step === 'confirmCompletion') setStep('paymentInstructions');
              }}
            >
              <ArrowLeft className="h-3.5 w-3.5" /> رجوع
            </Button>
          )}
        </div>

        {/* Right: Next actions */}
        <div>
          {step === 'enterAmount' && (
            <Button
              size="sm"
              onClick={handleAmountSubmit}
              disabled={!amount || parseFloat(amount) < 500}
              className="h-9 px-5 text-xs font-bold flex items-center gap-1.5 rounded-xl"
            >
              التالي <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
          {step === 'paymentInstructions' && (
            <Button
              size="sm"
              onClick={() => setStep('confirmCompletion')}
              className="h-9 px-5 text-xs font-bold flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground"
            >
              أكملت التحويل <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
          {step === 'confirmCompletion' && (
            <Button
              size="sm"
              onClick={handleConfirmTransfer}
              disabled={!postalTransactionCode.trim() || isSubmitting}
              className="h-9 px-5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm rounded-xl"
            >
              {isSubmitting ? (
                <ThinkingOrbs state="solving" size="sm" inline label="جارٍ إرسال الإثبات وتأمين المعاملة..." />
              ) : (
                <>
                  <BadgeCheck className="h-4 w-4" />
                  <span>إرسال إثبات التحويل للإدارة</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </DialogContent>
  );
}