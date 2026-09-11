'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  ShieldCheck,
  QrCode,
  Key,
  Copy,
  Check,
  Download,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Lock,
  Smartphone,
  AlertCircle
} from 'lucide-react';
import {
  generateBase32Secret,
  generateOtpAuthUri,
  getQrCodeUrl,
  generateBackupCodes,
  generateTOTPCode,
  verify2FACode,
  enable2FA
} from '@/services/twoFactorService';

interface TwoFactorSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  onSuccess: () => void;
}

export function TwoFactorSetupModal({
  isOpen,
  onClose,
  userEmail,
  onSuccess
}: TwoFactorSetupModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Generated Setup Data
  const [secret, setSecret] = useState('');
  const [otpUri, setOtpUri] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [currentTotpHint, setCurrentTotpHint] = useState('');

  // Form State
  const [verificationCode, setVerificationCode] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Initialize fresh secret and codes when opening
  useEffect(() => {
    if (isOpen) {
      const newSecret = generateBase32Secret(16);
      const uri = generateOtpAuthUri(userEmail || 'admin@khidmatik.dz', newSecret);
      const qr = getQrCodeUrl(uri);
      const codes = generateBackupCodes(6);

      setSecret(newSecret);
      setOtpUri(uri);
      setQrUrl(qr);
      setBackupCodes(codes);
      setStep(1);
      setVerificationCode('');
      setErrorMsg('');

      // Generate current code as helper hint
      generateTOTPCode(newSecret).then((c) => setCurrentTotpHint(c));
    }
  }, [isOpen, userEmail]);

  // Keep code hint refreshed every 10 seconds
  useEffect(() => {
    if (!secret || step !== 2) return;
    const interval = setInterval(() => {
      generateTOTPCode(secret).then((c) => setCurrentTotpHint(c));
    }, 10000);
    return () => clearInterval(interval);
  }, [secret, step]);

  const handleCopySecret = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(secret);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
      toast({
        title: 'تم النسخ!',
        description: 'تم نسخ المفتاح السري إلى الحافظة.',
      });
    }
  };

  const handleCopyCodes = () => {
    if (typeof navigator !== 'undefined') {
      const text = `رموز الاسترداد الاحتياطية لمنصة خدماتك (${userEmail}):\n` + backupCodes.join('\n');
      navigator.clipboard.writeText(text);
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 2000);
      toast({
        title: 'تم نسخ الرموز!',
        description: 'تم نسخ جميع رموز الاسترداد الاحتياطية بنجاح.',
      });
    }
  };

  const handleDownloadCodes = () => {
    const text =
      `# رموز الاسترداد الاحتياطية (2FA Backup Codes) - منصة خدماتك Khidmatik\n` +
      `الحساب: ${userEmail}\n` +
      `تاريخ الإنشاء: ${new Date().toLocaleString()}\n` +
      `ملاحظة: كل رمز صالح للاستخدام مرة واحدة فقط في حالات الطوارئ.\n\n` +
      backupCodes.map((c, i) => `${i + 1}. ${c}`).join('\n');

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `khidmatik-2fa-backup-codes-${userEmail.split('@')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'تم التحميل!',
      description: 'تم تنزيل ملف الرموز الاحتياطية على جهازك.',
    });
  };

  const handleVerifyStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!verificationCode || verificationCode.trim().length < 6) {
      setErrorMsg('يرجى إدخال رمز التحقق المكون من 6 أرقام');
      return;
    }

    setIsVerifying(true);
    try {
      const result = await verify2FACode(userEmail, verificationCode, secret);
      if (result.success) {
        setStep(3);
      } else {
        setErrorMsg(result.error || 'رمز التحقق غير صحيح');
      }
    } catch {
      setErrorMsg('حدث خطأ أثناء فحص الرمز');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCompleteActivation = async () => {
    setIsVerifying(true);
    try {
      await enable2FA(userEmail, secret, backupCodes);
      toast({
        title: 'تم تفعيل 2FA بنجاح! 🛡️',
        description: 'تم ربط حسابك بالمصادقة الثنائية وتأمين الدخول بالكامل.',
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      toast({
        title: 'خطأ',
        description: err?.message || 'فشل حفظ الإعدادات',
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border/80 shadow-2xl rounded-3xl p-6 font-sans" dir="rtl">
        <DialogHeader className="text-right">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-primary font-bold text-base">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <span>تفعيل المصادقة الثنائية (2FA)</span>
            </DialogTitle>
            <Badge variant="outline" className="text-[11px] font-mono border-primary/30 text-primary">
              الخطوة {step} من 3
            </Badge>
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            {step === 1 && 'اربط حسابك بتطبيق المصادقة مثل Google Authenticator أو Microsoft Authenticator.'}
            {step === 2 && 'أدخل الرمز المكون من 6 أرقام للتأكد من المزامنة والربط الصحيح.'}
            {step === 3 && 'احفظ رموز الاسترداد الاحتياطية في مكان آمن لاستخدامها في حال فقدان هاتفك.'}
          </DialogDescription>
        </DialogHeader>

        {/* STEP 1: SCAN QR CODE & SECRET KEY */}
        {step === 1 && (
          <div className="space-y-4 py-2">
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-border/60 text-center">
              <div className="p-2.5 bg-white rounded-xl shadow-md border border-slate-200 inline-block mb-3">
                {qrUrl ? (
                  <img
                    src={qrUrl}
                    alt="2FA QR Code"
                    className="h-44 w-44 object-contain"
                  />
                ) : (
                  <div className="h-44 w-44 flex items-center justify-center text-muted-foreground text-xs">
                    جاري توليد QR Code...
                  </div>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium">
                <Smartphone className="h-3.5 w-3.5 text-primary" />
                امسح الرمز بكاميرا تطبيق Authenticator
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>أو أدخل المفتاح السري يدوياً:</span>
                <button
                  type="button"
                  onClick={handleCopySecret}
                  className="text-primary hover:underline text-[11px] flex items-center gap-1 font-bold"
                >
                  {copiedKey ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  {copiedKey ? 'تم النسخ!' : 'نسخ المفتاح'}
                </button>
              </label>
              <div className="p-2.5 bg-muted/60 border rounded-xl font-mono text-xs text-center select-all tracking-wider text-slate-800 dark:text-slate-200">
                {secret}
              </div>
            </div>

            <DialogFooter className="flex gap-2 sm:justify-end pt-2">
              <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl text-xs">
                إلغاء
              </Button>
              <Button
                size="sm"
                onClick={() => setStep(2)}
                className="rounded-xl text-xs bg-primary hover:bg-primary/90 text-white font-bold flex items-center gap-1.5"
              >
                <span>التالي: تأكيد الرمز</span>
                <ArrowLeft className="h-3.5 w-3.5" />
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* STEP 2: VERIFY CODE */}
        {step === 2 && (
          <form onSubmit={handleVerifyStep} className="space-y-4 py-2">
            <div className="p-4 bg-muted/40 rounded-2xl border border-border/60 text-center space-y-2">
              <Lock className="h-7 w-7 text-primary mx-auto" />
              <h4 className="text-xs font-bold text-foreground">أدخل رمز الأمان من التطبيق</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                افتح تطبيق Authenticator وأدخل الرمز المكون من 6 أرقام لتأكيد نجاح التثبيت.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">رمز التحقق (6 أرقام):</label>
              <Input
                type="text"
                maxLength={6}
                autoFocus
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="text-center font-mono text-xl tracking-[0.3em] font-bold h-12 rounded-xl bg-background border-border/80"
                dir="ltr"
              />
              {errorMsg && (
                <p className="text-[11px] text-red-500 font-medium flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errorMsg}
                </p>
              )}
            </div>

            {/* Quick Helper for Instant Setup Confirmation */}
            {currentTotpHint && (
              <div className="p-2.5 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between text-xs">
                <span className="text-[11px] text-muted-foreground">الرمز الحالي المولد:</span>
                <button
                  type="button"
                  onClick={() => setVerificationCode(currentTotpHint)}
                  className="font-mono font-bold text-primary hover:underline text-xs"
                  dir="ltr"
                >
                  {currentTotpHint} (اضغط للإدخال السريع)
                </button>
              </div>
            )}

            <DialogFooter className="flex gap-2 sm:justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep(1)}
                className="rounded-xl text-xs flex items-center gap-1"
              >
                <ArrowRight className="h-3.5 w-3.5" />
                <span>العودة</span>
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isVerifying || verificationCode.length < 6}
                className="rounded-xl text-xs bg-primary hover:bg-primary/90 text-white font-bold flex items-center gap-1.5"
              >
                {isVerifying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                <span>تحقق من الرمز</span>
              </Button>
            </DialogFooter>
          </form>
        )}

        {/* STEP 3: BACKUP RECOVERY CODES */}
        {step === 3 && (
          <div className="space-y-4 py-2">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                احفظ هذه الرموز الاحتياطية في مكان آمن. في حال تعذر الوصول لهاتفك، يمكنك استخدام أي رمز لمرة واحدة للدخول.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-border/80">
              {backupCodes.map((code, idx) => (
                <div
                  key={idx}
                  className="font-mono text-center text-xs font-bold py-2 bg-background rounded-xl border border-border/60 text-slate-800 dark:text-slate-200"
                  dir="ltr"
                >
                  {code}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyCodes}
                className="flex-1 rounded-xl text-xs flex items-center justify-center gap-1.5 h-9"
              >
                {copiedCodes ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedCodes ? 'تم النسخ!' : 'نسخ جميع الرموز'}</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadCodes}
                className="flex-1 rounded-xl text-xs flex items-center justify-center gap-1.5 h-9"
              >
                <Download className="h-3.5 w-3.5" />
                <span>تنزيل كملف نصي</span>
              </Button>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                onClick={handleCompleteActivation}
                disabled={isVerifying}
                className="w-full rounded-xl text-xs h-10 bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-1.5 shadow-md"
              >
                {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                <span>حفظ وإتمام تفعيل المصادقة الثنائية (Activate 2FA)</span>
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
