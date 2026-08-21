'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  ShieldCheck, 
  KeyRound, 
  Lock, 
  AlertTriangle, 
  CheckCircle2, 
  Phone, 
  UserCheck, 
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { OtpSecurityState } from '@/types/craftsmen';

interface DualStepOtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  otpType: 'START' | 'COMPLETION';
  otpSecurity: OtpSecurityState;
  onVerifySuccess: (otpType: 'START' | 'COMPLETION') => void;
  onLockoutEscalate: (reason: string) => void;
  userRole: 'craftsman' | 'customer' | 'admin';
}

export function DualStepOtpModal({
  isOpen,
  onClose,
  otpType,
  otpSecurity,
  onVerifySuccess,
  onLockoutEscalate,
  userRole
}: DualStepOtpModalProps) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const { toast } = useToast();

  const [inputCode, setInputCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [localAttempts, setLocalAttempts] = useState(
    otpType === 'START' ? otpSecurity.startOtpAttempts : otpSecurity.completionOtpAttempts
  );

  const targetCode = otpType === 'START' ? otpSecurity.startOtp : otpSecurity.completionOtp;
  const maxAttempts = 3;
  const remainingAttempts = Math.max(0, maxAttempts - localAttempts);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.length < 4) {
      toast({ title: isAr ? 'يرجى إدخال الرمز المكون من 4 أرقام' : 'Enter 4-digit code', variant: 'destructive' });
      return;
    }

    setIsVerifying(true);

    setTimeout(() => {
      setIsVerifying(false);
      if (inputCode.trim() === targetCode.trim()) {
        toast({
          title: isAr ? '✅ تم التحقق الأمني بنجاح!' : '✅ Security Handshake Verified!',
          description: otpType === 'START' 
            ? (isAr ? 'تم بدء احتساب وقت العمل رسمياً وتوثيق الوصول.' : 'Job officially started & timer active.')
            : (isAr ? 'تم توثيق إنجاز العمل وموافقة العميل على الجودة.' : 'Job completion verified by customer.')
        });
        onVerifySuccess(otpType);
        onClose();
      } else {
        const nextAttempts = localAttempts + 1;
        setLocalAttempts(nextAttempts);

        if (nextAttempts >= maxAttempts) {
          toast({
            title: isAr ? '🚨 تم قفل المعاملة لتجاوز المحاولات' : '🚨 Security Lockout Triggered',
            description: isAr ? 'تم تحويل التذكرة للتدقيق الإداري من قِبل إدارة منصة خدماتك.' : 'Escalated to Super Admin dispute review.',
            variant: 'destructive'
          });
          onLockoutEscalate(
            `Failed ${maxAttempts} consecutive OTP attempts for ${otpType} handshake.`
          );
          onClose();
        } else {
          toast({
            title: isAr ? '❌ رمز الأمان غير صحيح' : '❌ Incorrect Security Code',
            description: isAr ? `تبقى لديك ${maxAttempts - nextAttempts} محاولات قبل قفل المعاملة.` : `${maxAttempts - nextAttempts} attempts remaining before lockout.`,
            variant: 'destructive'
          });
        }
      }
    }, 700);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-6 bg-white dark:bg-slate-900 border text-slate-900 dark:text-slate-100">
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-2 shadow-inner">
            <KeyRound className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl font-bold font-headline">
            {otpType === 'START' 
              ? (isAr ? 'رمز بدء العمل (Start OTP Handshake)' : 'Job Start OTP Handshake')
              : (isAr ? 'رمز تأكيد الإنجاز (Completion OTP)' : 'Job Completion OTP')}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {otpType === 'START'
              ? (isAr ? 'يقوم العميل بتزويد الحرفي بهذا الرمز عند الوصول لبدء العمل رسمياً' : 'Customer provides this code to craftsman upon physical arrival')
              : (isAr ? 'يقوم العميل بتزويد الحرفي بهذا الرمز بعد فحص ومعاينة جودة الإصلاح' : 'Customer gives this code after inspecting and approving the completed fix')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* If Customer View: Display the code generated for the Craftsman */}
          {userRole === 'customer' ? (
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border text-center space-y-2">
              <span className="text-xs font-bold text-muted-foreground block">
                {isAr ? 'أعطِ هذا الرمز للحرفي لتأكيد الخطوة:' : 'Provide this security code to craftsman:'}
              </span>
              <div className="font-mono font-black text-4xl tracking-widest text-primary py-2 bg-white dark:bg-slate-900 rounded-xl border border-primary/30 shadow-inner">
                {targetCode}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {otpType === 'START'
                  ? (isAr ? 'لا تشارك الرمز إلا بعد وصول الحرفي لموقعك الفعلي.' : 'Only share when craftsman is at your door.')
                  : (isAr ? 'لا تشارك الرمز إلا بعد اختبار وتجربة الإصلاح والتأكد من جودته.' : 'Only share after testing and approving the repair.')}
              </p>
            </div>
          ) : (
            /* If Craftsman View: Input form to enter the code */
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 flex items-center justify-between text-xs">
                <span className="text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {isAr ? 'المحاولات المتبقية:' : 'Attempts Remaining:'}
                </span>
                <Badge variant={remainingAttempts <= 1 ? 'destructive' : 'secondary'} className="font-mono font-bold">
                  {remainingAttempts} / {maxAttempts}
                </Badge>
              </div>

              <div>
                <Label htmlFor="otp-box" className="text-xs font-bold block text-center mb-2">
                  {isAr ? 'اطلب الرمز المكون من 4 أرقام من العميل وأدخله هنا:' : 'Ask customer for 4-digit code:'}
                </Label>
                <Input 
                  id="otp-box"
                  type="text"
                  maxLength={4}
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="font-mono text-3xl text-center tracking-[0.6em] font-black h-14 bg-slate-50 dark:bg-slate-800/80"
                  required
                  autoFocus
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <Button type="button" variant="outline" onClick={onClose} disabled={isVerifying}>
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button 
                  type="submit" 
                  disabled={isVerifying || inputCode.length < 4}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                >
                  {isVerifying ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {isAr ? 'جاري التحقق...' : 'Verifying...'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4" />
                      {isAr ? 'تأكيد الرمز والمتابعة' : 'Verify & Continue'}
                    </span>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}

          {userRole === 'customer' && (
            <DialogFooter className="pt-2">
              <Button type="button" onClick={onClose} className="w-full bg-slate-900 text-white hover:bg-slate-800">
                {isAr ? 'فهمت' : 'Done'}
              </Button>
            </DialogFooter>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
