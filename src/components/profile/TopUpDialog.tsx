
'use client';

import { useState, useEffect } from 'react';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  CreditCard, Landmark, FileText, PackageCheck, AlertCircle,
  CheckCircle, ArrowRight, ArrowLeft, Wallet, Copy, ShieldCheck,
  BadgeCheck, Clock, CircleDollarSign, Banknote
} from 'lucide-react';
import type { TopUpTransaction } from '@/types';

interface TopUpDialogProps {
  currentBalance: number;
  onClose: () => void;
  onTopUpSuccess: (newTransaction: TopUpTransaction) => void;
}

type TopUpStep = 'enterAmount' | 'selectMethod' | 'paymentInstructions' | 'confirmCompletion';
type PaymentMethod = 'ccp' | 'bank' | 'edahabia' | 'other_online';

const mockCompanyAccounts = {
  ccp: { name: "Khidmatik SARL", accountNumber: "1234567890", key: "12", address: "BP 1000, Sidi Bel Abbès Principal" },
  bank: { name: "Khidmatik SARL", bankName: "Banque Nationale d'Algérie (BNA)", rib: "001 00123 012345678901 23", swift: "BNAADZALXXX" }
};

const STEPS: TopUpStep[] = ['enterAmount', 'selectMethod', 'paymentInstructions', 'confirmCompletion'];
const STEP_LABELS = ['المبلغ', 'الطريقة', 'التعليمات', 'التأكيد'];

export function TopUpDialog({ currentBalance, onClose, onTopUpSuccess }: TopUpDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<TopUpStep>('enterAmount');
  const [amount, setAmount] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | ''>('');
  const [generatedTransactionCode, setGeneratedTransactionCode] = useState('');
  const [copied, setCopied] = useState(false);

  const currentStepIndex = STEPS.indexOf(step);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedTransactionCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAmountSubmit = () => {
    if (parseFloat(amount) <= 0 || isNaN(parseFloat(amount))) {
      toast({ title: "مبلغ غير صالح", description: "يرجى إدخال مبلغ صحيح.", variant: "destructive" });
      return;
    }
    setStep('selectMethod');
  };

  const handleMethodSelect = (method: PaymentMethod) => {
    if (method === 'edahabia' || method === 'other_online') {
      toast({ title: "قريباً!", description: `الدفع عبر ${method} غير متاح بعد.` });
      return;
    }
    setSelectedMethod(method);
    setGeneratedTransactionCode(`REF-KH-${Date.now().toString().slice(-6)}`);
    setStep('paymentInstructions');
  };

  const handleConfirmTransfer = () => {
    if (!selectedMethod || !generatedTransactionCode || !amount) return;
    const newTransaction: TopUpTransaction = {
      id: `tu-${Date.now()}`,
      userId: 'currentUser',
      amount: parseFloat(amount),
      method: selectedMethod as 'ccp' | 'bank',
      status: 'pending-review',
      transactionCode: generatedTransactionCode,
      createdAt: new Date().toISOString(),
    };
    onTopUpSuccess(newTransaction);
    toast({
      title: "✅ تم إرسال طلب الشحن",
      description: `طلبك بمبلغ ${parseFloat(amount).toFixed(2)} DA قيد المراجعة. (Ref: ${generatedTransactionCode})`,
      duration: 7000,
    });
    onClose();
  };

  const quickAmounts = [1000, 2000, 5000, 10000, 20000, 50000];

  return (
    <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-0 shadow-2xl">
      {/* Gradient Header */}
      <div className="bg-gradient-to-br from-primary/90 via-primary/70 to-primary/50 px-6 pt-6 pb-5 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <div>
            <DialogTitle className="text-white text-base font-bold font-headline">
              {step === 'enterAmount' && 'شحن المحفظة / Top Up Wallet'}
              {step === 'selectMethod' && 'طريقة الدفع / Payment Method'}
              {step === 'paymentInstructions' && `تعليمات ${selectedMethod?.toUpperCase()} Transfer`}
              {step === 'confirmCompletion' && 'تأكيد التحويل / Confirm Transfer'}
            </DialogTitle>
            <DialogDescription className="text-white/70 text-[10px] mt-0.5">
              الرصيد الحالي: <strong className="text-white">{currentBalance.toFixed(2)} DA</strong>
            </DialogDescription>
          </div>
        </div>

        {/* Step progress dots */}
        <div className="flex items-center gap-1.5 mt-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1.5">
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold transition-all ${
                i === currentStepIndex
                  ? 'bg-white text-primary'
                  : i < currentStepIndex
                  ? 'bg-white/30 text-white'
                  : 'bg-white/10 text-white/50'
              }`}>
                {i < currentStepIndex ? (
                  <CheckCircle className="h-2.5 w-2.5" />
                ) : (
                  <span>{i + 1}</span>
                )}
                <span className="hidden sm:inline">{STEP_LABELS[i]}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-px w-4 transition-all ${i < currentStepIndex ? 'bg-white/60' : 'bg-white/20'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5 space-y-4 bg-background">

        {/* ── Step 1: Enter Amount ── */}
        {step === 'enterAmount' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="topup-amount" className="text-xs font-semibold mb-2 block">
                المبلغ المراد شحنه (DA)
              </Label>
              <div className="relative">
                <CircleDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="topup-amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="أدخل المبلغ..."
                  min="100"
                  className="pl-9 h-11 text-sm font-semibold"
                />
              </div>
            </div>

            {/* Quick amount chips */}
            <div>
              <p className="text-[10px] text-muted-foreground mb-2 font-medium">مبالغ سريعة:</p>
              <div className="grid grid-cols-3 gap-2">
                {quickAmounts.map(q => (
                  <button
                    key={q}
                    onClick={() => setAmount(String(q))}
                    className={`text-xs py-1.5 rounded-lg border font-semibold transition-all hover:scale-105 ${
                      amount === String(q)
                        ? 'bg-primary text-primary-foreground border-primary shadow-md'
                        : 'border-border hover:border-primary/50 hover:bg-primary/5'
                    }`}
                  >
                    {q.toLocaleString()} DA
                  </button>
                ))}
              </div>
            </div>

            {/* Balance info */}
            <div className="bg-muted/30 rounded-xl p-3 flex items-center justify-between text-xs border border-border">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Wallet className="h-3.5 w-3.5 text-primary" /> الرصيد الحالي
              </span>
              <strong className="text-accent">{currentBalance.toFixed(2)} DA</strong>
            </div>
          </div>
        )}

        {/* ── Step 2: Select Method ── */}
        {step === 'selectMethod' && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">اختر طريقة الدفع المناسبة لك:</p>
            {[
              { id: 'ccp', icon: FileText, label: 'بريد الجزائر (CCP)', desc: 'تحويل بريدي مباشر', color: 'text-orange-500', border: 'border-orange-400/50', bg: 'hover:bg-orange-500/5', available: true },
              { id: 'bank', icon: Landmark, label: 'تحويل بنكي', desc: 'BNA / CPA / BADR وغيرها', color: 'text-blue-500', border: 'border-blue-400/50', bg: 'hover:bg-blue-500/5', available: true },
              { id: 'edahabia', icon: CreditCard, label: 'بطاقة Edahabia / CIB', desc: 'الدفع الإلكتروني', color: 'text-muted-foreground', border: 'border-muted', bg: '', available: false },
              { id: 'other_online', icon: PackageCheck, label: 'طرق أخرى', desc: 'Dahabia, BaridiMob...', color: 'text-muted-foreground', border: 'border-muted', bg: '', available: false },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => handleMethodSelect(m.id as PaymentMethod)}
                disabled={!m.available}
                className={`w-full flex items-center gap-3 p-3.5 border rounded-xl text-left transition-all ${
                  m.available
                    ? `cursor-pointer ${m.border} ${m.bg} hover:scale-[1.01] hover:shadow-sm`
                    : 'cursor-not-allowed opacity-40 border-muted'
                }`}
              >
                <div className={`p-2 rounded-lg bg-muted/40 ${m.color}`}>
                  <m.icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className={`text-xs font-bold ${m.available ? '' : 'text-muted-foreground'}`}>{m.label}</p>
                  <p className="text-[9px] text-muted-foreground">{m.desc}</p>
                </div>
                {m.available ? (
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <span className="text-[8px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground shrink-0">قريباً</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* ── Step 3: Payment Instructions ── */}
        {step === 'paymentInstructions' && generatedTransactionCode && (
          <div className="space-y-4">
            {/* Reference code card */}
            <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-2 border-primary/30 rounded-2xl p-4 text-center">
              <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-widest font-semibold">كود المرجع الفريد</p>
              <p className="text-2xl font-black text-primary tracking-wider">{generatedTransactionCode}</p>
              <button
                onClick={handleCopyCode}
                className="mt-2 flex items-center gap-1.5 mx-auto text-[10px] text-primary hover:text-primary/80 transition-all"
              >
                {copied ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                {copied ? 'تم النسخ!' : 'نسخ الكود'}
              </button>
            </div>

            {/* Warning */}
            <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-[10px] text-destructive font-semibold leading-snug">
                يجب إدراج هذا الكود في خانة "الملاحظات / Motif" عند إجراء التحويل وإلا لن يتم التعرف على دفعتك.
              </p>
            </div>

            {/* Account details */}
            <div className="bg-muted/20 border border-border rounded-xl p-4 space-y-2 text-xs">
              <p className="font-bold text-sm flex items-center gap-1.5 mb-3">
                {selectedMethod === 'ccp'
                  ? <FileText className="h-4 w-4 text-orange-500" />
                  : <Landmark className="h-4 w-4 text-blue-500" />
                }
                {selectedMethod === 'ccp' ? 'بيانات حساب CCP' : 'بيانات الحساب البنكي'}
              </p>
              {selectedMethod === 'ccp' ? (
                <>
                  <div className="flex justify-between"><span className="text-muted-foreground">اسم الحساب</span><strong>{mockCompanyAccounts.ccp.name}</strong></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">رقم CCP</span><strong className="font-mono">{mockCompanyAccounts.ccp.accountNumber} / {mockCompanyAccounts.ccp.key}</strong></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">العنوان</span><strong className="text-right">{mockCompanyAccounts.ccp.address}</strong></div>
                </>
              ) : (
                <>
                  <div className="flex justify-between"><span className="text-muted-foreground">اسم المستفيد</span><strong>{mockCompanyAccounts.bank.name}</strong></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">البنك</span><strong>{mockCompanyAccounts.bank.bankName}</strong></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">RIB</span><strong className="font-mono text-[10px]">{mockCompanyAccounts.bank.rib}</strong></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">SWIFT</span><strong className="font-mono">{mockCompanyAccounts.bank.swift}</strong></div>
                </>
              )}
              <div className="flex justify-between pt-2 border-t border-border mt-2">
                <span className="text-muted-foreground">المبلغ المطلوب</span>
                <strong className="text-accent text-sm">{parseFloat(amount).toLocaleString()} DA</strong>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 4: Confirm Completion ── */}
        {step === 'confirmCompletion' && (
          <div className="space-y-4 text-center">
            {/* Success animation icon */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center border-2 border-green-500/30 animate-pulse">
                  <BadgeCheck className="h-8 w-8 text-green-500" />
                </div>
              </div>
            </div>

            <div>
              <p className="font-bold text-sm text-foreground leading-relaxed">
                هل قمت بإتمام تحويل{' '}
                <span className="text-accent font-black">{parseFloat(amount).toLocaleString()} DA</span>{' '}
                عبر{' '}
                <span className="uppercase font-black text-primary">{selectedMethod}</span>؟
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                مع الكود المرجعي:{' '}
                <strong className="text-primary font-mono">{generatedTransactionCode}</strong>
              </p>
            </div>

            {/* Info cards */}
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-muted/30 border border-border rounded-xl p-3 flex flex-col items-center gap-1.5">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-semibold">وقت المراجعة</span>
                <span className="text-muted-foreground">2–24 ساعة عمل</span>
              </div>
              <div className="bg-muted/30 border border-border rounded-xl p-3 flex flex-col items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-green-500" />
                <span className="font-semibold">حماية مضمونة</span>
                <span className="text-muted-foreground">Escrow محمي</span>
              </div>
            </div>

            <p className="text-[9px] text-muted-foreground bg-muted/20 border border-border rounded-lg p-2">
              💡 يمكنك رفع صورة وصل الدفع في الإصدار القادم لتسريع المراجعة.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 pb-5 flex items-center justify-between gap-2 bg-background border-t border-border pt-4">
        {/* Left: Cancel / Back */}
        <div className="flex items-center gap-2">
          {step === 'enterAmount' ? (
            <DialogClose asChild>
              <Button variant="ghost" size="sm" onClick={onClose} className="text-xs h-8">
                إلغاء
              </Button>
            </DialogClose>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-8 flex items-center gap-1"
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

        {/* Right: Primary action */}
        <div>
          {step === 'enterAmount' && (
            <Button
              size="sm"
              onClick={handleAmountSubmit}
              disabled={!amount || parseFloat(amount) <= 0}
              className="h-9 px-5 text-xs font-bold flex items-center gap-1.5"
            >
              التالي <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
          {step === 'paymentInstructions' && (
            <Button
              size="sm"
              onClick={() => setStep('confirmCompletion')}
              className="h-9 px-5 text-xs font-bold flex items-center gap-1.5"
            >
              أكملت التحويل <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
          {step === 'confirmCompletion' && (
            <Button
              size="sm"
              onClick={handleConfirmTransfer}
              className="h-9 px-5 text-xs font-bold bg-green-600 hover:bg-green-700 text-white flex items-center gap-1.5"
            >
              <BadgeCheck className="h-4 w-4" /> تأكيد الإتمام
            </Button>
          )}
        </div>
      </div>
    </DialogContent>
  );
}